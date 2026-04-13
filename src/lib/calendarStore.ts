import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { getJobs } from '@/lib/storage'

export type DeadlineType = 'monthly-close' | 'tax-filing' | 'payroll' | 'invoice' | 'custom'
export type DeadlineStatus = 'upcoming' | 'due-soon' | 'overdue' | 'completed'

export interface Deadline {
  id: string
  clientName: string
  type: DeadlineType
  dueDate: string
  status: DeadlineStatus
  notes?: string
}

let _deadlines: Deadline[] = []

export function getDeadlinesCache(): Deadline[] {
  return _deadlines
}

function rowToDeadline(row: Record<string, unknown>): Deadline {
  return {
    id: String(row.id),
    clientName: String(row.client_name ?? ''),
    type: (row.type as DeadlineType) ?? 'custom',
    dueDate: String(row.due_date ?? '').slice(0, 10),
    status: (row.status as DeadlineStatus) ?? 'upcoming',
    notes: row.notes ? String(row.notes) : undefined,
  }
}

export async function hydrateDeadlines(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase
    .from('deadlines')
    .select('*')
    .eq('firm_id', firmId)
    .order('due_date', { ascending: true })
  _deadlines = (data ?? []).map((r) => rowToDeadline(r as Record<string, unknown>))
}

async function persistAll(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('deadlines').delete().eq('firm_id', ctx.firmId)
  if (_deadlines.length === 0) return
  const rows = _deadlines.map((d) => ({
    id: d.id,
    firm_id: ctx.firmId,
    client_name: d.clientName,
    title: `${d.type} — ${d.clientName}`,
    due_date: d.dueDate,
    type: d.type,
    status: d.status,
    notes: d.notes ?? null,
  }))
  await ctx.supabase.from('deadlines').upsert(rows)
}

export function loadDeadlines(): Deadline[] {
  return _deadlines
}

export function saveDeadlines(deadlines: Deadline[]): void {
  _deadlines = deadlines
  void persistAll()
}

export function loadClientNamesFromJobs(): string[] {
  const jobs = getJobs()
  return Array.from(new Set(jobs.map((j) => j.client_name).filter(Boolean)))
}
