import type { ChartOfAccounts, Transaction } from '@/types'

/**
 * Approve a transaction. An account the reviewer already chose
 * (final_account_code / final_category) is kept; only an unreviewed row
 * falls back to the AI suggestion.
 */
export function approveTransaction(t: Transaction): Transaction {
  return {
    ...t,
    status: 'approved',
    final_category: t.final_category ?? t.suggested_category,
    final_account_code: t.final_account_code ?? t.suggested_account_code,
  }
}

/** A reviewer picks an account from the chart. */
export function recategorizeTransaction(t: Transaction, code: string, chartOfAccounts: ChartOfAccounts[]): Transaction {
  const account = chartOfAccounts.find((a) => a.code === code)
  return { ...t, status: 'edited', categorizationSource: 'manual', final_account_code: code, final_category: account?.name ?? code }
}
