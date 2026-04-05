'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DeadlineType = 'monthly-close' | 'tax-filing' | 'payroll' | 'invoice' | 'custom'
type DeadlineStatus = 'upcoming' | 'due-soon' | 'overdue' | 'completed'

interface Deadline {
  id: string
  clientName: string
  type: DeadlineType
  dueDate: string // YYYY-MM-DD
  status: DeadlineStatus
  notes?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cb_deadlines'
const JOBS_KEY = 'closebooks_jobs'

const TYPE_META: Record<DeadlineType, { label: string; color: string; bg: string }> = {
  'monthly-close': { label: 'Monthly Close', color: '#2d5a27', bg: '#e8f0e6' },
  'tax-filing':    { label: 'Tax Filing',    color: '#c2410c', bg: '#fff1e6' },
  'payroll':       { label: 'Payroll',       color: '#1d4ed8', bg: '#eff6ff' },
  'invoice':       { label: 'Invoice',       color: '#7c3aed', bg: '#f5f3ff' },
  'custom':        { label: 'Custom',        color: '#6b6560', bg: '#f5f0ea' },
}

const STATUS_META: Record<DeadlineStatus, { label: string; color: string; bg: string }> = {
  upcoming:  { label: 'Upcoming',  color: '#1d4ed8', bg: '#eff6ff' },
  'due-soon':{ label: 'Due Soon',  color: '#d97706', bg: '#fffbeb' },
  overdue:   { label: 'Overdue',   color: '#dc2626', bg: '#fef2f2' },
  completed: { label: 'Completed', color: '#059669', bg: '#ecfdf5' },
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const DAY_LETTERS = ['M','T','W','T','F','S','S']

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function calcStatus(dueDate: string, current: DeadlineStatus): DeadlineStatus {
  if (current === 'completed') return 'completed'
  const now = new Date(today())
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'due-soon'
  return 'upcoming'
}

function loadDeadlines(): Deadline[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Deadline[]
  } catch { return [] }
}

function saveDeadlines(deadlines: Deadline[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deadlines))
}

function loadClientNames(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const jobs = JSON.parse(localStorage.getItem(JOBS_KEY) ?? '[]') as { client_name?: string }[]
    const names = Array.from(new Set(jobs.map((j) => j.client_name).filter(Boolean))) as string[]
    return names
  } catch { return [] }
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[m - 1]} ${d}, ${y}`
}

function formatDayFull(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const date = new Date(y, m - 1, d)
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${days[date.getDay()]}, ${months[m - 1]} ${d}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────

function seedDeadlines(clientNames: string[]): Deadline[] {
  const todayStr = today()
  const [y, m] = todayStr.split('-').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')

  const names = clientNames.length > 0
    ? clientNames.slice(0, 4)
    : ['Sample Client', 'Sample Client', 'Sample Client', 'Sample Client']

  const fillers = ['Sample Client A', 'Sample Client B', 'Sample Client C', 'Sample Client D']
  while (names.length < 4) names.push(fillers[names.length])

  const daysInMonth = new Date(y, m, 0).getDate()
  const day5  = Math.min(5,  daysInMonth)
  const day15 = Math.min(15, daysInMonth)
  const day20 = Math.min(20, daysInMonth)
  const day28 = Math.min(28, daysInMonth)

  const seed: Omit<Deadline, 'status'>[] = [
    { id: uid(), clientName: names[0], type: 'monthly-close', dueDate: `${y}-${pad(m)}-${pad(day15)}`, notes: 'Review P&L and balance sheet' },
    { id: uid(), clientName: names[1], type: 'tax-filing',    dueDate: `${y}-${pad(m)}-${pad(day28)}`, notes: 'Q1 estimated payment' },
    { id: uid(), clientName: names[2], type: 'payroll',       dueDate: `${y}-${pad(m)}-${pad(day5)}`,  notes: 'Bi-weekly payroll run' },
    { id: uid(), clientName: names[3], type: 'invoice',       dueDate: `${y}-${pad(m)}-${pad(day20)}`, notes: '' },
  ]

  return seed.map((d) => ({ ...d, status: calcStatus(d.dueDate, 'upcoming') }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatPill({
  count,
  label,
  color,
  bg,
}: {
  count: number
  label: string
  color: string
  bg: string
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
      style={{ backgroundColor: bg, color }}
    >
      <span className="font-bold tabular-nums">{count}</span>
      <span>{label}</span>
    </div>
  )
}

function TypeBadge({ type }: { type: DeadlineType }) {
  const { label, color, bg } = TYPE_META[type]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: DeadlineStatus }) {
  const { label, color, bg } = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  )
}

function TypeDot({ type }: { type: DeadlineType }) {
  const { color } = TYPE_META[type]
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
      style={{ backgroundColor: color, display: 'inline-block' }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add/Edit Modal
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  clientNames: string[]
  onSave: (d: Deadline) => void
  onClose: () => void
}

function AddDeadlineModal({ clientNames, onSave, onClose }: ModalProps) {
  const [clientName, setClientName] = useState(clientNames[0] ?? '')
  const [customClient, setCustomClient] = useState('')
  const [useCustom, setUseCustom] = useState(clientNames.length === 0)
  const [type, setType] = useState<DeadlineType>('monthly-close')
  const [dueDate, setDueDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = useCustom ? customClient.trim() : clientName.trim()
    if (!name) { setError('Client name is required.'); return }
    if (!dueDate) { setError('Due date is required.'); return }
    const deadline: Deadline = {
      id: uid(),
      clientName: name,
      type,
      dueDate,
      status: calcStatus(dueDate, 'upcoming'),
      notes: notes.trim() || undefined,
    }
    onSave(deadline)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e8e0d4',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1a1714',
    backgroundColor: '#ffffff',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#1a1714',
    marginBottom: '6px',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#e8e0d4' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '20px',
              color: '#1a1714',
            }}
          >
            Add Deadline
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Client name */}
          <div>
            <label style={labelStyle}>Client</label>
            {clientNames.length > 0 && !useCustom ? (
              <div className="flex gap-2">
                <select
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {clientNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className="px-3 py-2 rounded-lg text-xs border transition-colors shrink-0"
                  style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Custom
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customClient}
                  onChange={(e) => setCustomClient(e.target.value)}
                  placeholder="Enter client name"
                  style={{ ...inputStyle, flex: 1 }}
                />
                {clientNames.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setUseCustom(false); setCustomClient('') }}
                    className="px-3 py-2 rounded-lg text-xs border transition-colors shrink-0"
                    style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    From list
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DeadlineType)}
              style={inputStyle}
            >
              {(Object.keys(TYPE_META) as DeadlineType[]).map((t) => (
                <option key={t} value={t}>{TYPE_META[t].label}</option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label style={labelStyle}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes <span style={{ color: '#6b6560', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              Save Deadline
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Deadline Card
// ─────────────────────────────────────────────────────────────────────────────

interface DeadlineCardProps {
  deadline: Deadline
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
}

function DeadlineCard({ deadline, onToggleComplete, onDelete }: DeadlineCardProps) {
  const isCompleted = deadline.status === 'completed'

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl border transition-all"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e8e0d4',
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(deadline.id)}
        className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5"
        style={{
          borderColor: isCompleted ? '#059669' : '#c8c0b8',
          backgroundColor: isCompleted ? '#059669' : '#ffffff',
        }}
        title={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
      >
        {isCompleted && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Type dot */}
      <TypeDot type={deadline.type} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p
              className="font-medium text-sm leading-tight"
              style={{
                color: '#1a1714',
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}
            >
              {deadline.clientName}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <TypeBadge type={deadline.type} />
              <StatusBadge status={deadline.status} />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs tabular-nums" style={{ color: '#6b6560' }}>
              {formatDate(deadline.dueDate)}
            </span>
            <button
              onClick={() => onDelete(deadline.id)}
              className="w-6 h-6 flex items-center justify-center rounded transition-colors"
              style={{ color: '#c8c0b8' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = '#fef2f2' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#c8c0b8'; e.currentTarget.style.backgroundColor = 'transparent' }}
              title="Delete deadline"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 2.5h8M4 2.5V1.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 4.5v3.5M6.5 4.5v3.5M2 2.5l.7 7a.5.5 0 00.5.5h4.6a.5.5 0 00.5-.5l.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        {deadline.notes && (
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: '#6b6560' }}>
            {deadline.notes}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [showModal, setShowModal] = useState(false)
  const [clientNames, setClientNames] = useState<string[]>([])
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()) // 0-indexed
  const [mounted, setMounted] = useState(false)

  // Load on mount
  useEffect(() => {
    setMounted(true)
    const names = loadClientNames()
    setClientNames(names)

    let stored = loadDeadlines()

    // Seed if empty
    if (stored.length === 0) {
      stored = seedDeadlines(names)
      saveDeadlines(stored)
    }

    // Recalculate statuses
    const recalculated = stored.map((d) => ({ ...d, status: calcStatus(d.dueDate, d.status) }))
    saveDeadlines(recalculated)
    setDeadlines(recalculated)
  }, [])

  const handleAddDeadline = useCallback((d: Deadline) => {
    setDeadlines((prev) => {
      const next = [...prev, d]
      saveDeadlines(next)
      return next
    })
  }, [])

  const handleToggleComplete = useCallback((id: string) => {
    setDeadlines((prev) => {
      const next = prev.map((d) => {
        if (d.id !== id) return d
        const newStatus: DeadlineStatus = d.status === 'completed'
          ? calcStatus(d.dueDate, 'upcoming')
          : 'completed'
        return { ...d, status: newStatus }
      })
      saveDeadlines(next)
      return next
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeadlines((prev) => {
      const next = prev.filter((d) => d.id !== id)
      saveDeadlines(next)
      return next
    })
  }, [])

  // Navigate months
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  // Filter deadlines for current view month
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const monthDeadlines = deadlines
    .filter((d) => d.dueDate.startsWith(monthStr))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  // Group by day
  const byDay: Record<string, Deadline[]> = {}
  for (const d of monthDeadlines) {
    if (!byDay[d.dueDate]) byDay[d.dueDate] = []
    byDay[d.dueDate].push(d)
  }
  const sortedDays = Object.keys(byDay).sort()

  // Summary stats (all deadlines, not just current month view)
  const overdue    = deadlines.filter((d) => d.status === 'overdue').length
  const dueThisWeek = deadlines.filter((d) => d.status === 'due-soon').length
  const upcoming   = deadlines.filter((d) => d.status === 'upcoming').length

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <DashboardNav />
        <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-10">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: '#e8e0d4' }} />
        </main>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#e8f0e6' }}
            >
              <CalendarIcon />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: '26px',
                  lineHeight: 1.1,
                  color: '#1a1714',
                  letterSpacing: '-0.01em',
                }}
              >
                Calendar
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>
                Close deadlines &amp; task tracker
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors shrink-0"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Add Deadline
          </button>
        </div>

        {/* ── Summary Pills ── */}
        <div className="flex flex-wrap gap-2 mb-7">
          <StatPill count={overdue}     label="overdue"       color="#dc2626" bg="#fef2f2" />
          <StatPill count={dueThisWeek} label="due this week" color="#d97706" bg="#fffbeb" />
          <StatPill count={upcoming}    label="upcoming"      color="#1d4ed8" bg="#eff6ff" />
        </div>

        {/* ── Month Navigation + Day Letters ── */}
        <div
          className="rounded-2xl border mb-6 overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
        >
          {/* Month header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: '#e8e0d4' }}
          >
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              aria-label="Previous month"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <h2
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '18px',
                color: '#1a1714',
              }}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>

            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              aria-label="Next month"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Day letter strip */}
          <div
            className="grid grid-cols-7 border-b"
            style={{ borderColor: '#f0ebe3', backgroundColor: '#faf8f4' }}
          >
            {DAY_LETTERS.map((l, i) => (
              <div
                key={i}
                className="flex items-center justify-center py-2 text-xs font-semibold tracking-wider"
                style={{ color: i >= 5 ? '#b8734a' : '#6b6560' }}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Deadline list for the month */}
          <div className="px-5 py-4">
            {sortedDays.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#f5f0ea' }}
                >
                  <CalendarIcon />
                </div>
                <p className="text-sm" style={{ color: '#6b6560' }}>
                  No deadlines in {MONTH_NAMES[viewMonth]} {viewYear}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-sm font-medium underline underline-offset-2"
                  style={{ color: '#2d5a27' }}
                >
                  Add one
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {sortedDays.map((day) => (
                  <div key={day}>
                    {/* Day heading */}
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#6b6560' }}
                      >
                        {formatDayFull(day)}
                      </span>
                      <div
                        className="flex-1 h-px"
                        style={{ backgroundColor: '#f0ebe3' }}
                      />
                      <span
                        className="text-xs tabular-nums px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#f5f0ea', color: '#6b6560' }}
                      >
                        {byDay[day].length} {byDay[day].length === 1 ? 'deadline' : 'deadlines'}
                      </span>
                    </div>
                    {/* Cards for this day */}
                    <div className="space-y-2 pl-0">
                      {byDay[day].map((d) => (
                        <DeadlineCard
                          key={d.id}
                          deadline={d}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── All other months summary (overdue from past) ── */}
        {deadlines.filter((d) => d.status === 'overdue').length > 0 && (
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: '#ffffff', borderColor: '#fca5a5' }}
          >
            <h3
              className="font-semibold text-sm mb-3 flex items-center gap-2"
              style={{ color: '#dc2626' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.3" />
                <path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Overdue Deadlines
            </h3>
            <div className="space-y-2">
              {deadlines
                .filter((d) => d.status === 'overdue')
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((d) => (
                  <DeadlineCard
                    key={d.id}
                    deadline={d}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </div>
        )}

      </main>

      {showModal && (
        <AddDeadlineModal
          clientNames={clientNames}
          onSave={handleAddDeadline}
          onClose={() => setShowModal(false)}
        />
      )}

      <AppFooter />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="3" width="15" height="13.5" rx="2" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
      <path d="M1.5 7.5h15" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 1.5v3M12.5 1.5v3" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4.5" y="9.5" width="2" height="2" rx="0.5" fill="#2d5a27" />
      <rect x="8" y="9.5" width="2" height="2" rx="0.5" fill="#2d5a27" />
      <rect x="11.5" y="9.5" width="2" height="2" rx="0.5" fill="#2d5a27" />
      <rect x="4.5" y="13" width="2" height="2" rx="0.5" fill="#2d5a27" />
      <rect x="8" y="13" width="2" height="2" rx="0.5" fill="#2d5a27" />
    </svg>
  )
}
