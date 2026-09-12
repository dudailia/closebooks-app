import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { BankStatementLine, BookTransaction, MatchedPair } from '@/lib/bank-rec/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const sb = await createClient()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Anthropic API key not set' }, { status: 503 })

  const { unmatchedBankLines, bookTransactions } = await request.json() as {
    unmatchedBankLines: BankStatementLine[]
    bookTransactions: BookTransaction[]
  }
  if (!unmatchedBankLines?.length) return NextResponse.json({ matches: [] })

  const bankList = unmatchedBankLines
    .map(l => `ID:${l.id} | ${l.date} | ${l.type.toUpperCase()} | $${l.amount.toFixed(2)} | "${l.description}"`)
    .join('\n')

  const bookList = bookTransactions
    .map(t => `ID:${t.id} | ${t.date} | ${t.type.toUpperCase()} | $${t.amount.toFixed(2)} | "${t.description}"${t.category ? ` (${t.category})` : ''}`)
    .join('\n')

  const prompt = `You are an expert CPA performing bank reconciliation.

Match each bank transaction to the most likely book transaction(s). Consider:
- Similar amounts (bank service fees may differ by a few cents from book entries)
- Close dates (payroll clears 1-3 days after processing date, checks can take a week)
- Description patterns ("ADP PAYROLL" in bank = "Payroll Expense" in books, "AMZN" = "Amazon", etc.)
- One bank entry may match MULTIPLE book entries (compound: e.g. bank shows total payroll, books show individual payroll lines)

BANK TRANSACTIONS (unmatched):
${bankList}

BOOK TRANSACTIONS (available):
${bookList}

Return a JSON array ONLY (no markdown, no explanation):
[{"bankLineId":"...","bookTransactionIds":["..."],"confidence":0-100,"reason":"one sentence"}]

Rules:
- Only include matches with confidence >= 60
- Each book transaction can only appear in one match
- Return [] if no confident matches found`

  const anthropic = new Anthropic()
  const msg = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let matches: MatchedPair[] = []
  try {
    const parsed = JSON.parse(raw) as Array<{ bankLineId: string; bookTransactionIds: string[]; confidence: number }>
    matches = parsed.map(m => ({ ...m, matchType: 'ai' as const }))
  } catch {
    // Claude returned unparseable output — return empty
  }

  return NextResponse.json({ matches })
}
