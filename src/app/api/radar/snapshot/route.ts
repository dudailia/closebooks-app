import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Transaction } from '@/types'

const anthropic = new Anthropic()

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SnapshotRequest {
  clientId: string
  clientName?: string
  transactions?: Transaction[]
  cashBalance?: number
}

interface RadarSnapshot {
  cashBalance: number
  monthlyBurn: number
  arDays: number
  runwayDays: number
  status: 'green' | 'yellow' | 'red'
  statusReason: string
  riskFlags: string[]
  alertEmail: {
    subject: string
    body: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return obj[0]
  return text.trim()
}

function computeMetrics(transactions: Transaction[], cashBalance: number) {
  // Last 90 days for burn
  const now = new Date()
  const cutoff90 = new Date(now)
  cutoff90.setDate(cutoff90.getDate() - 90)
  const cutoffStr = cutoff90.toISOString().slice(0, 10)

  const recent = transactions.filter((t) => t.date >= cutoffStr)

  const totalDebits = recent
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0)
  const totalCredits = recent
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0)

  const monthlyBurn = Math.max(0, (totalDebits - totalCredits) / 3)
  const runwayDays =
    monthlyBurn > 0 ? Math.round((cashBalance / monthlyBurn) * 30) : 365

  const credits90 = recent.filter((t) => t.type === 'credit')
  const avgDailyRevenue =
    credits90.reduce((s, t) => s + t.amount, 0) / 90
  const avgCreditAmount =
    credits90.length > 0
      ? credits90.reduce((s, t) => s + t.amount, 0) / credits90.length
      : 0
  const arDays =
    avgDailyRevenue > 0 ? Math.round(avgCreditAmount / avgDailyRevenue) : 0

  return { monthlyBurn, runwayDays, arDays }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/radar/snapshot
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse> {
  let body: SnapshotRequest
  try {
    body = (await request.json()) as SnapshotRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { clientId, clientName = 'Client', transactions = [], cashBalance = 0 } = body

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required.' }, { status: 400 })
  }

  // Pre-compute metrics to feed Claude
  const { monthlyBurn, runwayDays, arDays } = computeMetrics(transactions, cashBalance)

  // Summarize transaction categories
  const catMap = new Map<string, { debits: number; credits: number }>()
  for (const tx of transactions) {
    const cat = tx.final_category ?? tx.suggested_category ?? 'Uncategorized'
    const e = catMap.get(cat) ?? { debits: 0, credits: 0 }
    catMap.set(cat, {
      debits: e.debits + (tx.type === 'debit' ? tx.amount : 0),
      credits: e.credits + (tx.type === 'credit' ? tx.amount : 0),
    })
  }

  const categorySummary = Array.from(catMap.entries())
    .map(([cat, { debits, credits }]) => `  - ${cat}: $${credits.toFixed(0)} in / $${debits.toFixed(0)} out`)
    .join('\n')

  const prompt = `You are a CPA analyzing the financial health of a small business client.

Client: ${clientName}
Client ID: ${clientId}

Pre-calculated Metrics:
- Cash Balance: $${cashBalance.toFixed(2)}
- Monthly Burn Rate: $${monthlyBurn.toFixed(2)}
- AR Days: ${arDays}
- Cash Runway: ${runwayDays} days

Transaction Category Summary (last 90 days):
${categorySummary || '  (no transactions)'}

Total transactions analyzed: ${transactions.length}

Based on this data:
1. Determine the radar status: "green" (runway > 90 days, AR < 45 days), "yellow" (runway 30-90 days OR AR 45-60 days), or "red" (runway < 30 days OR AR > 60 days OR negative cash)
2. Write a concise one-sentence reason for the status
3. List 2-4 specific risk flags (empty array if green)
4. Draft a professional, empathetic client alert email (subject + body) — only if status is yellow or red

Return ONLY valid JSON in this exact shape:
{
  "status": "green" | "yellow" | "red",
  "statusReason": "One sentence explanation",
  "riskFlags": ["flag 1", "flag 2"],
  "alertEmail": {
    "subject": "Email subject line",
    "body": "Full email body text"
  }
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(extractJson(rawText)) as {
      status: 'green' | 'yellow' | 'red'
      statusReason: string
      riskFlags: string[]
      alertEmail: { subject: string; body: string }
    }

    const snapshot: RadarSnapshot = {
      cashBalance,
      monthlyBurn,
      arDays,
      runwayDays,
      status: parsed.status,
      statusReason: parsed.statusReason,
      riskFlags: parsed.riskFlags ?? [],
      alertEmail: parsed.alertEmail ?? { subject: '', body: '' },
    }

    return NextResponse.json(snapshot)
  } catch (err) {
    console.error('[radar/snapshot] Claude error:', err)

    // Fallback: compute status locally without Claude
    let status: 'green' | 'yellow' | 'red' = 'green'
    if (cashBalance <= 0 || runwayDays < 30) status = 'red'
    else if (runwayDays < 90 || arDays > 60) status = 'yellow'

    const snapshot: RadarSnapshot = {
      cashBalance,
      monthlyBurn,
      arDays,
      runwayDays,
      status,
      statusReason:
        status === 'red'
          ? 'Critical: cash runway below 30 days'
          : status === 'yellow'
          ? 'Caution: runway under 90 days or elevated AR'
          : 'Healthy cash position and receivables',
      riskFlags:
        status !== 'green'
          ? [`Runway: ${runwayDays} days`, `AR Days: ${arDays}`]
          : [],
      alertEmail: { subject: '', body: '' },
    }

    return NextResponse.json(snapshot)
  }
}
