import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CategorizationJob, Transaction, CopilotConfig, CopilotRun } from '@/types'
import { resolveAgainstCoa } from '@/lib/coaValidation'
import { requireRouteAccess } from '@/lib/routeSubscription'

const anthropic = new Anthropic()

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // object or array
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const access = await requireRouteAccess(request, { feature: 'full_ai' })
  if (!access.ok) return access.response

  let body: { job: CategorizationJob; config: CopilotConfig } | null = null
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body?.job) {
    return NextResponse.json({ error: 'Missing job.' }, { status: 400 })
  }

  const { job, config } = body
  const threshold     = config?.confidenceThreshold ?? 0.85
  const maxAmount     = config?.maxAutoAmount       ?? 5000
  const flagThreshold = config?.autoFlagThreshold   ?? 0.60

  // Only operate on pending transactions
  const pending = job.transactions.filter((t) => t.status === 'pending')

  if (pending.length === 0) {
    return NextResponse.json({
      autoApproved:    0,
      flagged:         0,
      leftPending:     0,
      totalProcessed:  0,
      updatedTransactions: job.transactions,
      briefing: 'Nothing to do — all transactions have already been reviewed.',
    })
  }

  // ── Step 1: Apply threshold logic to existing pending transactions ────────

  const updatedTransactions: Transaction[] = job.transactions.map((tx) => {
    if (tx.status !== 'pending') return tx

    // High confidence + under amount cap → auto-approve
    if (tx.confidence >= threshold && tx.amount <= maxAmount) {
      const resolved = resolveAgainstCoa(
        {
          suggested_category: tx.suggested_category,
          suggested_account_code: tx.suggested_account_code,
          confidence: tx.confidence,
          reasoning: tx.reasoning,
        },
        tx,
        job.chart_of_accounts,
        threshold
      )

      if (resolved.status !== 'approved') {
        return {
          ...tx,
          suggested_category: resolved.suggested_category,
          suggested_account_code: resolved.suggested_account_code,
          confidence: resolved.confidence,
          status: resolved.status,
          reasoning: resolved.reasoning,
          validation_flags: resolved.validationFlags,
        }
      }

      return {
        ...tx,
        suggested_category: resolved.suggested_category,
        suggested_account_code: resolved.suggested_account_code,
        confidence: resolved.confidence,
        status: 'approved',
        final_category: resolved.suggested_category,
        final_account_code: resolved.suggested_account_code,
        reasoning: resolved.reasoning,
        validation_flags: resolved.validationFlags,
        categorizationSource: 'copilot',
      }
    }

    // Below flag threshold → flag for human
    if (tx.confidence < flagThreshold) {
      return { ...tx, status: 'flagged' }
    }

    // Middle ground → leave pending
    return tx
  })

  const autoApproved   = updatedTransactions.filter((t) => t.status === 'approved' && pending.some((p) => p.id === t.id)).length
  const newlyFlagged   = updatedTransactions.filter((t) => t.status === 'flagged'  && pending.some((p) => p.id === t.id)).length
  const stillPending   = updatedTransactions.filter((t) => t.status === 'pending').length

  // ── Step 2: Generate AI briefing ──────────────────────────────────────────

  // Build a compact summary for Claude
  const flaggedTxs = updatedTransactions.filter((t) => t.status === 'flagged').slice(0, 10)
  const pendingTxs = updatedTransactions.filter((t) => t.status === 'pending').slice(0, 10)

  const flaggedSummary = flaggedTxs.map((t) =>
    `• ${t.description} — $${t.amount.toFixed(2)} (${t.type}, confidence ${(t.confidence * 100).toFixed(0)}%)`
  ).join('\n')

  const pendingSummary = pendingTxs.map((t) =>
    `• ${t.description} — $${t.amount.toFixed(2)} (${t.type}, confidence ${(t.confidence * 100).toFixed(0)}%)`
  ).join('\n')

  const prompt = `You are an AI assistant for a CPA firm reviewing the month-end close for ${job.client_name}.

The Copilot just processed ${pending.length} pending transactions:
- Auto-approved: ${autoApproved} (confidence ≥ ${Math.round(threshold * 100)}%, amount ≤ $${maxAmount.toLocaleString()})
- Flagged for human review: ${newlyFlagged}
- Still pending (middle confidence): ${stillPending}

${flaggedTxs.length > 0 ? `Flagged items requiring CPA attention:\n${flaggedSummary}\n` : ''}
${pendingTxs.length > 0 ? `Items still pending review:\n${pendingSummary}\n` : ''}

Write a concise 2-3 sentence CPA briefing. Be specific about what needs attention and why.
Use plain language. Do not use accounting jargon. Start directly with the key finding.
If everything was auto-approved with no flags, say so enthusiastically.

Return ONLY a JSON object: { "briefing": "your text here" }`

  let briefing = `Copilot processed ${pending.length} transactions: ${autoApproved} auto-approved, ${newlyFlagged} flagged for your review, ${stillPending} left pending.`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content.find((c) => c.type === 'text')?.text ?? ''
    const parsed = JSON.parse(extractJson(text))
    if (typeof parsed.briefing === 'string' && parsed.briefing.trim()) {
      briefing = parsed.briefing.trim()
    }
  } catch {
    // Non-fatal — use fallback briefing
  }

  const run: Omit<CopilotRun, 'id' | 'startedAt' | 'completedAt'> = {
    jobId:               job.id,
    clientName:          job.client_name,
    status:              'complete',
    autoApproved,
    flagged:             newlyFlagged,
    leftPending:         stillPending,
    totalProcessed:      pending.length,
    briefing,
    confidenceThreshold: threshold,
    error:               null,
  }

  return NextResponse.json({
    ...run,
    updatedTransactions,
    briefing,
  })
}
