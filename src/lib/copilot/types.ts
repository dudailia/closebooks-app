export type ActionCardType =
  | 'journal_entry'
  | 'recategorize'
  | 'flag'
  | 'client_email'
  | 'document_request'

export type ActionCardStatus = 'pending' | 'editing' | 'approved' | 'dismissed'

export interface JournalEntryLine {
  account: string
  code: string
  debit?: number
  credit?: number
}

export interface JournalEntryPayload {
  memo: string
  date: string
  lines: JournalEntryLine[]
}

export interface RecategorizePayload {
  transactionIds: string[]
  newCategory: string
  newAccountCode: string
  reason: string
}

export interface FlagPayload {
  transactionIds: string[]
  reason: string
}

export interface ClientEmailPayload {
  subject: string
  body: string
  relatedTransactionIds: string[]
}

export interface DocumentRequestPayload {
  items: string[]
  dueDate: string | null
}

export type ActionCardPayload =
  | JournalEntryPayload
  | RecategorizePayload
  | FlagPayload
  | ClientEmailPayload
  | DocumentRequestPayload

export interface ActionCard {
  id: string
  type: ActionCardType
  title: string
  summary: string
  payload: ActionCardPayload
  status: ActionCardStatus
}

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  actionCards: ActionCard[]
  streaming: boolean
}

export type SSEEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_start'; name: string; label: string }
  | { type: 'tool_done'; name: string; rowCount?: number }
  | { type: 'action_card'; card: ActionCard }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface TxRow {
  id: string
  date: string
  description: string
  amount: number
  type: string
  status: string
  final_category: string | null
  suggested_category: string | null
  final_account_code: string | null
  suggested_account_code: string | null
  confidence: number | null
  notes: string | null
}

export interface AccountSummaryRow {
  account: string
  code: string
  total: number
  txCount: number
}

export interface TrialBalanceRow {
  account: string
  code: string
  debits: number
  credits: number
  net: number
}

export interface VendorRow {
  vendor: string
  txCount: number
  total: number
  lastDate: string
}

export interface PeriodCompareRow {
  account: string
  period1Total: number
  period2Total: number
  delta: number
  deltaPercent: number
}

export interface DuplicateGroup {
  transactions: TxRow[]
  reason: string
}

export interface AnomalyRow {
  transaction: TxRow
  category: string
  categoryMean: number
  zScore: number
  explanation: string
}
