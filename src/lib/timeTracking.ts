/**
 * Automatic time tracking for each close.
 * Records when a close starts and ends, computes duration.
 * Used for billing and productivity analytics.
 */

const KEY = 'cb_time_sessions'

export interface TimeSession {
  id: string
  jobId: string
  clientName: string
  startedAt: string
  endedAt?: string
  durationMinutes?: number
  page: 'upload' | 'review' | 'export'
}

function load(): TimeSession[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function save(sessions: TimeSession[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, 200)))
}

/** Start tracking time on a page for a job */
export function startSession(jobId: string, clientName: string, page: TimeSession['page']): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  const sessions = load()
  sessions.unshift({ id, jobId, clientName, startedAt: new Date().toISOString(), page })
  save(sessions)
  return id
}

/** End a tracking session */
export function endSession(id: string): TimeSession | null {
  const sessions = load()
  const idx = sessions.findIndex(s => s.id === id)
  if (idx === -1) return null
  const endedAt = new Date().toISOString()
  const durationMinutes = Math.round(
    (new Date(endedAt).getTime() - new Date(sessions[idx].startedAt).getTime()) / 60000
  )
  sessions[idx] = { ...sessions[idx], endedAt, durationMinutes }
  save(sessions)
  return sessions[idx]
}

/** Get total minutes spent on a job */
export function getJobTime(jobId: string): number {
  return load()
    .filter(s => s.jobId === jobId && s.durationMinutes != null)
    .reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)
}

/** Get all sessions for analytics */
export function getAllSessions(): TimeSession[] {
  return load()
}

/** Summary per client for billing */
export function getClientTimeSummary(): { clientName: string; totalMinutes: number; sessions: number }[] {
  const sessions = load().filter(s => s.durationMinutes != null && s.durationMinutes > 0)
  const byClient = new Map<string, { totalMinutes: number; sessions: number }>()
  for (const s of sessions) {
    const existing = byClient.get(s.clientName) ?? { totalMinutes: 0, sessions: 0 }
    byClient.set(s.clientName, {
      totalMinutes: existing.totalMinutes + (s.durationMinutes ?? 0),
      sessions: existing.sessions + 1,
    })
  }
  return Array.from(byClient.entries())
    .map(([clientName, data]) => ({ clientName, ...data }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
}
