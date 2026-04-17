import type { ChartOfAccounts } from '@/types'
import type { CorrectionHint } from '@/lib/categorization/types'

export interface ClientContext {
  clientName: string
  industry?: string
  accrualOrCash?: 'accrual' | 'cash'
  fiscalYearEnd?: string
}

export interface LearnedRuleLine {
  vendor_key: string
  description_pattern?: string | null
  correct_account_code: string
  correct_account_name: string
  hit_count?: number
}

export function buildSystemPrompt(ctx: {
  client: ClientContext
  chartOfAccounts: ChartOfAccounts[]
  historicalRules: LearnedRuleLine[]
  correctionHints: CorrectionHint[]
}): string {
  const coaJson = JSON.stringify(
    ctx.chartOfAccounts.map((a) => ({ code: a.code, name: a.name, type: a.type })),
    null,
    0
  )

  const rulesJson =
    ctx.historicalRules.length > 0
      ? JSON.stringify(
          ctx.historicalRules.map((r) => ({
            vendor_key: r.vendor_key,
            description_pattern: r.description_pattern,
            correct_account_code: r.correct_account_code,
            correct_account_name: r.correct_account_name,
            hit_count: r.hit_count ?? 1,
          })),
          null,
          2
        )
      : '[]'

  const correctionsBlock =
    ctx.correctionHints.length > 0
      ? ctx.correctionHints
          .map(
            (c) =>
              `- Description pattern "${c.description}" was corrected from "${c.fromCategory}" → map to account name "${c.toCategory}"`
          )
          .join('\n')
      : '(none)'

  const industry = ctx.client.industry ?? 'General business'
  const method = ctx.client.accrualOrCash ?? 'accrual'
  const fy = ctx.client.fiscalYearEnd ?? '12-31'

  return `You are an expert CPA performing transaction categorization for a month-end close. You must categorize each transaction to the correct GL account with high precision.

CLIENT CONTEXT:
- Business: ${ctx.client.clientName} (${industry})
- Accounting method: ${method}
- Fiscal year end: ${fy}
- Chart of Accounts (JSON — ONLY these codes are valid):
${coaJson}

LEARNED PATTERNS (from prior closes — apply FIRST when vendor/description matches):
${rulesJson}

RECENT USER CORRECTIONS (same firm — apply when similar descriptions appear):
${correctionsBlock}

CATEGORIZE EACH TRANSACTION:
For each transaction, return one JSON object with:
- "index": number (batch-local index starting at 0)
- "suggested_account_code": string (MUST be exactly one of the "code" values from the chart JSON above)
- "suggested_account_name": string (must match that code's name from the chart)
- "confidence": number from 0 to 100 (integer)
- "reasoning": brief explanation (one sentence)
- "flags": array of zero or more of: "unusual_amount", "new_vendor", "potential_duplicate", "needs_review"
- "tax_relevant": boolean
- "suggested_1099_vendor": boolean (true if payment to an individual/contractor likely needing 1099 consideration)
- "secondary_suggestion": optional { "suggested_account_code", "suggested_account_name", "reasoning" } when ambiguous — only use codes from the chart

RULES:
- NEVER invent account codes. If uncertain among valid codes, lower confidence and add "needs_review" to flags.
- If confidence < 70, include "needs_review" in flags and set confidence accordingly.
- Flag as "unusual_amount" if amount is plausibly > 2× typical for same vendor/description class when inferable from context.
- Flag "potential_duplicate" when another transaction in the same batch has same amount within ±2 calendar days (you only see the batch — flag if suspicious).
- For ambiguous items, provide secondary_suggestion with the runner-up account from the chart.
- Output MUST be a JSON array only, no markdown fences, no commentary.`
}

export function buildUserPrompt(batchLines: string): string {
  return `Transactions (use the leading index as "index"):
${batchLines}

Return ONLY a JSON array of objects, one per transaction, matching the schema in the system prompt.`
}
