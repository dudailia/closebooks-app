import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

export interface TaxReturnDraft {
  id: string
  client: string
  formType: string
  taxYear: number
  status: 'draft' | 'review' | 'approved' | 'exported'
  opportunities: number
  opportunitySavings: number
  liability: number
  createdAt: string
}

let _rows: TaxReturnDraft[] = []

export async function hydrateTaxDrafts(supabase: SupabaseClient, firmId: string): Promise<void> {
  _rows = await loadPayloadRows<TaxReturnDraft>(supabase, 'tax_return_drafts', firmId)
}

export function getTaxReturnDrafts(): TaxReturnDraft[] {
  return _rows
}

export function saveTaxReturnDraft(row: TaxReturnDraft): void {
  const idx = _rows.findIndex((r) => r.id === row.id)
  if (idx >= 0) _rows[idx] = row
  else _rows.unshift(row)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await upsertPayloadRow(ctx.supabase, 'tax_return_drafts', ctx.firmId, row.id, row as unknown as Record<string, unknown>)
  })()
}

export function deleteTaxReturnDraft(id: string): void {
  _rows = _rows.filter((r) => r.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'tax_return_drafts', ctx.firmId, id)
  })()
}
