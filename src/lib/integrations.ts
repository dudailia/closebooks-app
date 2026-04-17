import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

export interface QBOConnection {
  companyId: string
  companyName: string
  connectedAt: string
  lastSyncAt: string | null
  totalSynced: number
}

let _demo: QBOConnection | null = null

export async function hydrateIntegrations(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data: real } = await supabase.from('qbo_connections').select('realm_id').eq('firm_id', firmId).maybeSingle()
  if (real?.realm_id) {
    _demo = null
    await supabase
      .from('integration_connections')
      .upsert({ firm_id: firmId, qbo_demo: null, updated_at: new Date().toISOString() }, { onConflict: 'firm_id' })
    return
  }
  const { data } = await supabase.from('integration_connections').select('qbo_demo').eq('firm_id', firmId).maybeSingle()
  _demo = data?.qbo_demo ? (data.qbo_demo as QBOConnection) : null
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('integration_connections').upsert(
    { firm_id: ctx.firmId, qbo_demo: _demo },
    { onConflict: 'firm_id' }
  )
}

export function getQBOConnection(): QBOConnection | null {
  return _demo
}

/** Clear in-memory demo QBO state when a real OAuth connection is active (call after /status). */
export function clearQboDemoMemory(): void {
  _demo = null
}

export function saveQBOConnection(conn: QBOConnection): void {
  _demo = conn
  void persist()
}

export function disconnectQBO(): void {
  _demo = null
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) {
      await ctx.supabase.from('integration_connections').upsert(
        { firm_id: ctx.firmId, qbo_demo: null },
        { onConflict: 'firm_id' }
      )
    }
  })()
}

export function isQBOConnected(): boolean {
  return _demo !== null
}

export function recordQBOSync(count: number): void {
  if (!_demo) return
  _demo = {
    ..._demo,
    lastSyncAt: new Date().toISOString(),
    totalSynced: _demo.totalSynced + count,
  }
  void persist()
}
