// ---------------------------------------------------------------------------
// Audit trail — per-job event log stored in localStorage
// ---------------------------------------------------------------------------

export type AuditActionType =
  | 'tx_approved'
  | 'tx_flagged'
  | 'tx_category_changed'
  | 'tx_note_added'
  | 'job_exported'
  | 'job_completed'
  | 'job_created'

export interface AuditEvent {
  id: string
  timestamp: string   // ISO
  action: AuditActionType
  txId?: string
  txDescription?: string
  details: Record<string, string | number>
  actor: string
}

/** Callback signature used by components — actor and jobId added by the page. */
export type AuditCallback = (
  event: Omit<AuditEvent, 'id' | 'timestamp' | 'actor'>
) => void

const storageKey = (jobId: string) => `closebooks_audit_${jobId}`
const MAX_EVENTS  = 500

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function getAuditTrail(jobId: string): AuditEvent[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(storageKey(jobId)) ?? '[]') as AuditEvent[]
  } catch {
    return []
  }
}

export function logAuditEvent(
  jobId: string,
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): void {
  if (typeof window === 'undefined') return
  const all  = getAuditTrail(jobId)
  const next: AuditEvent = {
    ...event,
    id:        `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  all.push(next)
  localStorage.setItem(storageKey(jobId), JSON.stringify(all.slice(-MAX_EVENTS)))
}

export function clearAuditTrail(jobId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(storageKey(jobId))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatAuditEvent(e: AuditEvent): string {
  switch (e.action) {
    case 'tx_approved':
      return `"${e.txDescription}" approved`
    case 'tx_flagged':
      return `"${e.txDescription}" flagged${e.details.reason ? ` — "${e.details.reason}"` : ''}`
    case 'tx_category_changed':
      return `"${e.txDescription}" category changed from "${e.details.from || '—'}" to "${e.details.to}"`
    case 'tx_note_added':
      return `Note added to "${e.txDescription}": "${e.details.note}"`
    case 'job_exported':
      return `Exported ${e.details.count} transactions as ${e.details.format}`
    case 'job_completed':
      return `Close marked as complete`
    case 'job_created':
      return `Categorization job created — ${e.details.txCount} transactions imported`
  }
}

export function fmtAuditTs(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** Group label for filter tabs */
export function auditGroup(action: AuditActionType): 'transactions' | 'exports' | 'system' {
  if (action === 'job_exported') return 'exports'
  if (action === 'job_completed' || action === 'job_created') return 'system'
  return 'transactions'
}
