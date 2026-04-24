import type { Transaction } from '@/types'

export interface ToolExecContext {
  transactions: Transaction[]
  jobId?: string
  clientId?: string
  mutateTransactions: (ids: string[], patch: (t: Transaction) => Transaction) => void
  overdueJobs?: Array<{ id: string; clientName: string; daysOverdue: number }>
}

export interface ToolExecResult {
  summary: string
  data?: unknown
  mutatedIds?: string[]
}

function matchByQuery(txs: Transaction[], q: string): Transaction[] {
  const needle = q.toLowerCase()
  const gt = needle.match(/(?:over|above|>)\s*\$?([\d,.]+)/)
  const lt = needle.match(/(?:under|below|<)\s*\$?([\d,.]+)/)
  const amountGt = gt ? parseFloat(gt[1].replace(/,/g, '')) : undefined
  const amountLt = lt ? parseFloat(lt[1].replace(/,/g, '')) : undefined
  const keywords = needle
    .replace(/(over|above|under|below|[<>$])\s*[\d,.]+/g, '')
    .replace(/transactions?|charges?|all|the/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return txs.filter((t) => {
    if (amountGt !== undefined && !(t.amount > amountGt)) return false
    if (amountLt !== undefined && !(t.amount < amountLt)) return false
    if (keywords.length === 0) return true
    const hay = `${t.description} ${t.final_category ?? ''} ${t.suggested_category ?? ''}`.toLowerCase()
    return keywords.every((k) => hay.includes(k))
  })
}

export function executeToolClient(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolExecContext
): ToolExecResult {
  switch (name) {
    case 'findTransactions': {
      const q = String(input.query ?? '')
      const hits = matchByQuery(ctx.transactions, q)
      return {
        summary: `Found ${hits.length} matching transaction${hits.length !== 1 ? 's' : ''}`,
        data: { ids: hits.map((t) => t.id), count: hits.length, preview: hits.slice(0, 10).map((t) => ({ id: t.id, desc: t.description, amt: t.amount })) },
      }
    }
    case 'flagTransactions': {
      const ids = (input.txIds as string[]) ?? []
      ctx.mutateTransactions(ids, (t) => ({ ...t, status: 'flagged' }))
      return { summary: `Flagged ${ids.length} transaction${ids.length !== 1 ? 's' : ''}`, mutatedIds: ids }
    }
    case 'approveTransactions': {
      const ids = (input.txIds as string[]) ?? []
      ctx.mutateTransactions(ids, (t) => ({
        ...t,
        status: 'approved',
        final_category: t.final_category ?? t.suggested_category,
        final_account_code: t.final_account_code ?? t.suggested_account_code,
      }))
      return { summary: `Approved ${ids.length} transaction${ids.length !== 1 ? 's' : ''}`, mutatedIds: ids }
    }
    case 'changeCategoryBulk': {
      const ids = (input.txIds as string[]) ?? []
      const accountCode = String(input.accountCode ?? '')
      const categoryName = String(input.categoryName ?? '')
      ctx.mutateTransactions(ids, (t) => ({
        ...t,
        status: 'edited',
        final_account_code: accountCode,
        final_category: categoryName,
      }))
      return {
        summary: `Changed category for ${ids.length} transaction${ids.length !== 1 ? 's' : ''} to ${categoryName}`,
        mutatedIds: ids,
      }
    }
    case 'getOverdueJobs': {
      const list = ctx.overdueJobs ?? []
      return { summary: `${list.length} client${list.length !== 1 ? 's' : ''} overdue`, data: list }
    }
    case 'runAutoClose': {
      return { summary: 'Auto-close agent will start in a new modal.', data: { action: 'open_auto_close' } }
    }
    case 'explainVariance': {
      const category = String(input.category ?? '').toLowerCase()
      const matching = ctx.transactions.filter((t) =>
        (t.final_category ?? t.suggested_category ?? '').toLowerCase().includes(category)
      )
      const total = matching.reduce((s, t) => s + (t.type === 'debit' ? t.amount : -t.amount), 0)
      return {
        summary: `Category "${category}" total: $${Math.abs(total).toFixed(2)} across ${matching.length} tx`,
        data: { total, count: matching.length, txIds: matching.map((t) => t.id) },
      }
    }
    default:
      return { summary: `Unknown tool: ${name}` }
  }
}
