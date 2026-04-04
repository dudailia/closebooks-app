import type { ChartOfAccounts, Transaction } from '@/types'

export interface CategorySuggestion {
  category: string
  accountCode: string
  /** Display percentage (0-100), not a real probability */
  pct: number
}

/** Tokenize a string into meaningful lowercase words (≥3 chars). */
function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3)
}

/**
 * Return up to `limit` alternative category suggestions for a transaction,
 * ranked by keyword overlap with the transaction description.
 *
 * The primary suggested account is excluded so we only get alternatives.
 */
export function getAlternativeSuggestions(
  tx: Transaction,
  chartOfAccounts: ChartOfAccounts[],
  limit = 2,
): CategorySuggestion[] {
  const descTokens = tokens(tx.description)
  if (descTokens.length === 0) return []

  // Prefer account types that match the transaction direction
  const preferredTypes =
    tx.type === 'credit'
      ? ['revenue', 'asset']
      : ['expense', 'liability']

  const scored = chartOfAccounts
    .filter((a) => a.code !== tx.suggested_account_code)
    .map((account) => {
      const nameTokens  = tokens(account.name)
      const typeTokens  = tokens(account.type)
      const allTokens   = [...nameTokens, ...typeTokens]

      // Count how many description tokens appear in the account label
      const overlap = descTokens.reduce(
        (sum, t) => sum + (allTokens.some((n) => n.includes(t) || t.includes(n)) ? 1 : 0),
        0
      )

      // Boost accounts whose type aligns with debit/credit direction
      const typeBoost = preferredTypes.includes(account.type) ? 0.5 : 0

      return { account, score: overlap + typeBoost }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  if (scored.length === 0) return []

  // Distribute the "remaining" confidence across alternatives
  const primaryConf   = Math.min(Math.max(tx.confidence, 0), 1)
  const remaining     = 1 - primaryConf
  const totalScore    = scored.reduce((s, e) => s + e.score, 0)

  return scored.map((entry) => ({
    category:    entry.account.name,
    accountCode: entry.account.code,
    pct:         Math.max(1, Math.round((entry.score / totalScore) * remaining * 100)),
  }))
}
