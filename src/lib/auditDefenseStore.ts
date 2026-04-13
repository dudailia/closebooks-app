import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'

export interface ActiveAuditRecord {
  id: string
  client: string
  auditType: string
  auditTypeCode: string
  taxYear: number
  responseDueDays: number
  status: 'in-progress' | 'pending' | 'closed'
  description: string
  amountInQuestion: number
}

let _audits: ActiveAuditRecord[] = []

export async function hydrateAuditDefense(supabase: SupabaseClient, firmId: string): Promise<void> {
  _audits = await loadPayloadRows<ActiveAuditRecord>(supabase, 'audit_defense_audits', firmId)
}

export function loadActiveAudits(): ActiveAuditRecord[] {
  return _audits
}

export function saveAuditDefense(id: string, payload: ActiveAuditRecord): void {
  const idx = _audits.findIndex((a) => a.id === id)
  if (idx >= 0) _audits[idx] = payload
  else _audits.unshift(payload)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await upsertPayloadRow(ctx.supabase, 'audit_defense_audits', ctx.firmId, id, payload as unknown as Record<string, unknown>)
  })()
}
