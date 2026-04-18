export type BankLineStatus = 'unmatched' | 'matched' | 'excluded'
export type RecStatus = 'in_progress' | 'completed' | 'locked'
export type RecItemType = 'outstanding_check' | 'deposit_in_transit' | 'bank_adjustment' | 'book_adjustment'
export type RecItemStatus = 'open' | 'cleared' | 'voided'

export interface BankStatement {
  id: string
  firm_id: string
  client_id: string
  bank_name: string
  account_number_last4?: string
  statement_date: string
  beginning_balance: number
  ending_balance: number
  created_at: string
  lines?: BankStatementLine[]
}

export interface BankStatementLine {
  id: string
  statement_id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  reference_number?: string
  matched_transaction_id?: string
  match_confidence?: number
  status: BankLineStatus
}

export interface Reconciliation {
  id: string
  firm_id: string
  client_id: string
  statement_id?: string
  period: string
  bank_balance: number
  book_balance: number
  difference: number
  status: RecStatus
  completed_by?: string
  completed_at?: string
  created_at: string
  items?: ReconciliationItem[]
}

export interface ReconciliationItem {
  id: string
  reconciliation_id: string
  type: RecItemType
  description: string
  amount: number
  status: RecItemStatus
  created_at: string
}

export interface BookTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  category?: string
  reference_number?: string
}

export interface MatchedPair {
  bankLineId: string
  bookTransactionIds: string[]
  confidence: number
  matchType: 'exact' | 'amount' | 'fuzzy' | 'compound' | 'ai' | 'manual'
}

export interface ParsedStatement {
  bank_name: string
  account_number_last4?: string
  statement_date: string
  beginning_balance: number
  ending_balance: number
  lines: Array<Omit<BankStatementLine, 'id' | 'statement_id' | 'status'>>
}

export interface MatchRequest {
  statementLines: BankStatementLine[]
  bookTransactions: BookTransaction[]
}

export interface MatchResponse {
  matches: MatchedPair[]
  unmatchedBankLineIds: string[]
  unmatchedBookTransactionIds: string[]
}
