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

CRITICAL RULE — NEVER USE "MISCELLANEOUS":
Using "Miscellaneous" or any catch-all category means you failed to categorize the transaction. It is ALWAYS better to pick a slightly wrong specific account than to use Miscellaneous. Only use a catch-all if the description is 100% unrecognizable gibberish with no letters resembling any known vendor, service, or transaction type. If you're tempted to use Miscellaneous, try harder — you will almost always find a match.

KEYWORD RULES — apply these with high confidence whenever a description matches:
- "PAYROLL", "GUSTO", "ADP", "PAYCHEX" → Payroll & Wages, confidence 0.99
- "PAYROLL TAX", "FICA", "FUTA", "941", "940" → Payroll Tax Expense, confidence 0.97
- "TAX PAYMENT", "IRS", "STATE TAX", "FRANCHISE TAX" → Taxes Payable or Tax Expense, confidence 0.95
- "DEPOSIT", "PAYMENT FROM", "CLIENT PAYMENT", "WIRE IN", "INCOMING WIRE", "ACH CREDIT", "INVOICE PMT" → nearest Revenue account (Service Revenue, Sales Revenue, Consulting Revenue), confidence 0.92+
- "RENT", "LEASE" → Rent & Occupancy, confidence 0.95+
- "ELECTRIC", "GAS COMPANY", "WATER DEPT", "INTERNET", "COMCAST", "VERIZON", "AT&T", "SPECTRUM", "XFINITY", "COX" → Utilities or Internet & Phone, confidence 0.95
- "TRANSFER", "XFER" between own accounts → Transfer Between Accounts or Savings Account, confidence 0.85
- "CREDIT CARD PAYMENT", "AMEX PAYMENT", "VISA PAYMENT", "CC PAYMENT" → Credit Card Payable, confidence 0.97
- "INTEREST EARNED", "INTEREST INCOME", "DIVIDEND" → Interest Income, confidence 0.98
- "BANK SERVICE CHARGE", "BANK FEE", "MONTHLY FEE", "MAINTENANCE FEE", "OVERDRAFT FEE", "WIRE FEE" → Bank Fees & Charges, confidence 0.97
- "LINKEDIN", "ADOBE", "MICROSOFT", "GOOGLE", "DROPBOX", "NOTION", "SLACK", "ZOOM", "GITHUB", "AWS", "FIGMA", "CANVA", "HUBSPOT", "SALESFORCE", "QUICKBOOKS", "XERO" → Subscriptions & Software or Software & SaaS, confidence 0.96
- "FEDEX", "UPS", "USPS", "DHL", "STAMPS.COM", "SHIPPING", "POSTAGE" → Postage & Shipping, confidence 0.96
- "DELTA", "UNITED", "AMERICAN AIRLINES", "SOUTHWEST", "JETBLUE", "MARRIOTT", "HILTON", "HYATT", "AIRBNB", "HOTEL", "UBER", "LYFT", "HERTZ", "ENTERPRISE" → Travel & Entertainment or Travel & Transportation, confidence 0.95
- "OFFICE DEPOT", "STAPLES", "AMAZON" (office supplies context) → Office Supplies, confidence 0.88
- "ATTORNEY", "LEGAL", "LAW FIRM", "PARALEGAL" → Legal & Professional Fees, confidence 0.95
- "ACCOUNTANT", "BOOKKEEPING", "CPA", "AUDIT" → Accounting & Bookkeeping, confidence 0.95
- "INSURANCE", "PROGRESSIVE", "ALLSTATE", "GEICO", "HISCOX", "STATE FARM", "HARTFORD" → Insurance Expense, confidence 0.96
- "STRIPE FEE", "SQUARE FEE", "PAYPAL FEE", "MERCHANT FEE", "PROCESSING FEE" → Bank & Merchant Fees, confidence 0.96
- Any debit with "CLIENT" or "PAYMENT" in description → probably an expense to a vendor — use best-match expense account
- Any credit with "CLIENT", "PAYMENT FROM", or "INVOICE" → Service Revenue or Sales Revenue, confidence 0.92

AMOUNT GUIDANCE:
- Large round-dollar amounts ($1,000–$10,000 debit) are likely rent, payroll, or large vendor payments — look for keyword clues.
- Recurring identical amounts are likely subscriptions.
- Credits/deposits are almost always revenue; debits are almost always expenses.
- Very small amounts under $20 may be bank fees, postage, or minor supplies.

CONFIDENCE CALIBRATION:
- 0.95–0.99: clear keyword or vendor match
- 0.80–0.94: likely correct, minor ambiguity
- 0.65–0.79: plausible, needs human review
- Below 0.65: uncertain — but still pick the BEST specific account, never Miscellaneous

For each transaction, return:
- index: the transaction's index number (as given)
- suggested_category: the account name from the Chart of Accounts (NEVER "Miscellaneous" unless chart has no better option)
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
    throw new Error('No JSON array found in Claude response')
  }
  try {
    return JSON.parse(match[0]) as ClaudeItem[]
  } catch (e) {
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

      const items = extractJSON(content.text)

      return items
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

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
  if (!transactions.length) return []
  if (!chartOfAccounts.length) throw new Error('Chart of accounts is empty.')

  const results: Transaction[] = []

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE)

    let items: ClaudeItem[]
    try {
      items = await categorizeBatch(batch, chartOfAccounts, corrections)
    } catch {
      for (const tx of batch) results.push({ ...tx, status: 'flagged' })
      continue
    }

    const byIndex = new Map(items.map((item) => [item.index, item]))

    for (let j = 0; j < batch.length; j++) {
      const tx = batch[j]
      const suggestion = byIndex.get(j)

      if (!suggestion) {
        results.push({ ...tx, status: 'flagged' })
        continue
      }

      const rawConf  = Math.min(1, Math.max(0, Number(suggestion.confidence) || 0))
      const confidence = calibrateConfidence(tx.description, tx.amount, rawConf)
      const status   = confidence >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending'

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

  }

  return results
}
