import Anthropic from '@anthropic-ai/sdk'
import type { ParsedStatement } from './types'

const PROMPT = `Parse this bank statement. Return ONLY a JSON object with this exact shape (no markdown fences):
{"bank_name":"string","account_number_last4":"string or null","statement_date":"YYYY-MM-DD","beginning_balance":0,"ending_balance":0,"lines":[{"date":"YYYY-MM-DD","description":"string","amount":0.00,"type":"debit or credit","reference_number":"string or null"}]}
Rules: amount is always positive. type="debit" for withdrawals/charges/payments, "credit" for deposits/credits. Skip header/footer/summary rows. Only transaction lines.`

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

export async function parsePDFText(text: string): Promise<ParsedStatement> {
  const client = new Anthropic()
  const msg = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{ role: 'user', content: `${PROMPT}\n\nStatement text:\n${text.slice(0, 50000)}` }],
  })
  const raw = (msg.content[0] as { type: string; text: string }).text
  return JSON.parse(cleanJson(raw)) as ParsedStatement
}

export async function parsePDFVision(base64Pages: string[]): Promise<ParsedStatement> {
  const client = new Anthropic()
  const images = base64Pages.slice(0, 5).map(data => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
  }))
  const msg = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{ role: 'user', content: [...images, { type: 'text' as const, text: PROMPT }] }],
  })
  const raw = (msg.content[0] as { type: string; text: string }).text
  return JSON.parse(cleanJson(raw)) as ParsedStatement
}
