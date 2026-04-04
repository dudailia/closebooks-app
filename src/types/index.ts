export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  original_description: string
  suggested_category: string
  suggested_account_code: string
  confidence: number // 0-1
  status: 'pending' | 'approved' | 'edited' | 'flagged'
  final_category?: string
  final_account_code?: string
  notes?: string
}

export type ChartOfAccounts = {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
}

export type CategorizationJob = {
  id: string
  client_name: string
  created_at: string
  status: 'processing' | 'review' | 'completed'
  total_transactions: number
  auto_categorized: number
  approved: number
  flagged: number
  transactions: Transaction[]
  chart_of_accounts: ChartOfAccounts[]
}
