/**
 * Helpers for firm-scoped JSON payload tables.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function loadPayloadRows<T>(
  supabase: SupabaseClient,
  table: string,
  firmId: string
): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('id, payload').eq('firm_id', firmId)
  if (error || !data) return []
  return data.map((r) => {
    const p = (r as { id: string; payload: unknown }).payload as Record<string, unknown>
    return { ...p, id: (r as { id: string }).id } as T
  })
}

export async function upsertPayloadRow(
  supabase: SupabaseClient,
  table: string,
  firmId: string,
  id: string,
  payload: Record<string, unknown>
): Promise<void> {
  await supabase.from(table).upsert(
    { id, firm_id: firmId, payload },
    { onConflict: 'id' }
  )
}

export async function deletePayloadRow(
  supabase: SupabaseClient,
  table: string,
  firmId: string,
  id: string
): Promise<void> {
  await supabase.from(table).delete().eq('firm_id', firmId).eq('id', id)
}
