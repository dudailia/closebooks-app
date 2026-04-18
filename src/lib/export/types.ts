import type { Transaction } from '@/types'

/** All supported CSV export formats (backward compatible: quickbooks, standard). */
export type CsvExportFormat =
  | 'quickbooks'
  | 'standard'
  | 'qbo_journal_csv'
  | 'xero'
  | 'trial_balance'
  | 'transaction_detail'
  | 'iif'

export const ALL_CSV_FORMATS = [
  'quickbooks',
  'standard',
  'qbo_journal_csv',
  'xero',
  'trial_balance',
  'transaction_detail',
  'iif',
] as const satisfies readonly CsvExportFormat[]

export type DetailColumnKey =
  | 'date'
  | 'description'
  | 'original_description'
  | 'type'
  | 'amount'
  | 'debit'
  | 'credit'
  | 'suggested_category'
  | 'final_category'
  | 'suggested_account_code'
  | 'final_account_code'
  | 'confidence'
  | 'status'
  | 'notes'
  | 'reasoning'
  | 'tax_relevant'
  | 'suggested_1099_vendor'

export const DEFAULT_DETAIL_COLUMNS: DetailColumnKey[] = [
  'date',
  'description',
  'type',
  'amount',
  'debit',
  'credit',
  'final_category',
  'suggested_category',
  'final_account_code',
  'suggested_account_code',
  'confidence',
  'status',
  'notes',
]

export function rowForDetailColumn(tx: Transaction, key: DetailColumnKey): string | number {
  const cat = tx.final_category ?? tx.suggested_category ?? ''
  const code = tx.final_account_code ?? tx.suggested_account_code ?? ''
  switch (key) {
    case 'date':
      return tx.date
    case 'description':
      return tx.description
    case 'original_description':
      return tx.original_description ?? ''
    case 'type':
      return tx.type
    case 'amount':
      return tx.amount
    case 'debit':
      return tx.type === 'debit' ? tx.amount : ''
    case 'credit':
      return tx.type === 'credit' ? tx.amount : ''
    case 'suggested_category':
      return tx.suggested_category ?? ''
    case 'final_category':
      return tx.final_category ?? ''
    case 'suggested_account_code':
      return tx.suggested_account_code ?? ''
    case 'final_account_code':
      return tx.final_account_code ?? ''
    case 'confidence':
      return Math.round((tx.confidence ?? 0) * 100)
    case 'status':
      return tx.status
    case 'notes':
      return tx.notes ?? ''
    case 'reasoning':
      return tx.reasoning ?? ''
    case 'tax_relevant':
      return tx.tax_relevant ? 'yes' : 'no'
    case 'suggested_1099_vendor':
      return tx.suggested_1099_vendor ? 'yes' : 'no'
    default:
      return ''
  }
}

export function headerLabel(key: DetailColumnKey): string {
  const labels: Record<DetailColumnKey, string> = {
    date: 'Date',
    description: 'Description',
    original_description: 'Original description',
    type: 'Type',
    amount: 'Amount',
    debit: 'Debit',
    credit: 'Credit',
    suggested_category: 'Suggested category',
    final_category: 'Final category',
    suggested_account_code: 'Suggested account code',
    final_account_code: 'Final account code',
    confidence: 'Confidence %',
    status: 'Status',
    notes: 'Notes',
    reasoning: 'AI reasoning',
    tax_relevant: 'Tax relevant',
    suggested_1099_vendor: '1099 vendor',
  }
  return labels[key]
}
