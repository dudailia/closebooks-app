export interface TransactionSplit {
  id: string
  amount: number
  account_code: string
  category: string
  notes?: string
}

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
  reasoning?: string
  validation_flags?: string[]
  categorizationSource?: 'ai' | 'firm_rule' | 'manual' | 'copilot'
  splits?: TransactionSplit[]
}

export type ChartOfAccounts = {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
}

export type ClientIndustry =
  | 'Restaurant'
  | 'Retail'
  | 'Professional Services'
  | 'Construction'
  | 'Healthcare'
  | 'E-commerce'
  | 'Technology'
  | 'Manufacturing'
  | 'Real Estate'
  | 'Nonprofit'
  | 'Legal Services'
  | 'Transportation'
  | 'Other'

export type AccountingSoftware = 'QuickBooks' | 'Xero' | 'Other'

export type Client = {
  id: string
  business_name: string
  industry: ClientIndustry
  contact_email: string
  accounting_software: AccountingSoftware
  created_at: string
  notes?: string
}

export interface JobNarrativeParagraph {
  tone: 'formal' | 'conversational' | 'owner'
  html: string
  citations: Array<{ phrase: string; txIds: string[] }>
}

export interface JobNarrative {
  paragraphs: JobNarrativeParagraph[]
  forwardLookingLine: string
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
  narrative?: JobNarrative
  monthlyReportSentAt?: string
}

// ─── Copilot ─────────────────────────────────────────────────────────────────

export type CopilotRunStatus =
  | 'running'
  | 'complete'
  | 'failed'

export interface CopilotRun {
  id: string
  jobId: string
  clientName: string
  startedAt: string
  completedAt: string | null
  status: CopilotRunStatus
  autoApproved: number
  flagged: number
  leftPending: number
  totalProcessed: number
  briefing: string
  confidenceThreshold: number
  error: string | null
}

export interface CopilotConfig {
  confidenceThreshold: number   // 0.75–0.95, default 0.85
  maxAutoAmount: number         // never auto-approve above this, default 5000
  autoFlagThreshold: number     // flag anything below this, default 0.60
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  highlightIds?: string[]
}
