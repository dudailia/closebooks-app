/**
 * In-app notifications — `notifications` + `notification_read_state`.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { getJobs } from '@/lib/storage'
import { loadDeadlines } from '@/lib/calendarStore'

const READ_TABLE = 'notification_read_state'

export type NotifType =
  | 'deadline_7d'
  | 'deadline_3d'
  | 'deadline_today'
  | 'overdue_close'
  | 'flagged_high_value'
  | 'agent_complete'
  | 'exception_new'
  | 'trial_warning'

export interface AppNotification {
  id: string
  type: NotifType
  title: string
  body: string
  href?: string
  createdAt: string
  clientName?: string
  amount?: number
}

let _notifs: AppNotification[] = []
const _readIds = new Set<string>()

export async function hydrateNotifications(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data: rows } = await supabase
    .from('notifications')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(50)
  _notifs = (rows ?? []).map((r) => {
    const p = (r as { payload: unknown }).payload as AppNotification
    return { ...p, id: String((r as { id: string }).id) }
  })
  const { data: readRows } = await supabase.from(READ_TABLE).select('notification_id').eq('firm_id', firmId)
  _readIds.clear()
  for (const row of readRows ?? []) {
    _readIds.add(String((row as { notification_id: string }).notification_id))
  }
}

async function persistNotifs(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('notifications').delete().eq('firm_id', ctx.firmId)
  for (const n of _notifs.slice(0, 50)) {
    await ctx.supabase.from('notifications').upsert({
      id: n.id,
      firm_id: ctx.firmId,
      payload: n as unknown as Record<string, unknown>,
      created_at: n.createdAt,
    })
  }
}

async function persistRead(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from(READ_TABLE).delete().eq('firm_id', ctx.firmId)
  const rows = Array.from(_readIds).map((notification_id) => ({ firm_id: ctx.firmId, notification_id }))
  if (rows.length) await ctx.supabase.from(READ_TABLE).insert(rows)
}

export function getNotifications(): AppNotification[] {
  return _notifs
}

export function getUnreadCount(): number {
  return _notifs.filter((n) => !_readIds.has(n.id)).length
}

export function markAllRead(): void {
  _notifs.forEach((n) => _readIds.add(n.id))
  void persistRead()
}

export function markRead(id: string): void {
  _readIds.add(id)
  void persistRead()
}

export function isRead(id: string): boolean {
  return _readIds.has(id)
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>): void {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const isDupe = _notifs.some(
    (n) =>
      n.type === notif.type &&
      n.clientName === notif.clientName &&
      Date.now() - new Date(n.createdAt).getTime() < 86400000
  )
  if (isDupe) return
  const full: AppNotification = { id, createdAt: new Date().toISOString(), ...notif }
  _notifs.unshift(full)
  if (_notifs.length > 50) _notifs = _notifs.slice(0, 50)
  void persistNotifs()
}

export function clearAllNotifications(): void {
  _notifs = []
  _readIds.clear()
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (!ctx) return
    await ctx.supabase.from('notifications').delete().eq('firm_id', ctx.firmId)
    await ctx.supabase.from(READ_TABLE).delete().eq('firm_id', ctx.firmId)
  })()
}

export function clearNotification(id: string): void {
  _notifs = _notifs.filter((n) => n.id !== id)
  _readIds.delete(id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await ctx.supabase.from('notifications').delete().eq('firm_id', ctx.firmId).eq('id', id)
  })()
}

export function generateSmartNotifications(): void {
  const jobs = getJobs()
  const deadlines = loadDeadlines().map((d) => ({
    id: d.id,
    client: d.clientName,
    dueDate: d.dueDate,
    type: d.type,
  }))
  const now = Date.now()

  for (const dl of deadlines) {
    if (!dl.dueDate) continue
    const dueMs = new Date(dl.dueDate).getTime()
    const diffDays = Math.ceil((dueMs - now) / 86400000)
    if (diffDays === 7) {
      addNotification({
        type: 'deadline_7d',
        title: `Deadline in 7 days`,
        body: `${dl.type} deadline for ${dl.client} is due ${new Date(dl.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        href: '/dashboard/calendar',
        clientName: dl.client,
      })
    } else if (diffDays === 3) {
      addNotification({
        type: 'deadline_3d',
        title: `Deadline in 3 days`,
        body: `${dl.type} for ${dl.client} is due ${new Date(dl.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        href: '/dashboard/calendar',
        clientName: dl.client,
      })
    } else if (diffDays <= 0 && diffDays >= -1) {
      addNotification({
        type: 'deadline_today',
        title: `Deadline today: ${dl.client}`,
        body: `${dl.type} is due today. Don't miss it.`,
        href: '/dashboard/calendar',
        clientName: dl.client,
      })
    }
  }

  const byClient = new Map<string, string>()
  for (const job of jobs) {
    const existing = byClient.get(job.client_name)
    if (!existing || new Date(job.created_at) > new Date(existing)) {
      byClient.set(job.client_name, job.created_at)
    }
  }
  for (const [clientName, lastClose] of Array.from(byClient.entries())) {
    const daysSince = Math.floor((now - new Date(lastClose).getTime()) / 86400000)
    if (daysSince >= 35) {
      addNotification({
        type: 'overdue_close',
        title: `No close in ${daysSince} days`,
        body: `${clientName} hasn't been closed since ${new Date(lastClose).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        href: '/dashboard/upload',
        clientName,
      })
    }
  }

  for (const job of jobs) {
    const highValueFlagged = job.transactions.filter(
      (t) => t.status === 'flagged' && Math.abs(t.amount) > 5000
    )
    for (const tx of highValueFlagged.slice(0, 2)) {
      addNotification({
        type: 'flagged_high_value',
        title: `High-value flag: $${Math.abs(tx.amount).toLocaleString()}`,
        body: `A transaction over $5,000 needs review for ${job.client_name}`,
        href: `/dashboard/review/${job.id}`,
        clientName: job.client_name,
        amount: Math.abs(tx.amount),
      })
    }
  }
}
