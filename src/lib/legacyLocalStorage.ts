/**
 * Legacy localStorage keys (pre-Postgres migration). Used only by import utility.
 */

export const LEGACY_KEYS = {
  jobs: 'closebooks_jobs',
  clients: 'closebooks_clients',
  firmSettings: 'closebooks_firm_settings',
  freeTrial: 'cb_free_trial',
  invoices: 'cb_invoices',
  letters: 'cb_engagement_letters',
  rateCard: 'cb_rate_card',
  docRequests: 'cb_doc_requests',
  pipeline: 'cb_engagement_pipeline',
  vaultDocs: 'cb_vault_documents',
  vaultReqs: 'cb_document_requests',
  activity: 'closebooks_activity',
  regulatoryStatuses: 'cb_alert_statuses',
  copilotConfig: 'cb_copilot_config',
  copilotRuns: 'cb_copilot_runs',
  advisory: 'cb_advisory_memos',
  corrections: 'cb_corrections',
  insights: 'cb_insights_cache',
  benchmark: 'cb_benchmark_contributions',
  networkOptIn: 'cb_benchmark_opt_in',
  /** Alias used in some components */
  networkOptInAlt: 'cb_network_opt_in',
  qbo: 'closebooks_qbo',
  portalTokens: 'cb_portal_tokens',
  taxReturns: 'cb_tax_returns',
  auditDefense: 'cb_audit_defense',
  team: 'cb_team_members',
  referrals: 'cb_referral_stats',
  autopilotPrefs: 'cb_autopilot_prefs',
  agentPrefs: 'cb_agent_prefs',
  devSettings: 'cb_developer_settings',
  hourlyRate: 'cb_hourly_rate',
  messages: 'cb_client_messages',
  notifications: 'cb_notifications',
  notifRead: 'cb_notifications_read',
  deadlines: 'cb_deadlines',
  complianceTasks: 'cb_compliance_tasks',
  portalUploads: 'portal_uploads',
} as const

export function readLegacyJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function readLegacyString(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return localStorage.getItem(key) ?? fallback
}
