import type { CategorizationJob, Transaction } from '@/types'

export interface PeriodFinancials {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  autoApproved: number
  flagged: number
  pending: number
  totalTx: number
}

export function computeFinancials(job: CategorizationJob): PeriodFinancials {
  const tx = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited')
  let totalRevenue = 0
  let totalExpenses = 0
  for (const t of tx) {
    if (t.type === 'credit') totalRevenue += t.amount
    else totalExpenses += t.amount
  }
  const autoApproved = job.transactions.filter((t) => t.status === 'approved' && t.confidence >= 0.85).length
  const flagged = job.transactions.filter((t) => t.status === 'flagged').length
  const pending = job.transactions.filter((t) => t.status === 'pending').length
  return {
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    autoApproved,
    flagged,
    pending,
    totalTx: job.transactions.length,
  }
}

export function compareToPrior(
  current: PeriodFinancials,
  prev: CategorizationJob | null
): { revDelta: number; revPct: number | null; expDelta: number; expPct: number | null } | null {
  if (!prev) return null
  const p = computeFinancials(prev)
  const revDelta = current.totalRevenue - p.totalRevenue
  const expDelta = current.totalExpenses - p.totalExpenses
  return {
    revDelta,
    revPct: p.totalRevenue !== 0 ? (revDelta / p.totalRevenue) * 100 : null,
    expDelta,
    expPct: p.totalExpenses !== 0 ? (expDelta / p.totalExpenses) * 100 : null,
  }
}

export function trialBalanceFromJob(
  job: CategorizationJob
): Array<{ code: string; name: string; type: string; debit: number; credit: number }> {
  const map = new Map<string, { name: string; type: string; debit: number; credit: number }>()
  for (const a of job.chart_of_accounts) {
    map.set(a.code, { name: a.name, type: a.type, debit: 0, credit: 0 })
  }
  for (const t of job.transactions) {
    const code = t.final_account_code ?? t.suggested_account_code ?? ''
    if (!code) continue
    const row =
      map.get(code) ?? {
        name: t.final_category ?? t.suggested_category ?? 'Unknown',
        type: 'expense',
        debit: 0,
        credit: 0,
      }
    if (t.type === 'debit') row.debit += t.amount
    else row.credit += t.amount
    map.set(code, row)
  }
  return Array.from(map.entries())
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => a.code.localeCompare(b.code))
}
