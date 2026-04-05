import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Transaction } from '@/types'

const anthropic = new Anthropic()

// Claude returns bare JSON — pull it out even if wrapped in a markdown fence
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const bracket = text.match(/\[[\s\S]*\]/)
  if (bracket) return bracket[0]
  return text.trim()
}

function normaliseDate(raw: string): string {
  if (!raw) return ''
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return raw
}

export async function POST(request: Request) {
  let base64: string
  try {
    const body = await request.json()
    base64 = body.base64
    if (!base64) throw new Error('Missing base64')
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // ── 1. Extract text from PDF ──────────────────────────────────────────────
  let pdfText = ''
  let pageCount = 0
  try {
    // Dynamic import keeps pdf-parse out of the client bundle
    // Handle both CJS default export and ESM named export
    const mod      = await import('pdf-parse')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (mod as any).default ?? mod
    const buffer   = Buffer.from(base64, 'base64')
    const result   = await pdfParse(buffer)
    pdfText    = result.text ?? ''
    pageCount  = result.numpages ?? 0
  } catch (err) {
    return NextResponse.json(
      { error: `PDF extraction failed: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 422 }
    )
  }

  if (!pdfText.trim()) {
    return NextResponse.json(
      { error: 'No text could be extracted from this PDF. It may be a scanned image — please export as CSV from your bank instead.' },
      { status: 422 }
    )
  }

  // ── 2. Ask Claude to parse transactions ───────────────────────────────────
  const prompt = `Extract all bank transactions from the following bank statement text.

For each transaction return exactly these fields:
- date: ISO format YYYY-MM-DD
- description: the full transaction description/memo as it appears
- amount: a positive number (absolute value)
- type: "debit" for money leaving the account (withdrawals, payments, fees), "credit" for money entering the account (deposits, payments received)

Return ONLY a valid JSON array with no explanation, no markdown fences, no other text.
Example: [{"date":"2024-03-15","description":"WALMART STORE #4821","amount":47.23,"type":"debit"}]

Skip balance-only rows, opening/closing balance lines, and header rows.
Handle all common formats: single amount column (negative = debit), separate debit/credit columns, or descriptive text like "Dr"/"Cr".

Bank statement text:
${pdfText.slice(0, 60000)}`

  let rawTxs: { date: string; description: string; amount: number; type: string }[] = []
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content.find((c) => c.type === 'text')?.text ?? ''
    const json = extractJson(text)
    rawTxs     = JSON.parse(json)

    if (!Array.isArray(rawTxs)) throw new Error('Response is not an array')
  } catch (err) {
    return NextResponse.json(
      { error: `Could not parse transaction data: ${err instanceof Error ? err.message : 'unexpected Claude response'}` },
      { status: 422 }
    )
  }

  // ── 3. Map to Transaction[] ───────────────────────────────────────────────
  const errors: string[] = []
  const transactions: Transaction[] = []

  rawTxs.forEach((raw, i) => {
    if (!raw.description || raw.amount == null) {
      errors.push(`Row ${i + 1}: missing description or amount — skipped.`)
      return
    }

    const rawNum = Number(raw.amount)
    const amount = Math.abs(rawNum)
    if (isNaN(amount)) {
      errors.push(`Row ${i + 1}: invalid amount "${raw.amount}" — skipped.`)
      return
    }

    // Trust sign from parsed value if no explicit type field: positive = credit, negative = debit
    const type: 'debit' | 'credit' = raw.type === 'credit' ? 'credit'
      : raw.type === 'debit' ? 'debit'
      : rawNum >= 0 ? 'credit' : 'debit'

    transactions.push({
      id:                   `pdf-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      date:                 normaliseDate(String(raw.date ?? '')),
      description:          String(raw.description).trim(),
      original_description: String(raw.description).trim(),
      amount,
      type,
      suggested_category:    '',
      suggested_account_code: '',
      confidence:            0,
      status:                'pending',
    })
  })

  return NextResponse.json({ transactions, errors, pageCount })
}
