import type { ClientIndustry } from '@/types'

export type AlertSeverity = 'critical' | 'important' | 'informational'
export type AlertSource = 'IRS' | 'DOL' | 'State' | 'Industry' | 'SEC' | 'CFPB'

export interface RegulatoryAlert {
  id: string
  title: string
  summary: string
  fullText: string
  effectiveDate: string       // YYYY-MM-DD
  publishedDate: string       // YYYY-MM-DD
  severity: AlertSeverity
  source: AlertSource
  affectedIndustries: ClientIndustry[]  // empty array = ALL industries
  affectedStates: string[]              // empty array = federal/nationwide
  revenueMin?: number         // only applies to businesses above this revenue
  employeeMin?: number        // only applies to businesses with 1+ employees
  tags: string[]
  actionRequired: string      // one-line: what the CPA must do
  draftLetterTemplate: string // pre-written client advisory letter (with [CLIENT_NAME] etc placeholders)
  url?: string
}

export interface ClientAlertStatus {
  alertId: string
  clientName: string
  status: 'new' | 'reviewed' | 'client-notified' | 'dismissed'
  notifiedAt?: string
  dismissedAt?: string
  notes?: string
}
