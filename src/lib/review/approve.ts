import type { ChartOfAccounts, Transaction } from '@/types'

/** Approved or edited (an edit approves the row). */
export function isApproved(t: Transaction): boolean {
  return t.status === 'approved' || t.status === 'edited'
}

/**
 * Approve a transaction. An account the reviewer already chose
 * (final_account_code / final_category) is kept; only an unreviewed row
 * falls back to the AI suggestion.
 *
 * A row that is already approved (by the AI at upload, a firm rule, or a
 * reviewer) is returned unchanged, so approving it again doesn't relabel who
 * approved it.
 */
export function approveTransaction(t: Transaction): Transaction {
  if (isApproved(t)) return t
  return {
    ...t,
    status: 'approved',
    approvedBy: 'reviewer',
    final_category: t.final_category ?? t.suggested_category,
    final_account_code: t.final_account_code ?? t.suggested_account_code,
  }
}

/** A reviewer picks an account from the chart (which also approves the row). */
export function recategorizeTransaction(t: Transaction, code: string, chartOfAccounts: ChartOfAccounts[]): Transaction {
  const account = chartOfAccounts.find((a) => a.code === code)
  return { ...t, status: 'edited', categorizationSource: 'manual', approvedBy: 'reviewer', final_account_code: code, final_category: account?.name ?? code }
}

/**
 * Approve the rows with these ids. Rows already approved are left as they
 * are; `approved` holds only the rows this call changed (for the audit trail,
 * the undo entry and the "Approved N" message).
 */
export function approveSelected(transactions: Transaction[], ids: Iterable<string>): { next: Transaction[]; approved: Transaction[]; priors: Transaction[] } {
  const want = new Set(ids)
  const approved: Transaction[] = []
  const priors: Transaction[] = []
  const next = transactions.map((t) => {
    if (!want.has(t.id) || isApproved(t)) return t
    const updated = approveTransaction(t)
    priors.push(t)
    approved.push(updated)
    return updated
  })
  return { next, approved, priors }
}
