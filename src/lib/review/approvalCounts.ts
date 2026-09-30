import type { Transaction } from '@/types'

export interface ApprovalCounts {
  /** Rows approved or edited (both count as approved). */
  approved: number
  /** Approved by the AI at upload: confidence at or above the threshold, no validation flag. */
  byAi: number
  /** Approved by a saved firm rule. */
  byRule: number
  /** Approved or recategorised by a reviewer. */
  byReviewer: number
  /** Approved rows saved before `approvedBy` existed, where the source can't be told. */
  notRecorded: number
}

/** Who approved a row. Rows from before `approvedBy` fall back to categorizationSource. */
export function approver(t: Transaction): Transaction['approvedBy'] | null {
  if (t.status !== 'approved' && t.status !== 'edited') return null
  if (t.approvedBy) return t.approvedBy
  if (t.categorizationSource === 'firm_rule') return 'rule'
  if (t.categorizationSource === 'manual' || t.status === 'edited') return 'reviewer'
  return undefined
}

export function approvalCounts(transactions: Transaction[]): ApprovalCounts {
  const counts: ApprovalCounts = { approved: 0, byAi: 0, byRule: 0, byReviewer: 0, notRecorded: 0 }
  for (const t of transactions) {
    const who = approver(t)
    if (who === null) continue
    counts.approved++
    if (who === 'ai') counts.byAi++
    else if (who === 'rule') counts.byRule++
    else if (who === 'reviewer') counts.byReviewer++
    else counts.notRecorded++
  }
  return counts
}

/** "8 auto-approved by AI · 2 by firm rule · 3 by reviewer" (zero parts left out). */
export function approvalBreakdown(c: ApprovalCounts): string {
  const parts = [
    c.byAi ? `${c.byAi} auto-approved by AI` : '',
    c.byRule ? `${c.byRule} by firm rule` : '',
    c.byReviewer ? `${c.byReviewer} by reviewer` : '',
    c.notRecorded ? `${c.notRecorded} not recorded` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'none approved'
}
