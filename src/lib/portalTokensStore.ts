import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

export interface PortalTokenRecord {
  token: string
  visits: number
  lastLogin: string
}

let _map: Record<string, PortalTokenRecord> = {}

export async function hydratePortalTokens(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase
    .from('portal_client_tokens')
    .select('client_name_key, token, meta')
    .eq('firm_id', firmId)
  _map = {}
  for (const row of data ?? []) {
    const r = row as { client_name_key: string; token: string; meta?: Record<string, unknown> | null }
    const m = r.meta ?? {}
    _map[r.client_name_key] = {
      token: r.token,
      visits: Number(m.visits ?? 0),
      lastLogin: String(m.lastLogin ?? 'Never'),
    }
  }
}

export function getPortalTokens(): Record<string, PortalTokenRecord> {
  return { ..._map }
}

export function ensurePortalToken(clientNameKey: string): string {
  let rec = _map[clientNameKey]
  if (!rec) {
    const bytes = new Uint8Array(8)
    crypto.getRandomValues(bytes)
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    rec = { token, visits: 0, lastLogin: 'Never' }
    _map[clientNameKey] = rec
    void persistRow(clientNameKey, rec)
  }
  return rec.token
}

export function updatePortalTokenMeta(clientNameKey: string, visits: number, lastLogin: string): void {
  const rec = _map[clientNameKey]
  if (!rec) return
  _map[clientNameKey] = { ...rec, visits, lastLogin }
  void persistRow(clientNameKey, _map[clientNameKey])
}

async function persistRow(clientNameKey: string, rec: PortalTokenRecord): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('portal_client_tokens').upsert({
    firm_id: ctx.firmId,
    client_name_key: clientNameKey,
    token: rec.token,
    meta: { visits: rec.visits, lastLogin: rec.lastLogin },
  })
}
