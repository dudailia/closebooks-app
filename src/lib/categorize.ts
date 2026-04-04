import Anthropic from '@anthropic-ai/sdk'
import type { Transaction, ChartOfAccounts } from '@/types'

const MODEL = 'claude-sonnet-4-6'
const BATCH_SIZE = 20
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const AUTO_APPROVE_THRESHOLD = 0.85

const SYSTEM_PROMPT = `You are an expert bookkeeper. Given a list of bank transactions and a Chart of Accounts, categorize each transaction to the most appropriate account. Consider the transaction description, amount, and whether it's a debit or credit.

For each transaction, return:
- index: the transaction's index number (as given)
- suggested_category: the account name from the Chart of Accounts
- suggested_account_code: the account code
- confidence: a number from 0 to 1 indicating how confident you are
- reasoning: a brief explanation (1 sentence)

Return ONLY a JSON array with no markdown fences, no explanation, just the raw JSON array. Be conservative — if unsure, set confidence below 0.7 so a human reviews it.`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatChartOfAccounts(coa: ChartOfAccounts[]): string {
  return coa.map((a) => `[${a.code}] ${a.name} (${a.type})`).join('\n')
}

// Use sequential indices instead of raw IDs — Claude reliably echoes small integers,
// whereas it often reformats or truncates long ID strings like "1717234567890-abc1234".
function buildUserPrompt(batch: Transaction[], coa: ChartOfAccounts[]): string {
  const txLines = batch
    .map((t, i) =>
      `${i}: date=${t.date} | description="${t.description}" | amount=${t.amount.toFixed(2)} | type=${t.type}`
    )
    .join('\n')

  return `Chart of Accounts:\n${formatChartOfAccounts(coa)}\n\nTransactions (use the number at the start as "index"):\n${txLines}\n\nReturn a JSON array, one object per transaction, each with fields: index, suggested_category, suggested_account_code, confidence, reasoning.`
}

interface ClaudeItem {
  index: number
  suggested_category: string
  suggested_account_code: string
  confidence: number
  reasoning: string
}

function extractJSON(text: string): ClaudeItem[] {
  // Strip markdown code fences if present
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
  coa: ChartOfAccounts[]
): Promise<ClaudeItem[]> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt = buildUserPrompt(batch, coa)
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
  chartOfAccounts: ChartOfAccounts[]
): Promise<Transaction[]> {
  console.log(`[categorize] categorizeTransactions called: ${transactions.length} tx, ${chartOfAccounts.length} accounts`)

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
      items = await categorizeBatch(batch, chartOfAccounts)
    } catch (err) {
      console.error(`[categorize] Batch ${batchNum} failed entirely:`, err)
      // Flag all transactions in the failed batch and continue
      for (const tx of batch) results.push({ ...tx, status: 'flagged' })
      continue
    }

    // Map results back by index (0-based position within this batch)
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

      const confidence = Math.min(1, Math.max(0, Number(suggestion.confidence) || 0))
      const status = confidence >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending'

      console.log(
        `[categorize] [${j}] "${tx.description}" → [${suggestion.suggested_account_code}] "${suggestion.suggested_category}" conf=${Math.round(confidence * 100)}% status=${status}`
      )

      results.push({
        ...tx,
        suggested_category: suggestion.suggested_category,
        suggested_account_code: suggestion.suggested_account_code,
        confidence,
        status,
      })
    }

    console.log(`[categorize] Batch ${batchNum} done. Running total: ${results.length} results`)
  }

  console.log(`[categorize] All batches complete. Total results: ${results.length}`)
  return results
}
