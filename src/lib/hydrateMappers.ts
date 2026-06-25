import type { CategorizationJob, Transaction } from '@/types'

export function mapJobFromRows(
  row: Record<string, unknown>,
  transactions: Transaction[]
): CategorizationJob {
  return {
    id: String(row.id),
    client_name: String(row.client_name ?? ''),
    created_at: String(row.created_at ?? new Date().toISOString()),
    // Seed/legacy rows use 'complete'; the type + all STATUS_STYLE maps use 'completed'. Normalize once here.
    status: ((row.status === 'complete' ? 'completed' : row.status) as CategorizationJob['status']) ?? 'review',
    total_transactions: Number(row.total_transactions ?? transactions.length),
    auto_categorized: Number(row.auto_categorized ?? 0),
    approved: Number(row.approved ?? 0),
    flagged: Number(row.flagged ?? 0),
    transactions,
    chart_of_accounts: (row.chart_of_accounts as CategorizationJob['chart_of_accounts']) ?? [],
  }
}
