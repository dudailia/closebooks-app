import type { Transaction, CategorizationJob } from '@/types'
import { calculatePnL } from '@/lib/autopilot/pnlCalculator'

export interface ExpenseCategory {
  category: string
  amount: number
  pct: number
}

export function topExpenseCategories(txs: Transaction[], n = 5): ExpenseCategory[] {
  const buckets = new Map<string, number>()
  let total = 0
  for (const t of txs) {
    if (t.type !== 'debit') continue
    const cat = (t.final_category ?? t.suggested_category ?? 'Uncategorized').trim() || 'Uncategorized'
    buckets.set(cat, (buckets.get(cat) ?? 0) + t.amount)
    total += t.amount
  }
  return Array.from(buckets.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n)
}

export interface MonthlyReportData {
  revenue: number
  expenses: number
  netIncome: number
  revenueDeltaPct?: number
  topExpenseCategories: ExpenseCategory[]
}

export function buildMonthlyReport(
  job: CategorizationJob,
  priorJob: CategorizationJob | null
): MonthlyReportData {
  const pnl = calculatePnL(job.transactions, job.created_at)
  const prior = priorJob ? calculatePnL(priorJob.transactions, priorJob.created_at) : null
  const deltaPct =
    prior && prior.revenue > 0
      ? ((pnl.revenue - prior.revenue) / prior.revenue) * 100
      : undefined
  return {
    revenue: pnl.revenue,
    expenses: pnl.operatingExpenses + pnl.cogs,
    netIncome: pnl.netIncome,
    revenueDeltaPct: deltaPct,
    topExpenseCategories: topExpenseCategories(job.transactions, 5),
  }
}
