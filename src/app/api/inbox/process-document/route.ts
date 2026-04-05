// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inbox/process-document
// Uses Claude Haiku to extract structured data from receipts / invoices / statements
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// ─── Prompt builders ─────────────────────────────────────────────────────────

const RECEIPT_INVOICE_PROMPT = `Extract all data from this receipt/invoice. Return JSON only, no markdown:
{
  "merchant_name": string,
  "amount": number,
  "date": "YYYY-MM-DD",
  "items": [{"description": string, "amount": number}],
  "tax": number | null,
  "category_hint": string,
  "confidence": number
}`

const STATEMENT_PROMPT = `Extract all transactions from this bank statement. Return JSON only, no markdown:
{
  "transactions": [
    {"date": "YYYY-MM-DD", "description": string, "amount": number}
  ]
}`

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      documentType: 'receipt' | 'invoice' | 'statement'
      rawText?: string
      imageBase64?: string
    }

    const { documentType, rawText, imageBase64 } = body

    if (!documentType) {
      return NextResponse.json({ error: 'documentType is required' }, { status: 400 })
    }

    // ── Build message content ─────────────────────────────────────────────────
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png'; data: string } }

    const content: ContentBlock[] = []

    if (imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: imageBase64,
        },
      })
    }

    const promptText = documentType === 'statement' ? STATEMENT_PROMPT : RECEIPT_INVOICE_PROMPT
    const docLabel = rawText ? `\n\nDocument text:\n${rawText}` : ''
    content.push({ type: 'text', text: promptText + docLabel })

    // ── Call Claude Haiku ─────────────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    // Extract text from response
    const rawJson = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    // Strip markdown fences if present
    const clean = rawJson
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const parsed = JSON.parse(clean) as Record<string, unknown>

    // ── Normalise output ─────────────────────────────────────────────────────
    if (documentType === 'statement') {
      return NextResponse.json({
        transactions: parsed.transactions ?? [],
      })
    }

    // receipt / invoice
    return NextResponse.json({
      merchant: parsed.merchant_name ?? 'Unknown',
      amount: parsed.amount ?? 0,
      date: parsed.date ?? new Date().toISOString().split('T')[0],
      items: parsed.items ?? [],
      tax: parsed.tax ?? null,
      category: parsed.category_hint ?? 'Uncategorized',
      confidence: parsed.confidence ?? 0.5,
      matchCandidates: [],
    })
  } catch (err) {
    console.error('[process-document]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
