import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

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
  timestamp: string
  action: AuditActionType
  txId?: string
  txDescription?: string
  details: Record<string, string | number>
  actor: string
}

export type AuditCallback = (event: Omit<AuditEvent, 'id' | 'timestamp' | 'actor'>) => void

const MAX_EVENTS = 500
const cache = new Map<string, AuditEvent[]>()

export async function hydrateAuditTrails(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('audit_events').select('job_id, payload').eq('firm_id', firmId)
  cache.clear()
  for (const row of data ?? []) {
    const jid = String((row as { job_id: string }).job_id)
    const ev = (row as { payload: unknown }).payload as AuditEvent
    const list = cache.get(jid) ?? []
    list.push(ev)
    cache.set(jid, list)
  }
}

async function persistJob(jobId: string): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  const list = cache.get(jobId) ?? []
  await ctx.supabase.from('audit_events').delete().eq('firm_id', ctx.firmId).eq('job_id', jobId)
  for (const ev of list.slice(-MAX_EVENTS)) {
    await ctx.supabase.from('audit_events').insert({
      id: ev.id,
      firm_id: ctx.firmId,
      job_id: jobId,
      payload: ev as unknown as Record<string, unknown>,
      created_at: ev.timestamp,
    })
  }
}

export function getAuditTrail(jobId: string): AuditEvent[] {
  return cache.get(jobId) ?? []
}

export function logAuditEvent(jobId: string, event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  const all = cache.get(jobId) ?? []
  const next: AuditEvent = {
    ...event,
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  all.push(next)
  cache.set(jobId, all.slice(-MAX_EVENTS))
  void persistJob(jobId)
}

export function clearAuditTrail(jobId: string): void {
  cache.delete(jobId)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await ctx.supabase.from('audit_events').delete().eq('firm_id', ctx.firmId).eq('job_id', jobId)
  })()
}

export function formatAuditEvent(e: AuditEvent): string {
  switch (e.action) {
    case 'tx_approved':
      return `Approved: ${e.txDescription ?? 'transaction'}`
    case 'tx_flagged':
      return `Flagged: ${e.txDescription ?? 'transaction'}`
    default:
      return e.action
  }
}

export function auditGroup(action: AuditActionType): 'transactions' | 'exports' | 'system' {
  if (action.startsWith('tx_')) return 'transactions'
  if (action.startsWith('job_')) return 'exports'
  return 'system'
}

export function fmtAuditTs(iso: string): string {
  return new Date(iso).toLocaleString()
}
