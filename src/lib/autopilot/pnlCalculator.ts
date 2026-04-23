import type { Transaction } from '@/types'

export interface PnLReport {
  revenue: number
  cogs: number
  grossProfit: number
  grossMarginPct: number
  operatingExpenses: number
  netIncome: number
  netMarginPct: number
  period: string
}

const REVENUE_KEYWORDS = ['sales', 'revenue', 'income', 'payment received', 'client payment', 'invoice']
const COGS_KEYWORDS = ['cost of goods', 'cogs', 'inventory', 'raw material', 'wholesale', 'supplier']

function isRevenue(tx: Transaction): boolean {
  if (tx.type === 'credit') {
    const cat = (tx.final_category ?? tx.suggested_category ?? '').toLowerCase()
    const desc = (tx.description ?? tx.original_description ?? '').toLowerCase()
    if (REVENUE_KEYWORDS.some(k => cat.includes(k) || desc.includes(k))) return true
    // Default: all credits are revenue unless categorized otherwise
    if (!['transfer', 'refund', 'loan', 'owner investment'].some(k => cat.includes(k))) return true
  }
  return false
}

function isCogs(tx: Transaction): boolean {
  const cat = (tx.final_category ?? tx.suggested_category ?? '').toLowerCase()
  const desc = (tx.description ?? tx.original_description ?? '').toLowerCase()
  return COGS_KEYWORDS.some(k => cat.includes(k) || desc.includes(k))
}

export function expandSplits(transactions: Transaction[]): Transaction[] {
  const out: Transaction[] = []
  for (const tx of transactions) {
    if (tx.splits && tx.splits.length > 0) {
      for (const s of tx.splits) {
        out.push({
          ...tx,
          id: `${tx.id}:${s.id}`,
          amount: s.amount,
          final_category: s.category,
          final_account_code: s.account_code,
        })
      }
    } else {
      out.push(tx)
    }
  }
  return out
}

export function calculatePnL(transactions: Transaction[], period: string): PnLReport {
  let revenue = 0
  let cogs = 0
  let operatingExpenses = 0

  for (const tx of expandSplits(transactions)) {
    const amount = Math.abs(tx.amount)
    if (isRevenue(tx)) {
      revenue += amount
    } else if (tx.type === 'debit' && isCogs(tx)) {
      cogs += amount
    } else if (tx.type === 'debit') {
      operatingExpenses += amount
    }
  }

  const grossProfit = revenue - cogs
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netIncome = grossProfit - operatingExpenses
  const netMarginPct = revenue > 0 ? (netIncome / revenue) * 100 : 0

  return {
    revenue,
    cogs,
    grossProfit,
    grossMarginPct,
    operatingExpenses,
    netIncome,
    netMarginPct,
    period,
  }
}
