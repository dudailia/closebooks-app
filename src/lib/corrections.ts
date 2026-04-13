import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'

const MAX_STORED = 50

export interface Correction {
  description: string
  fromCategory: string
  toCategory: string
  savedAt: string
}

let _rows: Array<Correction & { id: string }> = []

export async function hydrateCorrections(supabase: SupabaseClient, firmId: string): Promise<void> {
  const raw = await loadPayloadRows<Correction & { id: string }>(supabase, 'corrections', firmId)
  _rows = raw.slice(0, MAX_STORED)
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('corrections').delete().eq('firm_id', ctx.firmId)
  for (const c of _rows) {
    await upsertPayloadRow(ctx.supabase, 'corrections', ctx.firmId, c.id, c as unknown as Record<string, unknown>)
  }
}

export function saveCorrection(description: string, fromCategory: string, toCategory: string): void {
  if (!fromCategory || !toCategory || fromCategory === toCategory) return
  const idx = _rows.findIndex((c) => c.description === description && c.fromCategory === fromCategory)
  const entry: Correction & { id: string } = {
    id: idx >= 0 ? _rows[idx].id : `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description,
    fromCategory,
    toCategory,
    savedAt: new Date().toISOString(),
  }
  if (idx >= 0) _rows[idx] = entry
  else _rows.unshift(entry)
  _rows = _rows.slice(0, MAX_STORED)
  void persist()
}

export function getRecentCorrections(n = 10): Correction[] {
  return _rows.slice(0, n)
}

export interface CorrectionStats {
  totalCorrections: number
  estimatedAccuracy: number
  topCorrectedFrom: { category: string; count: number }[]
  topCorrectedTo: { category: string; count: number }[]
}

export function getCorrectionStats(): CorrectionStats {
  const all = _rows
  const n = all.length
  const estimatedAccuracy =
    n === 0 ? 82 : Math.min(97, Math.round(82 + Math.log10(n + 1) * 9))
  const fromCounts = new Map<string, number>()
  const toCounts = new Map<string, number>()
  for (const c of all) {
    fromCounts.set(c.fromCategory, (fromCounts.get(c.fromCategory) ?? 0) + 1)
    toCounts.set(c.toCategory, (toCounts.get(c.toCategory) ?? 0) + 1)
  }
  const topCorrectedFrom = Array.from(fromCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }))
  const topCorrectedTo = Array.from(toCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }))
  return { totalCorrections: n, estimatedAccuracy, topCorrectedFrom, topCorrectedTo }
}

export function loadCorrections(): Correction[] {
  return _rows
}
