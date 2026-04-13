/**
 * Time sessions — `time_sessions` JSON rows.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'

export interface TimeSession {
  id: string
  jobId: string
  clientName: string
  startedAt: string
  endedAt?: string
  durationMinutes?: number
  page: 'upload' | 'review' | 'export'
}

let _sessions: TimeSession[] = []

export async function hydrateTimeSessions(supabase: SupabaseClient, firmId: string): Promise<void> {
  _sessions = await loadPayloadRows<TimeSession>(supabase, 'time_sessions', firmId)
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const s of _sessions) {
    await upsertPayloadRow(ctx.supabase, 'time_sessions', ctx.firmId, s.id, s as unknown as Record<string, unknown>)
  }
}

export function startSession(jobId: string, clientName: string, page: TimeSession['page']): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  _sessions.unshift({ id, jobId, clientName, startedAt: new Date().toISOString(), page })
  _sessions = _sessions.slice(0, 200)
  void persist()
  return id
}

export function endSession(id: string): TimeSession | null {
  const idx = _sessions.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const endedAt = new Date().toISOString()
  const durationMinutes = Math.round(
    (new Date(endedAt).getTime() - new Date(_sessions[idx].startedAt).getTime()) / 60000
  )
  _sessions[idx] = { ..._sessions[idx], endedAt, durationMinutes }
  void persist()
  return _sessions[idx]
}

export function getJobTime(jobId: string): number {
  return _sessions
    .filter((s) => s.jobId === jobId && s.durationMinutes != null)
    .reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)
}

export function getAllSessions(): TimeSession[] {
  return _sessions
}

export function getClientTimeSummary(): { clientName: string; totalMinutes: number; sessions: number }[] {
  const sessions = _sessions.filter((s) => s.durationMinutes != null && s.durationMinutes > 0)
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
