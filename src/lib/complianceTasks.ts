import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

export type ComplianceTaskStatus = 'open' | 'done'

export interface ComplianceTask {
  id: string
  title: string
  dueDate: string
  clientName?: string
  status: ComplianceTaskStatus
  createdAt: string
}

let _tasks: ComplianceTask[] = []

function rowToTask(row: Record<string, unknown>): ComplianceTask {
  const cn = row.client_name ?? row.clientName
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    dueDate: String(row.due_date ?? '').slice(0, 10),
    clientName: cn ? String(cn) : undefined,
    status: (row.status as ComplianceTaskStatus) === 'done' ? 'done' : 'open',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

export async function hydrateComplianceTasks(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase
    .from('compliance_tasks')
    .select('*')
    .eq('firm_id', firmId)
    .order('due_date', { ascending: true })
  _tasks = (data ?? []).map((r) => rowToTask(r as Record<string, unknown>))
}

async function persistAll(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('compliance_tasks').delete().eq('firm_id', ctx.firmId)
  if (_tasks.length === 0) return
  const rows = _tasks.map((t) => ({
    id: t.id,
    firm_id: ctx.firmId,
    client_id: null,
    client_name: t.clientName ?? null,
    task_type: 'general',
    title: t.title,
    status: t.status,
    due_date: t.dueDate,
    assigned_to: null,
    completed_at: t.status === 'done' ? new Date().toISOString() : null,
    created_at: t.createdAt,
    updated_at: new Date().toISOString(),
  }))
  await ctx.supabase.from('compliance_tasks').insert(rows)
}

export function listTasks(): ComplianceTask[] {
  return [..._tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function addTask(task: Omit<ComplianceTask, 'createdAt' | 'id'> & { id?: string }): void {
  const id = task.id ?? crypto.randomUUID()
  _tasks.push({ ...task, id, createdAt: new Date().toISOString() })
  void persistAll()
}

export function toggleTask(id: string): void {
  const t = _tasks.find((x) => x.id === id)
  if (t) {
    t.status = t.status === 'done' ? 'open' : 'done'
    void persistAll()
  }
}

export function deleteTask(id: string): void {
  _tasks = _tasks.filter((x) => x.id !== id)
  void persistAll()
}
