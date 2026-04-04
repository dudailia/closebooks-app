import Anthropic from '@anthropic-ai/sdk'
import type { Transaction, ChartOfAccounts } from '@/types'

const MODEL = 'claude-sonnet-4-6'
const BATCH_SIZE = 20
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const AUTO_APPROVE_THRESHOLD = 0.85

// Plain object shape — mirrors Correction from corrections.ts but without the
// savedAt field and without a client-side localStorage dependency.
export interface CorrectionHint {
  description: string
  fromCategory: string
  toCategory: string
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert bookkeeper with 20 years of experience. Given a list of bank transactions and a Chart of Accounts, categorize each transaction to the most appropriate account.

KEYWORD RULES — apply these with high confidence whenever a description matches:
- "PAYROLL", "GUSTO", "ADP" → Payroll & Wages, confidence 0.99
- "PAYROLL TAX", "FICA", "FUTA" → Payroll Tax Expense, confidence 0.97
- "DEPOSIT", "PAYMENT FROM", "CLIENT PAYMENT", "WIRE TRANSFER" (credit) → nearest Revenue account, confidence 0.90+
- "RENT", "LEASE" → Rent & Occupancy, confidence 0.95+
- "ELECTRIC", "GAS COMPANY", "WATER DEPT", "INTERNET", "COMCAST", "VERIZON", "AT&T", "SPECTRUM", "XFINITY" → Utilities or Internet & Phone
- "TRANSFER", "XFER" with no clear counterparty → flag as ambiguous (confidence below 0.50)
- Recognizable subscription/SaaS vendors (NOTION, SLACK, ZOOM, ADOBE, FIGMA, AWS, GOOGLE WORKSPACE, GITHUB, etc.) → Software & SaaS
- Airlines, hotels, rideshare (UBER, LYFT), parking garages → Travel & Transportation
- Restaurants, cafes, food delivery → Meals & Entertainment
- Insurance company names (PROGRESSIVE, ALLSTATE, GEICO, HISCOX, etc.) → Insurance
- Bank fees, merchant processing fees (STRIPE, SQUARE, PAYPAL fees) → Bank & Merchant Fees

AMOUNT GUIDANCE:
- Large round-dollar amounts ($1,000 – $10,000 debit) are likely rent, payroll, or large vendor payments — look for keyword clues.
- Recurring identical amounts are likely subscriptions.
- Credits/deposits are almost always revenue; debits are almost always expenses.
- Very small amounts under $20 may be ambiguous — lower confidence slightly to prompt human review.

CONFIDENCE CALIBRATION:
- 0.95–0.99: clear keyword or vendor match with no ambiguity
- 0.80–0.94: likely correct but some ambiguity
- 0.65–0.79: plausible but needs human review
- Below 0.65: uncertain — a human will review

For each transaction, return:
- index: the transaction's index number (as given)
- suggested_category: the account name from the Chart of Accounts
- suggested_account_code: the account code
- confidence: a number from 0 to 1
- reasoning: one sentence explaining why you chose this category

Return ONLY a JSON array. No markdown fences, no preamble, no explanation — just the raw JSON array.`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatChartOfAccounts(coa: ChartOfAccounts[]): string {
  return coa.map((a) => `[${a.code}] ${a.name} (${a.type})`).join('\n')
}

function formatCorrections(corrections: CorrectionHint[]): string {
  if (corrections.length === 0) return ''
  const lines = corrections
    .map((c) => `- "${c.description}" was recategorized from "${c.fromCategory}" to "${c.toCategory}"`)
    .join('\n')
  return `\nLearning from this firm's past corrections (apply these patterns to similar transactions):\n${lines}\n`
}

// Use sequential indices instead of raw IDs — Claude reliably echoes small integers,
// whereas it often reformats or truncates long ID strings.
function buildUserPrompt(
  batch: Transaction[],
  coa: ChartOfAccounts[],
  corrections: CorrectionHint[]
): string {
  const txLines = batch
    .map((t, i) =>
      `${i}: date=${t.date} | description="${t.description}" | amount=${t.amount.toFixed(2)} | type=${t.type}`
    )
    .join('\n')

  const correctionBlock = formatCorrections(corrections)

  return `Chart of Accounts:\n${formatChartOfAccounts(coa)}\n${correctionBlock}\nTransactions (use the number at the start as "index"):\n${txLines}\n\nReturn a JSON array, one object per transaction, each with fields: index, suggested_category, suggested_account_code, confidence, reasoning.`
}

// ---------------------------------------------------------------------------
// Confidence calibration — applied after Claude responds
// ---------------------------------------------------------------------------

function calibrateConfidence(description: string, amount: number, rawConf: number): number {
  let conf = rawConf

  // Small amounts are often ambiguous
  if (amount < 20) {
    conf -= 0.08
  }

  // Generic descriptions: single word, all digits, or suspiciously short
  const desc = description.trim()
  const wordCount = desc.split(/\s+/).filter(Boolean).length
  const allDigits = /^\d+$/.test(desc)
  if (wordCount <= 1 || allDigits || desc.length <= 4) {
    conf = Math.min(conf, 0.60)
  }

  return Math.min(1, Math.max(0, conf))
}

// ---------------------------------------------------------------------------
// JSON parsing
// ---------------------------------------------------------------------------

interface ClaudeItem {
  index: number
  suggested_category: string
  suggested_account_code: string
  confidence: number
  reasoning: string
}

function extractJSON(text: string): ClaudeItem[] {
  const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const match = stripped.match(/\[[\s\S]*\]/)
  if (!match) {
    console.error('[categorize] Could not find JSON array in response. Full text:', text)
    throw new Error('No JSON array found in Claude response')
  }
  try {
    return JSON.parse(match[0]) as ClaudeItem[]
  } catch (e) {
    console.error('[categorize] JSON.parse failed. Attempted to parse:', match[0].slice(0, 300))
    throw new Error(`Failed to parse Claude JSON: ${(e as Error).message}`)
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Batch call with retry
// ---------------------------------------------------------------------------

async function categorizeBatch(
  batch: Transaction[],
  coa: ChartOfAccounts[],
  corrections: CorrectionHint[]
): Promise<ClaudeItem[]> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt = buildUserPrompt(batch, coa, corrections)
      console.log(`[categorize] Attempt ${attempt}/${MAX_RETRIES} — calling ${MODEL} with ${batch.length} transactions`)
      console.log('[categorize] User prompt (first 600 chars):\n', prompt.slice(0, 600))

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error(`Unexpected Claude content type: ${content.type}`)
      }

      console.log('[categorize] Raw Claude response:\n', content.text)

      const items = extractJSON(content.text)
      console.log(`[categorize] Parsed ${items.length} items from Claude`)
      if (items[0]) console.log('[categorize] First item:', JSON.stringify(items[0]))

      return items
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error(`[categorize] Attempt ${attempt} failed:`, lastError.message)

      const isFatal =
        lastError.message.includes('No JSON array') ||
        lastError.message.includes('Failed to parse')

      if (isFatal || attempt === MAX_RETRIES) break
      await sleep(RETRY_DELAY_MS * 2 ** (attempt - 1))
    }
  }

  throw lastError ?? new Error('All retries exhausted')
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

// Initialise the client once. The SDK reads ANTHROPIC_API_KEY from process.env automatically.
const client = new Anthropic()

export async function categorizeTransactions(
  transactions: Transaction[],
  chartOfAccounts: ChartOfAccounts[],
  corrections: CorrectionHint[] = []
): Promise<Transaction[]> {
  console.log(
    `[categorize] categorizeTransactions called: ${transactions.length} tx, ` +
    `${chartOfAccounts.length} accounts, ${corrections.length} correction hints`
  )

  if (!transactions.length) return []
  if (!chartOfAccounts.length) throw new Error('Chart of accounts is empty.')

  const results: Transaction[] = []

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(transactions.length / BATCH_SIZE)

    console.log(`[categorize] Processing batch ${batchNum}/${totalBatches} (${batch.length} transactions)`)

    let items: ClaudeItem[]
    try {
      items = await categorizeBatch(batch, chartOfAccounts, corrections)
    } catch (err) {
      console.error(`[categorize] Batch ${batchNum} failed entirely:`, err)
      for (const tx of batch) results.push({ ...tx, status: 'flagged' })
      continue
    }

    const byIndex = new Map(items.map((item) => [item.index, item]))
    console.log(`[categorize] Index keys returned by Claude:`, Array.from(byIndex.keys()))

    for (let j = 0; j < batch.length; j++) {
      const tx = batch[j]
      const suggestion = byIndex.get(j)

      if (!suggestion) {
        console.warn(`[categorize] No result for index ${j} ("${tx.description}") — flagging`)
        results.push({ ...tx, status: 'flagged' })
        continue
      }

      const rawConf  = Math.min(1, Math.max(0, Number(suggestion.confidence) || 0))
      const confidence = calibrateConfidence(tx.description, tx.amount, rawConf)
      const status   = confidence >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending'

      console.log(
        `[categorize] [${j}] "${tx.description}" → [${suggestion.suggested_account_code}] ` +
        `"${suggestion.suggested_category}" rawConf=${Math.round(rawConf * 100)}% ` +
        `calibrated=${Math.round(confidence * 100)}% status=${status}`
      )

      results.push({
        ...tx,
        suggested_category:    suggestion.suggested_category,
        suggested_account_code: suggestion.suggested_account_code,
        confidence,
        status,
        // Carry reasoning through for display in the review UI
        ...({ reasoning: suggestion.reasoning } as object),
      })
    }

    console.log(`[categorize] Batch ${batchNum} done. Running total: ${results.length} results`)
  }

  console.log(`[categorize] All batches complete. Total results: ${results.length}`)
  return results
}
