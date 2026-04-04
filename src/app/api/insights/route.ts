import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export interface Insight {
  title: string
  insight: string
  type: 'warning' | 'opportunity' | 'info'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const bracket = text.match(/\[[\s\S]*\]/)
  if (bracket) return bracket[0]
  return text.trim()
}

// ---------------------------------------------------------------------------
// POST /api/insights
//
// Body (mode = 'monthly'):
//   { mode: 'monthly', clientName: string, transactions: Transaction[] }
//
// Body (mode = 'trends'):
//   { mode: 'trends', clientName: string, months: { label: string, totalDebits: number, totalCredits: number, categories: Record<string, number>, txCount: number }[] }
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const mode       = body.mode ?? 'monthly'
  const clientName = (body.clientName as string) || 'the client'

  // ── Build prompt ────────────────────────────────────────────────────────
  let prompt: string

  if (mode === 'trends') {
    // Multi-month trend analysis
    const months = body.months as {
      label: string
      totalDebits: number
      totalCredits: number
      categories: Record<string, number>
      txCount: number
    }[]

    const monthSummary = months
      .map((m) => {
        const topCats = Object.entries(m.categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cat, amt]) => `  ${cat}: $${amt.toLocaleString('en-US', { maximumFractionDigits: 0 })}`)
          .join('\n')
        return `=== ${m.label} (${m.txCount} transactions) ===\nTotal debits: $${m.totalDebits.toLocaleString('en-US', { maximumFractionDigits: 0 })} | Total credits: $${m.totalCredits.toLocaleString('en-US', { maximumFractionDigits: 0 })}\nTop categories:\n${topCats}`
      })
      .join('\n\n')

    prompt = `You are a senior CPA reviewing multi-month financial trends for ${clientName}.

Based on this data from ${months.length} months of closes, provide 3–5 brief actionable insights. Focus on:
- Spending trends (growing/shrinking categories)
- Revenue patterns or anomalies
- Tax planning opportunities across months
- Missing or irregular expected transactions
- Cash flow patterns

Keep each insight to 1–2 sentences. Be specific with numbers where visible.
Return ONLY a valid JSON array — no markdown, no explanation.
Format: [{"title":"...","insight":"...","type":"warning"|"opportunity"|"info"}]

Monthly data:
${monthSummary}`

  } else {
    // Single-month analysis
    type TxRow = { date: string; description: string; amount: number; type: string; suggested_category: string; final_category?: string; status: string }
    const transactions = (body.transactions as TxRow[]) ?? []

    if (transactions.length === 0) {
      return NextResponse.json({ insights: [] })
    }

    // Build compact table (most tokens come from description repetition — keep it tight)
    const rows = transactions
      .slice(0, 150)  // cap at 150 rows to stay within token budget
      .map((t) => {
        const cat = t.final_category || t.suggested_category || 'Uncategorized'
        const sign = t.type === 'debit' ? '-' : '+'
        return `${t.date} | ${t.description.slice(0, 40).padEnd(40)} | ${sign}$${t.amount.toFixed(2).padStart(10)} | ${cat}`
      })
      .join('\n')

    const totalDebits  = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
    const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
    const flagged      = transactions.filter((t) => t.status === 'flagged').length

    prompt = `You are a senior bookkeeper reviewing ${clientName}'s monthly bank statement.
Summary: ${transactions.length} transactions | Total outflows: $${totalDebits.toFixed(2)} | Total inflows: $${totalCredits.toFixed(2)} | Flagged: ${flagged}

Based on these categorized transactions, provide 3–5 brief actionable insights. Look for:
- Unusual or unexpected spending patterns
- Possible missing transactions (e.g., expected recurring payments absent)
- Tax deduction opportunities (travel, meals, home office, equipment)
- Budget concerns (large one-time expenses, fee spikes)
- Positive patterns worth noting (consistent revenue, payroll on schedule)

Keep each insight to 1–2 sentences. Be specific — mention amounts and vendor names where relevant.
Return ONLY a valid JSON array — no markdown, no explanation.
Format: [{"title":"...","insight":"...","type":"warning"|"opportunity"|"info"}]

Transactions (Date | Description | Amount | Category):
${rows}`
  }

  // ── Call Claude ──────────────────────────────────────────────────────────
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',  // Haiku: fast + cheap for structured extraction
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content.find((c) => c.type === 'text')?.text ?? '[]'
    const json = extractJson(text)
    const raw  = JSON.parse(json) as Insight[]

    if (!Array.isArray(raw)) throw new Error('Not an array')

    // Normalise types
    const insights: Insight[] = raw.map((item) => ({
      title:   String(item.title   ?? 'Insight'),
      insight: String(item.insight ?? ''),
      type:    (['warning', 'opportunity', 'info'] as const).includes(item.type as never)
               ? item.type
               : 'info',
    }))

    return NextResponse.json({ insights })
  } catch (err) {
    return NextResponse.json(
      { error: `Could not generate insights: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 422 }
    )
  }
}
