import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'

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
  description: string
  clientName?: string
  jobId?: string
  timestamp: string
}

const MAX_EVENTS = 200

let _events: ActivityEvent[] = []

export async function hydrateActivity(supabase: SupabaseClient, firmId: string): Promise<void> {
  const rows = await loadPayloadRows<ActivityEvent>(supabase, 'activity_events', firmId)
  _events = rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, MAX_EVENTS)
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('activity_events').delete().eq('firm_id', ctx.firmId)
  for (const e of _events) {
    await upsertPayloadRow(ctx.supabase, 'activity_events', ctx.firmId, e.id, e as unknown as Record<string, unknown>)
  }
}

export function getActivity(clientName?: string): ActivityEvent[] {
  if (!clientName) return _events
  const lower = clientName.toLowerCase()
  return _events.filter((e) => e.clientName?.toLowerCase() === lower)
}

export function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const next: ActivityEvent = {
    ...event,
    id: `act-${Date.now()}-${rand}`,
    timestamp: new Date().toISOString(),
  }
  _events.unshift(next)
  _events = _events.slice(0, MAX_EVENTS)
  void persist()
}

export function clearActivity(): void {
  _events = []
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await ctx.supabase.from('activity_events').delete().eq('firm_id', ctx.firmId)
  })()
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
