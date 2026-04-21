import type { Transaction } from '@/types'
import type { CloseException } from './exceptionDetector'
import type { JournalEntry } from './journalEntries'
import type { PnLReport } from './pnlCalculator'

export type StageId =
  | 'data_collection'
  | 'ai_categorization'
  | 'reconciliation'
  | 'journal_entries'
  | 'anomaly_scan'
  | 'trial_balance'
  | 'reporting'
  | 'human_review'

export type StageStatus = 'pending' | 'running' | 'complete' | 'failed' | 'needs_review' | 'skipped'

export interface StageResult {
  id: StageId
  label: string
  status: StageStatus
  durationMs: number
  summary: string
  outputCount: number
  exceptionCount: number
  logs: string[]
  error?: string
}

export interface TrialBalanceLine {
  account: string
  debit: number
  credit: number
}

export interface PipelineResult {
  runId: string
  clientId: string
  period: string
  stages: StageResult[]
  transactions: Transaction[]
  journalEntries: JournalEntry[]
  exceptions: CloseException[]
  pnl: PnLReport
  trialBalance: TrialBalanceLine[]
  stats: {
    totalTransactions: number
    autoCategorized: number
    pctCategorized: number
    journalEntriesCount: number
    exceptionsCount: number
    elapsedMs: number
    timeSavedMinutes: number
  }
}

export const STAGE_LABELS: Record<StageId, string> = {
  data_collection: 'Data Collection',
  ai_categorization: 'AI Categorization',
  reconciliation: 'Reconciliation',
  journal_entries: 'Journal Entries',
  anomaly_scan: 'Anomaly Scan',
  trial_balance: 'Trial Balance',
  reporting: 'Reporting',
  human_review: 'Human Review',
}

export const STAGE_ORDER: StageId[] = [
  'data_collection',
  'ai_categorization',
  'reconciliation',
  'journal_entries',
  'anomaly_scan',
  'trial_balance',
  'reporting',
  'human_review',
]
