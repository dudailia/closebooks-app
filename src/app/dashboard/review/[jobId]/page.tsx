'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import TransactionTable from '@/components/TransactionTable'
import { getJob, saveJob } from '@/lib/storage'
import { detectRecurring } from '@/lib/recurringDetection'
import { logActivity } from '@/lib/activity'
import { getQBOConnection, recordQBOSync } from '@/lib/integrations'
import { JobInsightsPanel } from '@/components/InsightsPanel'
import { getAuditTrail, logAuditEvent, auditGroup, formatAuditEvent, fmtAuditTs } from '@/lib/auditTrail'
import type { QBOConnection } from '@/lib/integrations'
import type { CategorizationJob, Transaction } from '@/types'
import type { RecurringPattern } from '@/lib/recurringDetection'
import type { AuditEvent, AuditCallback } from '@/lib/auditTrail'

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
// Category breakdown
// ---------------------------------------------------------------------------

function CategoryBreakdown({ transactions }: { transactions: Transaction[] }) {
  type Entry = { amount: number; count: number; isCredit: boolean }
  const map = new Map<string, Entry>()

  for (const tx of transactions) {
    const cat = tx.final_category ?? tx.suggested_category ?? 'Uncategorized'
    const existing = map.get(cat) ?? { amount: 0, count: 0, isCredit: tx.type === 'credit' }
    map.set(cat, { amount: existing.amount + tx.amount, count: existing.count + 1, isCredit: tx.type === 'credit' })
  }

  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)

  if (sorted.length === 0) return null

  const max = sorted[0][1].amount

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <h3 className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#a09a94' }}>
        Top Categories by Volume
      </h3>
      <div className="space-y-3">
        {sorted.map(([cat, { amount, count, isCredit }]) => {
          const pct = Math.round((amount / max) * 100)
          const barColor = isCredit ? '#059669' : '#2d5a27'
          const barBg = isCredit ? '#dcfce7' : '#e8f0e6'
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate max-w-[55%]" style={{ color: '#1a1714' }}>
                  {cat}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs" style={{ color: '#a09a94' }}>
                    {count} tx
                  </span>
                  <span className="font-mono text-xs font-semibold" style={{ color: barColor }}>
                    ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: barBg }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Review summary (shown when no pending transactions remain)
// ---------------------------------------------------------------------------

interface ReviewSummaryProps {
  transactions: Transaction[]
  onExport: () => void
  onReport: () => void
  exporting: boolean
  reporting: boolean
}

function ReviewSummary({ transactions, onExport, onReport, exporting, reporting }: ReviewSummaryProps) {
  const total    = transactions.length
  const approved = transactions.filter((t) => t.status === 'approved').length
  const edited   = transactions.filter((t) => t.status === 'edited').length
  const flagged  = transactions.filter((t) => t.status === 'flagged').length

  const breakdown: { label: string; value: number; color: string; bg: string }[] = [
    { label: 'Approved', value: approved, color: '#065f46', bg: '#ecfdf5' },
    { label: 'Edited',   value: edited,   color: '#1d4ed8', bg: '#eff6ff' },
    { label: 'Flagged',  value: flagged,  color: '#991b1b', bg: '#fef2f2' },
  ].filter((b) => b.value > 0)

  return (
    <div
      className="rounded-2xl border-2 overflow-hidden"
      style={{ borderColor: '#059669', backgroundColor: '#f0fdf4' }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: '#dcfce7', borderBottom: '1px solid #bbf7d0' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#059669' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '1.1rem',
                color: '#14532d',
                letterSpacing: '-0.01em',
              }}
            >
              All {total} transactions reviewed!
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#166534' }}>
              Ready to export or generate the close report.
            </p>
          </div>
        </div>

        {/* Breakdown chips */}
        <div className="flex flex-wrap gap-2">
          {breakdown.map((b) => (
            <span
              key={b.label}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: b.bg, color: b.color }}
            >
              {b.value} {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onExport}
          disabled={exporting || reporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={(e) => { if (!exporting && !reporting) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {exporting ? (
            <SummarySpinner />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
          {exporting ? 'Exporting…' : 'Export to QuickBooks'}
        </button>

        <button
          onClick={onReport}
          disabled={reporting || exporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border disabled:opacity-60 transition-colors"
          style={{ borderColor: '#059669', color: '#059669', backgroundColor: '#ffffff' }}
          onMouseEnter={(e) => { if (!reporting && !exporting) e.currentTarget.style.backgroundColor = '#f0fdf4' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff' }}
        >
          {reporting ? (
            <SummarySpinner />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
              <path d="M4 4.5h4M4 7h4M4 9.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M9 8.5l1.5 1.5L13 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {reporting ? 'Generating…' : 'Generate Close Report'}
        </button>

        <p className="text-xs ml-1" style={{ color: '#6b7280' }}>
          {flagged > 0 && `${flagged} flagged transaction${flagged !== 1 ? 's' : ''} will not be exported.`}
        </p>
      </div>
    </div>
  )
}

function SummarySpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Recurring transactions panel
// ---------------------------------------------------------------------------

const FREQ_LABEL: Record<RecurringPattern['frequency'], string> = {
  weekly:    'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly:   'Monthly',
  irregular: 'Recurring',
}

function RecurringPanel({ patterns }: { patterns: RecurringPattern[] }) {
  const [open, setOpen] = useState(true)

  if (patterns.length === 0) return null

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left"
        style={{ backgroundColor: open ? '#fdf6f0' : '#ffffff' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf6f0' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = open ? '#fdf6f0' : '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <RecurIconLg />
          <div>
            <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Recurring Transactions
            </span>
            <span
              className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#f5e6d8', color: '#b8734a' }}
            >
              {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        >
          <path d="M3 5l4 4 4-4" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t divide-y" style={{ borderColor: '#f0ebe3' }}>
          {patterns.map((p) => {
            const amtStr = p.minAmount === p.maxAmount
              ? `$${p.avgAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `~$${p.avgAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

            return (
              <div
                key={p.vendor}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                style={{ borderColor: '#f0ebe3' }}
              >
                {/* Left: vendor + frequency */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
                  >
                    {FREQ_LABEL[p.frequency]}
                  </span>
                  <span
                    className="text-sm font-medium truncate max-w-[240px]"
                    style={{ color: '#1a1714' }}
                    title={p.vendor}
                  >
                    {p.vendor}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: '#a09a94' }}>
                    ×{p.count}
                  </span>
                </div>

                {/* Right: amount + last / next date */}
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <p className="font-mono text-sm font-semibold" style={{ color: '#1a1714' }}>
                      {amtStr}
                    </p>
                    <p className="text-xs" style={{ color: '#a09a94' }}>avg / occurrence</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono" style={{ color: '#6b6560' }}>
                      Last: {p.lastDate}
                    </p>
                    {p.nextExpectedDate && (
                      <p className="text-xs font-mono" style={{ color: '#b8734a' }}>
                        Next: ~{p.nextExpectedDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="px-5 py-2.5">
            <p className="text-xs" style={{ color: '#c4bdb8' }}>
              Patterns detected from vendor name, amount variance ≤15%, and regular intervals.
              Marked with <span style={{ color: '#b8734a' }}>↺</span> in the transaction table.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Push to QuickBooks modal
// ---------------------------------------------------------------------------

type PushStep = 'confirm' | 'connecting' | 'uploading' | 'success'

interface PushModalProps {
  count: number
  connection: QBOConnection
  onConfirm: () => void
  onCancel: () => void
  step: PushStep
}

function PushModal({ count, connection, onConfirm, onCancel, step }: PushModalProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && step === 'confirm') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [step, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={() => step === 'confirm' && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* QBO header strip */}
        <div
          className="px-5 py-3.5 flex items-center gap-2.5"
          style={{ backgroundColor: '#2CA01C' }}
        >
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="9" fill="rgba(255,255,255,0.25)" />
            <text x="20" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="system-ui,sans-serif" fill="white">QB</text>
          </svg>
          <span className="text-sm font-semibold text-white">QuickBooks Online</span>
          <span className="ml-auto text-xs text-white opacity-75">{connection.companyName}</span>
        </div>

        <div className="px-6 py-6">
          {step === 'confirm' && (
            <>
              <p className="text-base font-semibold" style={{ color: '#1a1714' }}>
                Push transactions to QuickBooks?
              </p>
              <p className="text-sm mt-2" style={{ color: '#6b6560' }}>
                <span className="font-semibold" style={{ color: '#2CA01C' }}>{count}</span> approved transaction{count !== 1 ? 's' : ''} will be synced to{' '}
                <span className="font-medium" style={{ color: '#1a1714' }}>{connection.companyName}</span>.
                Transactions will be posted with their categorized account codes.
              </p>
              <div
                className="mt-4 rounded-xl px-3.5 py-3 text-xs"
                style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
              >
                Flagged and pending transactions are excluded from this push.
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1a1714' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4' }}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#2CA01C' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  Push {count} transactions
                </button>
              </div>
            </>
          )}

          {(step === 'connecting' || step === 'uploading') && (
            <div className="py-6 flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#2CA01C', borderTopColor: 'transparent' }}
              />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                  {step === 'connecting' ? 'Connecting to QuickBooks…' : `Uploading ${count} transactions…`}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                  {step === 'connecting' ? 'Authenticating with your company' : 'Posting to general ledger'}
                </p>
              </div>
              {/* Simulated progress bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#dcfce7' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: step === 'connecting' ? '35%' : '85%',
                    backgroundColor: '#2CA01C',
                    transition: 'width 1.2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 flex flex-col items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6 6 12-12" stroke="#2CA01C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold" style={{ color: '#14532d' }}>
                  {count} transaction{count !== 1 ? 's' : ''} synced to QuickBooks ✓
                </p>
                <p className="text-xs mt-1.5" style={{ color: '#6b6560' }}>
                  Transactions are now visible in {connection.companyName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Audit trail panel
// ---------------------------------------------------------------------------

type AuditFilterTab = 'all' | 'transactions' | 'exports' | 'system'

function AuditPanel({ auditEvents }: { auditEvents: AuditEvent[] }) {
  const [open, setOpen]       = useState(false)
  const [tab, setTab]         = useState<AuditFilterTab>('all')

  const filtered = tab === 'all'
    ? auditEvents
    : auditEvents.filter((e) => auditGroup(e.action) === tab)

  const counts = {
    all:          auditEvents.length,
    transactions: auditEvents.filter((e) => auditGroup(e.action) === 'transactions').length,
    exports:      auditEvents.filter((e) => auditGroup(e.action) === 'exports').length,
    system:       auditEvents.filter((e) => auditGroup(e.action) === 'system').length,
  }

  const tabLabels: Record<AuditFilterTab, string> = {
    all: 'All', transactions: 'Transactions', exports: 'Exports', system: 'System',
  }

  const dotColor: Record<string, string> = {
    tx_approved:         '#059669',
    tx_flagged:          '#ef4444',
    tx_category_changed: '#3b82f6',
    tx_note_added:       '#a09a94',
    job_exported:        '#b8734a',
    job_completed:       '#2d5a27',
    job_created:         '#6b6560',
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left"
        style={{ backgroundColor: open ? '#faf8f4' : '#ffffff' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = open ? '#faf8f4' : '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#f5f0ea' }}
          >
            <AuditClockIcon />
          </span>
          <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>
            Audit Trail
          </span>
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: '#f5e6d8', color: '#b8734a' }}
          >
            {auditEvents.length} event{auditEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        >
          <path d="M3 5l4 4 4-4" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: '#f0ece4' }}>
          {/* Filter tabs */}
          <div className="flex gap-0.5 px-4 pt-3 border-b" style={{ borderColor: '#f0ece4' }}>
            {(['all', 'transactions', 'exports', 'system'] as AuditFilterTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors"
                style={{
                  borderBottomColor: tab === t ? '#b8734a' : 'transparent',
                  color: tab === t ? '#b8734a' : '#6b6560',
                }}
              >
                {tabLabels[t]}
                <span
                  className="ml-1 font-mono px-1 py-0.5 rounded-full"
                  style={{
                    backgroundColor: tab === t ? '#fde8d4' : '#f5f0ea',
                    color: tab === t ? '#b8734a' : '#a09a94',
                    fontSize: 10,
                  }}
                >
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: '#a09a94' }}>No events in this category.</p>
            </div>
          ) : (
            <div className="px-5 py-4">
              <ol className="relative space-y-4 pl-5" style={{ borderLeft: '2px solid #f0ece4' }}>
                {[...filtered].reverse().map((ev) => (
                  <li key={ev.id} className="relative">
                    <span
                      className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2"
                      style={{
                        backgroundColor: dotColor[ev.action] ?? '#a09a94',
                        borderColor: '#ffffff',
                      }}
                    />
                    <p className="text-sm" style={{ color: '#1a1714' }}>
                      {formatAuditEvent(ev)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
                      {ev.actor} · {fmtAuditTs(ev.timestamp)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AuditClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#6b6560" strokeWidth="1.3" />
      <path d="M6.5 3.5V6.5l2 2" stroke="#6b6560" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  const [exporting, setExporting]   = useState(false)
  const [reporting, setReporting]   = useState(false)
  const [completing, setCompleting] = useState(false)
  const [toasts, setToasts]     = useState<ToastState[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const toastId = useRef(0)

  // QBO
  const [qboConn,    setQboConn]    = useState<QBOConnection | null>(null)
  const [showPush,   setShowPush]   = useState(false)
  const [pushStep,   setPushStep]   = useState<PushStep>('confirm')

  useEffect(() => {
    const found = getJob(jobId)
    if (!found) { setNotFound(true); return }
    setJob(found)
    setQboConn(getQBOConnection())
    // Load audit trail; log job_created on first open if trail is empty
    const existing = getAuditTrail(jobId)
    if (existing.length === 0) {
      logAuditEvent(jobId, {
        action: 'job_created',
        actor: 'system',
        details: { txCount: found.total_transactions },
      })
      setAuditEvents(getAuditTrail(jobId))
    } else {
      setAuditEvents(existing)
    }
  }, [jobId])

  const logAudit: AuditCallback = useCallback((event) => {
    logAuditEvent(jobId, { ...event, actor: 'CPA' })
    setAuditEvents(getAuditTrail(jobId))
  }, [jobId])

  const addToast = useCallback((message: string, kind: ToastKind) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, kind }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Recurring detection — must be declared before any early returns (Rules of Hooks)
  const recurringPatterns = useMemo(
    () => (job ? detectRecurring(job.transactions) : []),
    [job]
  )
  const recurringIds = useMemo(
    () => new Set(recurringPatterns.flatMap((p) => p.transactionIds)),
    [recurringPatterns]
  )

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
      logAuditEvent(jobId, {
        action: 'job_exported',
        actor: 'CPA',
        details: { count: exportable.length, format: label },
      })
      setAuditEvents(getAuditTrail(jobId))
      logActivity({
        type: 'csv_exported',
        description: `${label} exported for ${job.client_name} (${exportable.length} transactions)`,
        clientName: job.client_name,
        jobId: job.id,
      })
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleReport() {
    if (!job) return
    setReporting(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, auditEvents }),
      })
      if (!res.ok) throw new Error('Report generation failed.')
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      logActivity({
        type: 'report_generated',
        description: `Close report generated for ${job.client_name}`,
        clientName: job.client_name,
        jobId: job.id,
      })
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not generate report.', 'error')
    } finally {
      setReporting(false)
    }
  }

  function handleComplete() {
    if (!job) return
    setCompleting(true)
    const next: CategorizationJob = { ...job, status: 'completed' }
    saveJob(next)
    setJob(next)
    setCompleting(false)
    logAuditEvent(jobId, {
      action: 'job_completed',
      actor: 'CPA',
      details: { approved: job.approved, flagged: job.flagged },
    })
    setAuditEvents(getAuditTrail(jobId))
    addToast('Close marked as complete.', 'success')
    logActivity({
      type: 'close_completed',
      description: `Close completed for ${job.client_name}`,
      clientName: job.client_name,
      jobId: job.id,
    })
  }

  function handlePushToQBO() {
    setPushStep('confirm')
    setShowPush(true)
  }

  function executePush() {
    if (!job || !qboConn) return
    const count = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited').length
    setPushStep('connecting')
    setTimeout(() => {
      setPushStep('uploading')
      setTimeout(() => {
        setPushStep('success')
        recordQBOSync(count)
        setQboConn(getQBOConnection())
        logActivity({
          type: 'csv_exported',
          description: `${count} transactions pushed to QuickBooks Online for ${job.client_name}`,
          clientName: job.client_name,
          jobId: job.id,
        })
        setTimeout(() => {
          setShowPush(false)
          addToast(`${count} transactions synced to QuickBooks ✓`, 'success')
        }, 2000)
      }, 1800)
    }, 1400)
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

  // All-reviewed check (no pending status remaining)
  const allReviewed = job.transactions.length > 0 &&
    job.transactions.every((t) => t.status !== 'pending')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      {showPush && qboConn && (
        <PushModal
          count={approvedCount}
          connection={qboConn}
          step={pushStep}
          onConfirm={executePush}
          onCancel={() => setShowPush(false)}
        />
      )}
      <DashboardNav />

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 space-y-6 page-enter">

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

            <button
              onClick={handleReport}
              disabled={reporting || exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => { if (!reporting) e.currentTarget.style.borderColor = '#b8734a' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              title="Generate a printable PDF report"
            >
              {reporting ? <Spinner /> : <ReportIcon />}
              {reporting ? 'Generating…' : 'Report'}
            </button>

            {/* Push to QuickBooks — only shown when connected */}
            {qboConn && approvedCount > 0 && (
              <button
                onClick={handlePushToQBO}
                disabled={exporting || reporting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#2CA01C' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                title={`Push ${approvedCount} approved transactions to QuickBooks Online`}
              >
                <QBOIcon />
                Push to QuickBooks
              </button>
            )}

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

        {/* Category breakdown */}
        <CategoryBreakdown transactions={job.transactions} />

        {/* Review complete summary */}
        {allReviewed && (
          <ReviewSummary
            transactions={job.transactions}
            onExport={() => handleExport('quickbooks')}
            onReport={handleReport}
            exporting={exporting}
            reporting={reporting}
          />
        )}

        {/* AI Insights */}
        <JobInsightsPanel job={job} autoGenerate />

        {/* Recurring transactions panel */}
        <RecurringPanel patterns={recurringPatterns} />

        {/* Transaction table */}
        <TransactionTable
          initialTransactions={job.transactions}
          chartOfAccounts={job.chart_of_accounts}
          onTransactionsChange={handleTransactionsChange}
          recurringIds={recurringIds}
          onAudit={logAudit}
          auditEvents={auditEvents}
        />

        {/* Audit trail panel */}
        <AuditPanel auditEvents={auditEvents} />
      </main>

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <AppFooter />
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

function ReportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2" y="1" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M4 4.5h4M4 7h4M4 9.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 8.5l1.5 1.5L13 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

function QBOIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect width="14" height="14" rx="3" fill="rgba(255,255,255,0.25)" />
      <text x="7" y="10.5" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="system-ui,sans-serif" fill="white">QB</text>
    </svg>
  )
}

function RecurIconLg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 8A6 6 0 0 1 12 3.5L14 5.5M14 8A6 6 0 0 1 4 12.5L2 10.5"
        stroke="#b8734a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M14 2.5v3H11" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 13.5v-3H5" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
