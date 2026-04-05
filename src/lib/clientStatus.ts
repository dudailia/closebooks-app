import type { CategorizationJob } from '@/types'

export type CloseStatus =
  | 'not_started'
  | 'in_progress'
  | 'needs_review'
  | 'ready_to_export'
  | 'complete'

export interface ClientCloseStatus {
  clientName: string
  status: CloseStatus
  job: CategorizationJob | null
  /** Total transactions in the most recent job */
  totalTx: number
  /** How many are approved/edited */
  reviewed: number
  /** How many are flagged */
  flagged: number
  /** How many are pending */
  pending: number
  /** ISO date of the most recent job */
  lastJobDate: string | null
  reviewPct: number
}

export function getClientCloseStatuses(jobs: CategorizationJob[]): ClientCloseStatus[] {
  // Group by client name, keep only the most recent job per client
  const byClient = new Map<string, CategorizationJob>()
  for (const job of jobs) {
    const existing = byClient.get(job.client_name)
    if (!existing || job.created_at > existing.created_at) {
      byClient.set(job.client_name, job)
    }
  }

  return Array.from(byClient.entries())
    .map(([clientName, job]) => {
      const reviewed = job.transactions.filter(
        (t) => t.status === 'approved' || t.status === 'edited'
      ).length
      const flagged  = job.transactions.filter((t) => t.status === 'flagged').length
      const pending  = job.transactions.filter((t) => t.status === 'pending').length
      const reviewPct = job.total_transactions > 0
        ? Math.round((reviewed / job.total_transactions) * 100)
        : 0

      let status: CloseStatus
      if (job.status === 'completed') {
        status = 'complete'
      } else if (reviewPct === 100 && flagged === 0) {
        status = 'ready_to_export'
      } else if (flagged > 0) {
        status = 'needs_review'
      } else if (reviewed > 0) {
        status = 'in_progress'
      } else {
        status = 'not_started'
      }

      return {
        clientName,
        status,
        job,
        totalTx:    job.total_transactions,
        reviewed,
        flagged,
        pending,
        lastJobDate: job.created_at,
        reviewPct,
      }
    })
    .sort((a, b) => {
      // Sort: needs_review first, then in_progress, not_started, ready_to_export, complete
      const order: Record<CloseStatus, number> = {
        needs_review:    0,
        in_progress:     1,
        not_started:     2,
        ready_to_export: 3,
        complete:        4,
      }
      return order[a.status] - order[b.status]
    })
}
