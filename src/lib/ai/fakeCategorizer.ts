// A stand-in for the Anthropic client, for local end-to-end tests only.
//
// It reads the same user prompt categorize.ts builds (chart lines and numbered
// transaction lines) and answers with a JSON array in the same shape Claude
// returns, picked by keyword. No network calls.
//
// It is used only when CLOSEBOOKS_FAKE_MODEL=1 and the app is not running on
// Vercel (Vercel sets VERCEL=1 at build and run time), so a deployed build
// can never answer with fake categories.

import type Anthropic from '@anthropic-ai/sdk'

export function fakeModelEnabled(): boolean {
  return process.env.CLOSEBOOKS_FAKE_MODEL === '1' && !process.env.VERCEL
}

interface ChartLine { code: string; name: string; type: string }
interface TxLine { index: number; description: string; type: 'debit' | 'credit' }

// Keyword → account code in the 34-account Standard Small Business chart.
// The confidence is what the fake "model" reports before the app calibrates it.
const KEYWORDS: { match: RegExp; code: string; confidence: number }[] = [
  { match: /gusto des:tax|payroll tax/i, code: '2300', confidence: 0.9 },
  { match: /gusto|payroll/i, code: '5100', confidence: 0.97 },
  { match: /rent|wework|lease/i, code: '5200', confidence: 0.97 },
  { match: /verizon|spectrum|comcast|electric|utility/i, code: '5300', confidence: 0.96 },
  { match: /staples|office depot|amazon/i, code: '5400', confidence: 0.88 },
  { match: /google ads|meta platforms|facebk|linkedin/i, code: '5500', confidence: 0.95 },
  { match: /insurance|bcbs|hiscox|ins prem/i, code: '5600', confidence: 0.96 },
  { match: /upwork|attorney|legal|cpa/i, code: '5700', confidence: 0.9 },
  { match: /uber|lyft|southwest|delta|hotel|starbucks|doordash/i, code: '5800', confidence: 0.95 },
  { match: /maintenance fee|bank fee|service charge|wire fee/i, code: '6000', confidence: 0.97 },
  { match: /zoom|slack|notion|figma|adobe|gsuite|aws|amazon web services|quickbooks|mailchimp/i, code: '6100', confidence: 0.96 },
  { match: /comptroller|sales tax/i, code: '2200', confidence: 0.92 },
  { match: /interest earned/i, code: '4200', confidence: 0.98 },
  { match: /stripe|deposit|payment from|kestrel/i, code: '4100', confidence: 0.94 },
]

function parseChart(prompt: string): ChartLine[] {
  const out: ChartLine[] = []
  for (const m of prompt.matchAll(/^\[([^\]]+)\] (.+) \((\w+)\)$/gm)) {
    out.push({ code: m[1], name: m[2], type: m[3] })
  }
  return out
}

function parseTransactions(prompt: string): TxLine[] {
  const out: TxLine[] = []
  for (const m of prompt.matchAll(/^(\d+): date=.* \| description="(.*)" \| amount=[\d.]+ \| type=(debit|credit)$/gm)) {
    out.push({ index: Number(m[1]), description: m[2], type: m[3] as 'debit' | 'credit' })
  }
  return out
}

function pick(tx: TxLine, chart: ChartLine[]) {
  const byCode = new Map(chart.map((a) => [a.code, a]))
  for (const k of KEYWORDS) {
    const account = byCode.get(k.code)
    if (account && k.match.test(tx.description)) return { account, confidence: k.confidence }
  }
  // Nothing matched: the first revenue account for money in, the first
  // expense account for money out, at a confidence that goes to review.
  const fallbackType = tx.type === 'credit' ? 'revenue' : 'expense'
  const account = chart.find((a) => a.type === fallbackType) ?? chart[0]
  return { account, confidence: 0.7 }
}

export function fakeCategorize(prompt: string): string {
  const chart = parseChart(prompt)
  const items = parseTransactions(prompt).map((tx) => {
    const { account, confidence } = pick(tx, chart)
    return {
      index: tx.index,
      suggested_category: account?.name ?? 'Uncategorized',
      suggested_account_code: account?.code ?? '',
      confidence,
      reasoning: 'Fake model for local tests: keyword match.',
    }
  })
  return JSON.stringify(items)
}

export const fakeAnthropicClient = {
  messages: {
    async create(params: { messages: { role: string; content: unknown }[] }) {
      const content = params.messages[0]?.content
      const prompt = typeof content === 'string'
        ? content
        : Array.isArray(content) ? content.map((b: { text?: string }) => b.text ?? '').join('') : ''
      return {
        content: [{ type: 'text', text: fakeCategorize(prompt) }],
        usage: { input_tokens: 0, output_tokens: 0 },
      }
    },
  },
} as unknown as Pick<Anthropic, 'messages'>
