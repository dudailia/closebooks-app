/**
 * Engagement letter / proposal pipeline (localStorage) — e-signature style stages.
 */

const KEY = 'cb_engagement_pipeline'

export type PipelineStage =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'lost'

export interface PipelineEntry {
  id: string
  clientName: string
  stage: PipelineStage
  value: number
  updatedAt: string
  notes?: string
}

function load(): PipelineEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as PipelineEntry[]
  } catch {
    return []
  }
}

function save(rows: PipelineEntry[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(rows))
}

export function listPipeline(): PipelineEntry[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function upsertPipeline(entry: Omit<PipelineEntry, 'updatedAt'> & { updatedAt?: string }): void {
  const rows = load()
  const idx = rows.findIndex((r) => r.id === entry.id)
  const row: PipelineEntry = {
    ...entry,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  }
  if (idx >= 0) rows[idx] = row
  else rows.unshift(row)
  save(rows)
}

export function deletePipeline(id: string): void {
  save(load().filter((r) => r.id !== id))
}

export function seedFromEngagementLetters(
  letters: Array<{ id: string; clientName: string; status: string; monthlyFee: number }>
): void {
  const existing = load()
  const existingIds = new Set(existing.map((e) => e.id))
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
