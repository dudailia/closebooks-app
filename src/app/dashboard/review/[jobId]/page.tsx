'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import TransactionTable from '@/components/TransactionTable'
import { getJob, saveJob } from '@/lib/storage'
import type { CategorizationJob, Transaction } from '@/types'

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'warning' | 'error'

interface ToastState {
  id: number
  message: string
  kind: ToastKind
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  const styles: Record<ToastKind, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: '#ecfdf5', border: '#059669', text: '#065f46', icon: '✓' },
    warning: { bg: '#fefce8', border: '#d97706', text: '#854d0e', icon: '⚠' },
    error:   { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '✕' },
  }
  const s = styles[toast.kind]

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm shadow-md animate-fade-up"
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        color: s.text,
        minWidth: 240,
        maxWidth: 360,
      }}
    >
      <span className="font-semibold shrink-0">{s.icon}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastState[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export dropdown — click-controlled, not CSS hover
// ---------------------------------------------------------------------------

type ExportFormat = 'quickbooks' | 'standard'

interface ExportDropdownProps {
  onExport: (format: ExportFormat) => void
  loading: boolean
  approvedCount: number
}

function ExportDropdown({ onExport, loading, approvedCount }: ExportDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function pick(format: ExportFormat) {
    setOpen(false)
    onExport(format)
  }

  const formats: { key: ExportFormat; label: string; sub: string }[] = [
    {
      key:   'quickbooks',
      label: 'QuickBooks CSV',
      sub:   'Date, Account, Description, Amount, Category, Class',
    },
    {
      key:   'standard',
      label: 'Standard CSV',
      sub:   'Date, Description, Category, Debit, Credit, Status',
    },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
        style={{
          borderColor: open ? '#b8734a' : '#e8e0d4',
          color: '#1a1714',
          backgroundColor: open ? '#fdf2e9' : '#ffffff',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = '#b8734a' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = '#e8e0d4' }}
      >
        {loading ? (
          <>
            <Spinner />
            Exporting…
          </>
        ) : (
          <>
            <DownloadIcon />
            Export
            <ChevronIcon open={open} />
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border shadow-lg py-1.5 z-30"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          {approvedCount === 0 ? (
            <div className="px-3 py-3 text-center">
              <p className="text-xs font-medium" style={{ color: '#d97706' }}>
                ⚠ No approved transactions
              </p>
              <p className="text-xs mt-1" style={{ color: '#a09a94' }}>
                Approve transactions in the table before exporting.
              </p>
            </div>
          ) : (
            <>
              <p className="px-3 py-1.5 text-xs" style={{ color: '#a09a94' }}>
                Will export <span className="font-semibold" style={{ color: '#059669' }}>{approvedCount}</span> approved transaction{approvedCount !== 1 ? 's' : ''}
              </p>
              <div className="my-1 border-t" style={{ borderColor: '#f0ece4' }} />
              {formats.map((f) => (
                <button
                  key={f.key}
                  onClick={() => pick(f.key)}
                  className="w-full text-left px-3 py-2.5 transition-colors"
                  style={{ color: '#1a1714' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{f.sub}</p>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function Stat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="rounded-xl border px-4 py-4" style={{ borderColor: '#e8e0d4', backgroundColor: bg }}>
      <p className="font-mono text-2xl font-semibold leading-none" style={{ color }}>{value}</p>
      <p className="text-xs font-medium mt-1.5" style={{ color: '#6b6560' }}>{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob]           = useState<CategorizationJob | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [toasts, setToasts]     = useState<ToastState[]>([])
  const toastId = useRef(0)

  useEffect(() => {
    const found = getJob(jobId)
    if (!found) { setNotFound(true); return }
    setJob(found)
  }, [jobId])

  const addToast = useCallback((message: string, kind: ToastKind) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, kind }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  function handleTransactionsChange(updated: Transaction[]) {
    if (!job) return
    const approved = updated.filter((t) => t.status === 'approved' || t.status === 'edited').length
    const flagged  = updated.filter((t) => t.status === 'flagged').length
    const next: CategorizationJob = { ...job, transactions: updated, approved, flagged }
    setJob(next)
    saveJob(next)
  }

  async function handleExport(format: ExportFormat) {
    if (!job) return

    // Only export approved or edited transactions
    const exportable = job.transactions.filter(
      (t) => t.status === 'approved' || t.status === 'edited'
    )

    if (exportable.length === 0) {
      addToast('No approved transactions to export. Approve some first.', 'warning')
      return
    }

    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: exportable,
          clientName: job.client_name,
          format,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Export failed (${res.status})`)
      }

      // Parse filename from Content-Disposition
      const disposition = res.headers.get('content-disposition') ?? ''
      const filenameMatch = disposition.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] ?? `${job.client_name}_close.csv`

      // Trigger download
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const label = format === 'quickbooks' ? 'QuickBooks CSV' : 'Standard CSV'
      addToast(`Exported ${exportable.length} transaction${exportable.length !== 1 ? 's' : ''} as ${label}`, 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  function handleComplete() {
    if (!job) return
    setCompleting(true)
    const next: CategorizationJob = { ...job, status: 'completed' }
    saveJob(next)
    setJob(next)
    setCompleting(false)
    addToast('Close marked as complete.', 'success')
  }

  // --- States ---------------------------------------------------------------

  if (notFound) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#faf8f4' }}>
        <DashboardNav />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <p className="text-sm font-medium" style={{ color: '#1a1714' }}>Job not found.</p>
          <p className="text-sm mt-1 mb-6" style={{ color: '#6b6560' }}>
            It may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#2d5a27' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f4' }}>
        <Spinner />
      </div>
    )
  }

  const pending      = job.total_transactions - job.approved - job.flagged
  const approvedCount = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited').length
  const pct = job.total_transactions > 0
    ? Math.round(((job.approved + job.flagged) / job.total_transactions) * 100)
    : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs mb-2 transition-colors block"
              style={{ color: '#b8734a' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#8a4f2e' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#b8734a' }}
            >
              ← Back to dashboard
            </button>
            <h1
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '1.6rem',
                color: '#1a1714',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {job.client_name}
            </h1>
            <p className="text-xs mt-1" style={{ color: '#a09a94' }}>
              {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}
              <span
                className="font-medium"
                style={{
                  color: job.status === 'completed' ? '#059669'
                    : job.status === 'review' ? '#b8734a'
                    : '#854d0e',
                }}
              >
                {job.status === 'completed' ? 'Completed' : job.status === 'review' ? 'In Review' : 'Processing'}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <ExportDropdown
              onExport={handleExport}
              loading={exporting}
              approvedCount={approvedCount}
            />

            {job.status !== 'completed' && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                ✓ Mark as Complete
              </button>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total"    value={job.total_transactions} color="#1a1714" bg="#ffffff" />
          <Stat label="Approved" value={job.approved}           color="#059669" bg="#ecfdf5" />
          <Stat label="Pending"  value={pending}                color="#d97706" bg="#fefce8" />
          <Stat label="Flagged"  value={job.flagged}            color="#ef4444" bg="#fef2f2" />
        </div>

        {/* Progress bar */}
        <div
          className="rounded-xl border px-4 py-3"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="flex justify-between text-xs mb-2" style={{ color: '#a09a94' }}>
            <span>Review progress</span>
            <span
              className="font-mono font-medium"
              style={{ color: pct === 100 ? '#059669' : '#1a1714' }}
            >
              {pct}% reviewed
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: pct === 100 ? '#059669' : pct >= 50 ? '#2d5a27' : '#b8734a',
              }}
            />
          </div>
        </div>

        {/* Transaction table */}
        <TransactionTable
          initialTransactions={job.transactions}
          chartOfAccounts={job.chart_of_accounts}
          onTransactionsChange={handleTransactionsChange}
        />
      </main>

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#e0dbd4" strokeWidth="2" />
      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="#b8734a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
