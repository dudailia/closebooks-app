import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

export type PipelineStage = 'draft' | 'sent' | 'viewed' | 'signed' | 'lost'

export interface PipelineEntry {
  id: string
  clientName: string
  stage: PipelineStage
  value: number
  updatedAt: string
  notes?: string
}

let _rows: PipelineEntry[] = []

export async function hydratePipeline(supabase: SupabaseClient, firmId: string): Promise<void> {
  _rows = await loadPayloadRows<PipelineEntry>(supabase, 'pipeline_entries', firmId)
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const r of _rows) {
    await upsertPayloadRow(ctx.supabase, 'pipeline_entries', ctx.firmId, r.id, r as unknown as Record<string, unknown>)
  }
}

export function listPipeline(): PipelineEntry[] {
  return [..._rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function upsertPipeline(entry: Omit<PipelineEntry, 'updatedAt'> & { updatedAt?: string }): void {
  const row: PipelineEntry = {
    ...entry,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  }
  const idx = _rows.findIndex((r) => r.id === entry.id)
  if (idx >= 0) _rows[idx] = row
  else _rows.unshift(row)
  void persist()
}

export function deletePipeline(id: string): void {
  _rows = _rows.filter((r) => r.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'pipeline_entries', ctx.firmId, id)
  })()
}

export function seedFromEngagementLetters(
  letters: Array<{ id: string; clientName: string; status: string; monthlyFee: number }>
): void {
  const existingIds = new Set(_rows.map((e) => e.id))
  for (const L of letters) {
    if (existingIds.has(L.id)) continue
    const stage: PipelineStage =
      L.status === 'signed' ? 'signed' : L.status === 'sent' ? 'sent' : 'draft'
    upsertPipeline({
      id: L.id,
      clientName: L.clientName,
      stage,
      value: L.monthlyFee * 12,
      notes: 'Imported from Engagement Letters',
    })
  }
}
