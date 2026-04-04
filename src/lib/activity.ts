// ---------------------------------------------------------------------------
// Activity event system — stored in localStorage, read anywhere client-side
// ---------------------------------------------------------------------------

export type ActivityEventType =
  | 'close_started'
  | 'close_completed'
  | 'transactions_categorized'
  | 'csv_exported'
  | 'report_generated'
  | 'pdf_uploaded'
  | 'client_created'
  | 'client_deleted'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  /** Human-readable sentence shown in the feed */
  description: string
  clientName?: string
  jobId?: string
  timestamp: string  // ISO
}

const ACTIVITY_KEY = 'closebooks_activity'
const MAX_EVENTS   = 200

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

export function getActivity(clientName?: string): ActivityEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const all = JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? '[]') as ActivityEvent[]
    if (!clientName) return all
    const lower = clientName.toLowerCase()
    return all.filter((e) => e.clientName?.toLowerCase() === lower)
  } catch {
    return []
  }
}

export function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  const all = getActivity()
  const next: ActivityEvent = {
    ...event,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  all.unshift(next)
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(all.slice(0, MAX_EVENTS)))
}

export function clearActivity(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVITY_KEY)
}

// ---------------------------------------------------------------------------
// Relative timestamp helper
// ---------------------------------------------------------------------------

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s    = Math.floor(diff / 1000)
  if (s < 60)   return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)    return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
