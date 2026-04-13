/**
 * Firm compliance task checklist (PBC, 7216, engagement docs) — localStorage.
 */

const KEY = 'cb_compliance_tasks'

export type ComplianceTaskStatus = 'open' | 'done'

export interface ComplianceTask {
  id: string
  title: string
  dueDate: string
  clientName?: string
  status: ComplianceTaskStatus
  createdAt: string
}

function load(): ComplianceTask[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as ComplianceTask[]
  } catch {
    return []
  }
}

function save(rows: ComplianceTask[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(rows))
}

export function listTasks(): ComplianceTask[] {
  return load().sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function addTask(task: Omit<ComplianceTask, 'createdAt'>): void {
  const rows = load()
  rows.push({ ...task, createdAt: new Date().toISOString() })
  save(rows)
}

export function toggleTask(id: string): void {
  const rows = load()
  const i = rows.findIndex((r) => r.id === id)
  if (i < 0) return
  rows[i] = {
    ...rows[i],
    status: rows[i].status === 'done' ? 'open' : 'done',
  }
  save(rows)
}

export function deleteTask(id: string): void {
  save(load().filter((r) => r.id !== id))
}
