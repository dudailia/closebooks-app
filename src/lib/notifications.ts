/**
 * In-app notification system.
 * Generates smart alerts based on:
 * - Closing deadlines approaching
 * - Clients with no close in 30+ days
 * - High-value flagged transactions
 * - New exceptions from agent runs
 * Stored in localStorage, displayed in a notification bell in TopBar.
 */

const KEY = 'cb_notifications'
const READ_KEY = 'cb_notifications_read'

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

function load(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function loadRead(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]) } catch { return new Set() }
}

function saveRead(ids: Set<string>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)))
}

export function getNotifications(): AppNotification[] {
  return load()
}

export function getUnreadCount(): number {
  const notifs = load()
  const read = loadRead()
  return notifs.filter(n => !read.has(n.id)).length
}

export function markAllRead() {
  const notifs = load()
  const ids = new Set(notifs.map(n => n.id))
  saveRead(ids)
}

export function markRead(id: string) {
  const read = loadRead()
  read.add(id)
  saveRead(read)
}

export function isRead(id: string): boolean {
  return loadRead().has(id)
}

export function addNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>) {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  const notifications = load()
  // Avoid duplicates by type+clientName
  const isDupe = notifications.some(n =>
    n.type === notif.type && n.clientName === notif.clientName &&
    Date.now() - new Date(n.createdAt).getTime() < 86400000 // within 24h
  )
  if (isDupe) return
  notifications.unshift({ id, createdAt: new Date().toISOString(), ...notif })
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(notifications.slice(0, 50)))
  }
}

export function clearNotification(id: string) {
  const notifications = load().filter(n => n.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(notifications))
  }
}

/** Generate smart notifications from current jobs/deadlines */
export function generateSmartNotifications() {
  if (typeof window === 'undefined') return

  // Load jobs
  let jobs: Array<{ id: string; client_name: string; created_at: string; transactions: Array<{ status: string; amount: number; type: string }> }> = []
  try { jobs = JSON.parse(localStorage.getItem('closebooks_jobs') ?? '[]') } catch { /* ignore */ }

  // Load deadlines
  let deadlines: Array<{ id: string; client: string; dueDate: string; type: string }> = []
  try { deadlines = JSON.parse(localStorage.getItem('cb_deadlines') ?? '[]') } catch { /* ignore */ }

  const now = Date.now()

  // Check deadlines
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

  // Check for clients with no close in 30+ days
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

  // Check for high-value flagged transactions
  for (const job of jobs) {
    if (!Array.isArray(job.transactions)) continue
    const highValueFlagged = job.transactions.filter(
      t => t.status === 'flagged' && Math.abs(t.amount) > 5000
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
