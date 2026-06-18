'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TransactionTable from '@/components/TransactionTable'
import { KeyboardShortcutProvider } from '@/lib/review/KeyboardShortcutProvider'
import { hydrateRules, applyRulesToJob } from '@/lib/review/rules'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import NarrativeInsight from '@/components/ai/NarrativeInsight'
import SendMonthlyReportButton from '@/components/reports/SendMonthlyReportButton'
import AutoCloseModal from '@/components/ai/AutoCloseModal'
import { getJob, saveJob, getJobs } from '@/lib/storage'
import { dbGetJob, dbSaveJob } from '@/lib/db'
import { detectRecurring } from '@/lib/recurringDetection'
import { logActivity } from '@/lib/activity'
import { getQBOConnection, recordQBOSync } from '@/lib/integrations'
import { JobInsightsPanel } from '@/components/InsightsPanel'
import { getAuditTrail, logAuditEvent, auditGroup, formatAuditEvent, fmtAuditTs } from '@/lib/auditTrail'
import { calcROI, fmtHours } from '@/lib/roiCalc'
import { detectAnomalies } from '@/lib/anomalyDetection'
import { loadFirmSettings } from '@/lib/firmSettings'
import CopilotPanel from '@/components/CopilotPanel'
import CloseChat from '@/components/CloseChat'
import TaxHandoffButton from '@/components/TaxHandoffButton'
import ClientEmailDraft from '@/components/ClientEmailDraft'
import BenchmarkPanel from '@/components/BenchmarkPanel'
import { getClients, saveClient } from '@/lib/storage'
import { startSession, endSession } from '@/lib/timeTracking'
import type { QBOConnection } from '@/lib/integrations'
import type { CategorizationJob, Transaction } from '@/types'
import type { ClientIndustry } from '@/types'
import type { RecurringPattern } from '@/lib/recurringDetection'
import type { AuditEvent, AuditCallback } from '@/lib/auditTrail'
import type { Anomaly } from '@/lib/anomalyDetection'

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
// Stat pill
// ---------------------------------------------------------------------------

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <span className="font-mono text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: '#a09a94' }}>{label}</span>
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

type PushStep = 'confirm' | 'connecting' | 'uploading' | 'success' | 'error'

interface PushModalProps {
  count: number
  connection: QBOConnection
  onConfirm: () => void
  onCancel: () => void
  step: PushStep
  errorMessage?: string
}

function PushModal({ count, connection, onConfirm, onCancel, step, errorMessage }: PushModalProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && (step === 'confirm' || step === 'error')) onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [step, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={() => (step === 'confirm' || step === 'error') && onCancel()}
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
          {step === 'error' && (
            <>
              <p className="text-base font-semibold" style={{ color: '#991b1b' }}>
                Could not post to QuickBooks
              </p>
              <p className="text-sm mt-2" style={{ color: '#6b6560' }}>
                {errorMessage ?? 'Check your connection under Integrations and try again.'}
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#2CA01C' }}
                >
                  Try again
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <p className="text-base font-semibold" style={{ color: '#1a1714' }}>
                Push transactions to QuickBooks?
              </p>
              <p className="text-sm mt-2" style={{ color: '#6b6560' }}>
                <span className="font-semibold" style={{ color: '#2CA01C' }}>{count}</span> approved transaction{count !== 1 ? 's' : ''} will be synced to{' '}
                <span className="font-medium" style={{ color: '#1a1714' }}>{connection.companyName}</span>.
                Live connections post journal entries (Bank ↔ Expense) for each approved line. Demo mode simulates sync without calling Intuit.
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
                  Sync complete ✓
                </p>
                <p className="text-xs mt-1.5" style={{ color: '#6b6560' }}>
                  Check journal entries in {connection.companyName}
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
  const [exporting, setExporting]         = useState(false)
  const [reporting, setReporting]         = useState(false)
  const [clientSummary, setClientSummary] = useState(false)
  const [completing, setCompleting]       = useState(false)
  const [showShareModal, setShowShareModal]     = useState(false)
  const [chatHighlightIds, setChatHighlightIds] = useState<Set<string>>(new Set())
  const [showEmailDraft, setShowEmailDraft]     = useState(false)
  const [clientIndustry, setClientIndustry]     = useState<ClientIndustry | null>(null)
  type PanelTab = 'transactions' | 'anomalies' | 'recurring' | 'benchmarks' | 'audit'
  const [activePanel, setActivePanel]           = useState<PanelTab>('transactions')
  const [toasts, setToasts]     = useState<ToastState[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const toastId = useRef(0)
  const [autoCloseOpen, setAutoCloseOpen] = useState(false)

  // QBO — demo: localStorage; production: OAuth via /api/integrations/quickbooks/*
  const [qboConn,    setQboConn]    = useState<QBOConnection | null>(null)
  const [qboLive,    setQboLive]    = useState(false)
  const [showPush,   setShowPush]   = useState(false)
  const [pushStep,   setPushStep]   = useState<PushStep>('confirm')
  const [pushError,  setPushError]  = useState('')

  // Time tracking
  const sessionIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!jobId) return
    // We'll start a session after job loads — need clientName
    return () => {
      // End session when leaving the review page
      if (sessionIdRef.current) endSession(sessionIdRef.current)
    }
  }, [jobId])

  useEffect(() => {
    let cancelled = false
    // Hydrate category rules in parallel (fails soft if Supabase unavailable)
    getSupabaseAndFirm().then((ctx) => {
      if (!ctx || cancelled) return
      return hydrateRules(ctx.supabase, ctx.firmId)
    }).catch(() => { /* ignore — rules will just be empty */ })
    // Try Supabase first, fall back to localStorage
    dbGetJob(jobId).then((found) => {
      if (cancelled) return
      if (!found) { setNotFound(true); return }
      // Apply rules that have been learned for this firm
      const { txs: seeded, applied } = applyRulesToJob(found.transactions)
      if (applied.length > 0) {
        found = { ...found, transactions: seeded }
      }
      setJob(found)
      // Start time tracking for this review session
      if (!sessionIdRef.current) {
        sessionIdRef.current = startSession(jobId, found.client_name, 'review')
      }
      setQboConn(getQBOConnection())
      setQboLive(false)
      fetch('/api/integrations/quickbooks/status')
        .then((r) => r.json())
        .then((data: { connected?: boolean; companyName?: string; realmId?: string; lastSyncAt?: string | null; totalSynced?: number }) => {
          if (data.connected && data.companyName && data.realmId) {
            setQboLive(true)
            setQboConn({
              companyId:   data.realmId,
              companyName: data.companyName,
              connectedAt: new Date().toISOString(),
              lastSyncAt:  data.lastSyncAt ?? null,
              totalSynced: data.totalSynced ?? 0,
            })
          }
        })
        .catch(() => { /* keep local demo connection */ })
      // Load client industry from localStorage (fast, always available)
      const client = getClients().find((c) => c.business_name === found.client_name)
      if (client) setClientIndustry(client.industry)
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
    }).catch(() => {
      // Supabase failed, fall back to localStorage
      let found = getJob(jobId)
      if (!found) { setNotFound(true); return }
      const { txs: seeded, applied } = applyRulesToJob(found.transactions)
      if (applied.length > 0) found = { ...found, transactions: seeded }
      setJob(found)
      setQboConn(getQBOConnection())
      setQboLive(false)
      fetch('/api/integrations/quickbooks/status')
        .then((r) => r.json())
        .then((data: { connected?: boolean; companyName?: string; realmId?: string; lastSyncAt?: string | null; totalSynced?: number }) => {
          if (data.connected && data.companyName && data.realmId) {
            setQboLive(true)
            setQboConn({
              companyId:   data.realmId,
              companyName: data.companyName,
              connectedAt: new Date().toISOString(),
              lastSyncAt:  data.lastSyncAt ?? null,
              totalSynced: data.totalSynced ?? 0,
            })
          }
        })
        .catch(() => {})
      const client = getClients().find((c) => c.business_name === found.client_name)
      if (client) setClientIndustry(client.industry)
      const existing = getAuditTrail(jobId)
      if (existing.length === 0) {
        logAuditEvent(jobId, { action: 'job_created', actor: 'system', details: { txCount: found.total_transactions } })
        setAuditEvents(getAuditTrail(jobId))
      } else {
        setAuditEvents(existing)
      }
    })
    return () => { cancelled = true }
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

  // All jobs for anomaly detection and tax handoff
  const allClientJobs = useMemo(() => {
    if (!job) return []
    return getJobs().filter((j) => j.client_name === job.client_name)
  }, [job])

  // Anomaly detection — compare current job to previous job for same client
  const anomalies = useMemo(() => {
    if (!job) return []
    const prevJob = allClientJobs
      .filter((j) => j.id !== job.id && j.created_at < job.created_at)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    return detectAnomalies(job.transactions, prevJob?.transactions ?? null)
  }, [job, allClientJobs])

  function handleTransactionsChange(updated: Transaction[]) {
    if (!job) return
    const approved = updated.filter((t) => t.status === 'approved' || t.status === 'edited').length
    const flagged  = updated.filter((t) => t.status === 'flagged').length
    const next: CategorizationJob = { ...job, transactions: updated, approved, flagged }
    setJob(next)
    dbSaveJob(next).catch(() => { /* localStorage fallback already written inside dbSaveJob */ })
  }

  // Broadcast review context to the global AI chat panel
  useEffect(() => {
    if (!job) return
    window.dispatchEvent(new CustomEvent('cb-chat-context', {
      detail: {
        clientName: job.client_name,
        clientIndustry: clientIndustry ?? undefined,
        jobId: job.id,
        jobMonth: new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        transactions: job.transactions,
        overdueCount: 0,
      },
    }))
  }, [job, clientIndustry])

  // Broadcast a mutator so the chat panel can apply AI tool calls
  useEffect(() => {
    const mutator = (ids: string[], patch: (t: Transaction) => Transaction) => {
      setJob((prev) => {
        if (!prev) return prev
        const updated = prev.transactions.map((t) => (ids.includes(t.id) ? patch(t) : t))
        const approvedCount = updated.filter((t) => t.status === 'approved' || t.status === 'edited').length
        const flaggedCount  = updated.filter((t) => t.status === 'flagged').length
        const next: CategorizationJob = { ...prev, transactions: updated, approved: approvedCount, flagged: flaggedCount }
        dbSaveJob(next).catch(() => { /* fallback */ })
        return next
      })
    }
    window.dispatchEvent(new CustomEvent('cb-chat-mutator', { detail: mutator }))
  }, [])

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
          chartOfAccounts: job.chart_of_accounts,
          clientName: job.client_name,
          format,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const firstIssue = Array.isArray(data.issues) && data.issues[0]
          ? ` First issue: ${data.issues[0].description} — ${data.issues[0].issues?.[0] ?? 'review required'}`
          : ''
        throw new Error(`${data.error ?? `Export failed (${res.status})`}${firstIssue}`)
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

  async function handleClientSummary() {
    if (!job) return
    setClientSummary(true)
    try {
      const firmSettings = loadFirmSettings()
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, mode: 'client-summary', firmSettings }),
      })
      if (!res.ok) throw new Error('Summary generation failed.')
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not generate summary.', 'error')
    } finally {
      setClientSummary(false)
    }
  }

  function handleComplete() {
    if (!job) return
    setCompleting(true)
    const next: CategorizationJob = { ...job, status: 'completed' }
    dbSaveJob(next).catch(() => { /* localStorage fallback already written inside dbSaveJob */ })
    setJob(next)
    setCompleting(false)
    logAuditEvent(jobId, {
      action: 'job_completed',
      actor: 'CPA',
      details: { approved: job.approved, flagged: job.flagged },
    })
    setAuditEvents(getAuditTrail(jobId))
    addToast('Close marked as complete.', 'success')
    setShowShareModal(true)
    logActivity({
      type: 'close_completed',
      description: `Close completed for ${job.client_name}`,
      clientName: job.client_name,
      jobId: job.id,
    })
  }

  function handlePushToQBO() {
    setPushStep('confirm')
    setPushError('')
    setShowPush(true)
  }

  function executePush() {
    if (!job || !qboConn) return
    const approved = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited')
    const count = approved.length
    setPushStep('connecting')
    setPushError('')

    if (qboLive) {
      void (async () => {
        try {
          setPushStep('uploading')
          const res = await fetch('/api/integrations/quickbooks/push', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ transactions: approved }),
          })
          const data = (await res.json()) as { error?: string; pushed?: number; message?: string }
          if (!res.ok) {
            setPushError(data.error ?? 'QuickBooks push failed.')
            setPushStep('error')
            return
          }
          const pushed = typeof data.pushed === 'number' ? data.pushed : count
          setPushStep('success')
          setQboConn((prev) =>
            prev
              ? {
                  ...prev,
                  lastSyncAt: new Date().toISOString(),
                  totalSynced: prev.totalSynced + pushed,
                }
              : prev
          )
          logActivity({
            type: 'csv_exported',
            description: `${pushed} journal entries posted to QuickBooks Online for ${job.client_name}`,
            clientName: job.client_name,
            jobId: job.id,
          })
          setTimeout(() => {
            setShowPush(false)
            addToast(data.message ?? `${pushed} entries posted to QuickBooks ✓`, 'success')
          }, 2000)
        } catch {
          setPushError('Network error while contacting QuickBooks.')
          setPushStep('error')
        }
      })()
      return
    }

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
    <KeyboardShortcutProvider>
    <div data-theme="dark" className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-base)', color: 'var(--text-primary)' }}>
      {showPush && qboConn && (
        <PushModal
          count={approvedCount}
          connection={qboConn}
          step={pushStep}
          errorMessage={pushError}
          onConfirm={executePush}
          onCancel={() => setShowPush(false)}
        />
      )}

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 page-enter">

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

            <button
              onClick={handleClientSummary}
              disabled={clientSummary || exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => { if (!clientSummary) e.currentTarget.style.borderColor = '#2d5a27' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              title="Generate a branded client-facing summary"
            >
              {clientSummary ? <Spinner /> : <ClientSummaryIcon />}
              {clientSummary ? 'Generating…' : 'Client Summary'}
            </button>

            <TaxHandoffButton
              job={job}
              allClientJobs={allClientJobs}
              onError={(msg) => addToast(msg, 'error')}
            />

            <button
              onClick={() => setShowEmailDraft(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4' }}
              title="Draft a plain-English email summary for the client"
            >
              <EmailIcon />
              Email Client
            </button>

            <SendMonthlyReportButton
              job={job}
              priorJob={allClientJobs.find((j) => j.id !== job.id && j.created_at < job.created_at) ?? null}
              clientEmail={getClients().find((c) => c.business_name === job.client_name)?.contact_email}
            />

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

            <button
              onClick={() => setAutoCloseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#1a1714' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0d0b09' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a1714' }}
              title="Run the autonomous close agent"
            >
              ✦ Run Auto-Close
            </button>

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

        {/* Stats pills row */}
        <div className="flex flex-wrap items-center gap-2">
          <StatPill label="Total"    value={job.total_transactions} color="#1a1714" />
          <StatPill label="Approved" value={job.approved}           color="#059669" />
          <StatPill label="Pending"  value={pending}                color="#d97706" />
          <StatPill label="Flagged"  value={job.flagged}            color="#ef4444" />
          {(job.auto_categorized ?? 0) > 0 && (() => {
            const roi = calcROI(job)
            return (
              <>
                <span className="text-sm" style={{ color: '#e8e0d4' }}>·</span>
                <span className="text-xs" style={{ color: '#4a7c43' }}>
                  <span className="font-mono font-semibold">{fmtHours(roi.hoursSaved)}</span>
                  {' saved · '}
                  <span className="font-mono font-semibold">${roi.valueSaved.toLocaleString()}</span>
                  {' value recovered'}
                </span>
              </>
            )
          })()}
        </div>

        {/* Copilot */}
        <CopilotPanel
          job={job}
          jobId={jobId}
          onTransactionsUpdated={(txs) => {
            const approved = txs.filter((t) => t.status === 'approved' || t.status === 'edited').length
            const flagged  = txs.filter((t) => t.status === 'flagged').length
            const next: CategorizationJob = { ...job, transactions: txs, approved, flagged }
            setJob(next)
            saveJob(next)
          }}
        />

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: pct === 100 ? '#059669' : pct >= 50 ? '#2d5a27' : '#b8734a',
              }}
            />
          </div>
          <span
            className="font-mono text-xs font-medium shrink-0 tabular-nums"
            style={{ color: pct === 100 ? '#059669' : '#a09a94' }}
          >
            {pct}% reviewed
          </span>
        </div>

        {/* AI narrative summary */}
        {job.transactions.length > 0 && (
          <NarrativeInsight
            clientName={job.client_name}
            clientIndustry={clientIndustry ?? undefined}
            period={new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            transactions={job.transactions}
            priorTransactions={allClientJobs.find((j) => j.id !== job.id && j.created_at < job.created_at)?.transactions ?? null}
            onHighlight={(ids) => setChatHighlightIds(ids)}
            onEmailClient={() => setShowEmailDraft(true)}
            onNarrativeGenerated={(n) => {
              setJob((prev) => {
                if (!prev) return prev
                const next = { ...prev, narrative: n }
                dbSaveJob(next).catch(() => { /* localStorage fallback inside dbSaveJob */ })
                return next
              })
            }}
          />
        )}

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

        {/* Tabbed panels */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          {/* Tab bar */}
          <div className="flex border-b" style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}>
            {([
              { key: 'transactions', label: 'Transactions',                      badge: null },
              { key: 'anomalies',    label: 'Anomalies',                          badge: anomalies.length > 0 ? anomalies.length : null },
              { key: 'recurring',    label: 'Recurring',                          badge: recurringPatterns.length > 0 ? recurringPatterns.length : null },
              { key: 'benchmarks',   label: 'Benchmarks',                         badge: null },
              { key: 'audit',        label: 'Audit Trail',                        badge: auditEvents.length > 0 ? auditEvents.length : null },
            ] as { key: PanelTab; label: string; badge: number | null }[]).map(({ key, label, badge }) => {
              const isActive = activePanel === key
              return (
                <button
                  key={key}
                  onClick={() => setActivePanel(key)}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
                  style={{
                    borderBottomColor: isActive ? '#2d5a27' : 'transparent',
                    color: isActive ? '#2d5a27' : '#6b6560',
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                  }}
                >
                  {label}
                  {badge !== null && (
                    <span
                      className="font-mono text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: key === 'anomalies' && anomalies.some(a => a.severity === 'high') ? '#fee2e2'
                          : isActive ? '#d4e8d0' : '#f0ece4',
                        color: key === 'anomalies' && anomalies.some(a => a.severity === 'high') ? '#991b1b'
                          : isActive ? '#2d5a27' : '#a09a94',
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-5 space-y-5">
            {activePanel === 'transactions' && (
              <>
                <CategoryBreakdown transactions={job.transactions} />
                <TransactionTable
                  initialTransactions={job.transactions}
                  chartOfAccounts={job.chart_of_accounts}
                  onTransactionsChange={handleTransactionsChange}
                  recurringIds={recurringIds}
                  onAudit={logAudit}
                  auditEvents={auditEvents}
                  highlightIds={chatHighlightIds}
                />
                <JobInsightsPanel job={job} autoGenerate />
              </>
            )}
            {activePanel === 'anomalies' && (
              anomalies.length === 0
                ? <p className="text-sm py-8 text-center" style={{ color: '#a09a94' }}>No anomalies detected for this job.</p>
                : <AnomalyPanel anomalies={anomalies} />
            )}
            {activePanel === 'recurring' && (
              recurringPatterns.length === 0
                ? <p className="text-sm py-8 text-center" style={{ color: '#a09a94' }}>No recurring patterns found.</p>
                : <RecurringPanel patterns={recurringPatterns} />
            )}
            {activePanel === 'benchmarks' && (
              <BenchmarkPanel
                job={job}
                industry={clientIndustry}
                onIndustryChange={(ind) => {
                  setClientIndustry(ind)
                  const client = getClients().find((c) => c.business_name === job.client_name)
                  if (client) saveClient({ ...client, industry: ind })
                }}
              />
            )}
            {activePanel === 'audit' && (
              <AuditPanel auditEvents={auditEvents} />
            )}
          </div>
        </div>
      </main>

      {/* Close Chat — floating */}
      <CloseChat
        jobId={jobId}
        clientName={job.client_name}
        transactions={job.transactions}
        onHighlight={setChatHighlightIds}
      />

      {/* Client Email Draft modal */}
      {showEmailDraft && (
        <ClientEmailDraft
          job={job}
          previousJob={allClientJobs.find((j) => j.id !== job.id && j.created_at < job.created_at) ?? null}
          onClose={() => setShowEmailDraft(false)}
        />
      )}

      {/* Share modal */}
      {showShareModal && (
        <ShareModal job={job} onClose={() => setShowShareModal(false)} />
      )}

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Autonomous Close Agent modal */}
      <AutoCloseModal
        open={autoCloseOpen}
        job={job}
        onClose={() => setAutoCloseOpen(false)}
        onApply={(finalTxs) => handleTransactionsChange(finalTxs)}
      />
    </div>
    </KeyboardShortcutProvider>
  )
}

// ---------------------------------------------------------------------------
// Share modal (Feature 5 — social sharing after close complete)
// ---------------------------------------------------------------------------

function ShareModal({ job, onClose }: { job: CategorizationJob; onClose: () => void }) {
  const roi = calcROI(job)
  const autoApproved = job.transactions.filter((t) => t.status === 'approved' || t.status === 'edited').length
  const accuracy = job.total_transactions > 0
    ? Math.round((autoApproved / job.total_transactions) * 100)
    : 0

  const shareText = `Just closed ${job.client_name}'s books in ${fmtHours(roi.hoursSaved)} with @CloseBooks AI — ${autoApproved} transactions auto-categorized at ${accuracy}% accuracy. What used to take days now takes minutes. #accounting #AI #CPA`

  const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fclosebooks-app.vercel.app&title=${encodeURIComponent('CloseBooks — AI Month-End Close')}&summary=${encodeURIComponent(shareText)}`
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=https%3A%2F%2Fclosebooks-app.vercel.app`

  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(shareText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🎉</span>
              <p className="text-base font-semibold" style={{ color: '#1a1714' }}>
                Close complete!
              </p>
            </div>
            <p className="text-sm" style={{ color: '#6b6560' }}>
              Share your win with your network
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="#6b6560" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Stats card */}
        <div className="mx-6 mb-4 rounded-xl p-4" style={{ backgroundColor: '#f6faf5', border: '1px solid #d4e8d0' }}>
          <p className="text-xs font-medium mb-2" style={{ color: '#6b6560' }}>Your results</p>
          <div className="flex gap-4">
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: '#2d5a27' }}>{fmtHours(roi.hoursSaved)}</p>
              <p className="text-xs" style={{ color: '#6b6560' }}>saved</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: '#2d5a27' }}>${roi.valueSaved.toLocaleString()}</p>
              <p className="text-xs" style={{ color: '#6b6560' }}>value</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: '#2d5a27' }}>{accuracy}%</p>
              <p className="text-xs" style={{ color: '#6b6560' }}>accuracy</p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold" style={{ color: '#2d5a27' }}>{autoApproved}</p>
              <p className="text-xs" style={{ color: '#6b6560' }}>auto-done</p>
            </div>
          </div>
        </div>

        {/* Pre-written share text */}
        <div className="mx-6 mb-4">
          <p className="text-xs font-medium mb-1.5" style={{ color: '#6b6560' }}>Pre-written post</p>
          <div
            className="rounded-xl border p-3 text-sm leading-relaxed"
            style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
          >
            {shareText}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => window.open(linkedInUrl, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-opacity"
            style={{ backgroundColor: '#0077b5' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
              <circle cx="4" cy="4" r="2" fill="white"/>
            </svg>
            Share on LinkedIn
          </button>
          <button
            onClick={() => window.open(twitterUrl, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-opacity"
            style={{ backgroundColor: '#000000' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.80' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.845L1.254 2.25H8.08l4.259 5.63L18.244 2.25zM17.083 19.77h1.833L7.084 4.126H5.117L17.083 19.77z"/>
            </svg>
            Share on X
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{
              borderColor: copied ? '#059669' : '#e8e0d4',
              color: copied ? '#059669' : '#6b6560',
              backgroundColor: copied ? '#ecfdf5' : '#ffffff',
            }}
          >
            {copied ? '✓ Copied' : 'Copy text'}
          </button>
          <button
            onClick={onClose}
            className="ml-auto text-sm"
            style={{ color: '#a09a94' }}
          >
            Skip
          </button>
        </div>
      </div>
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


const ANOMALY_STYLE: Record<string, { border: string; bg: string; dot: string; text: string; label: string }> = {
  high:   { border: '#fca5a5', bg: '#fef2f2', dot: '#ef4444', text: '#991b1b', label: 'High'   },
  medium: { border: '#fed7aa', bg: '#fff7ed', dot: '#f97316', text: '#9a3412', label: 'Medium' },
  low:    { border: '#fde68a', bg: '#fefce8', dot: '#d97706', text: '#854d0e', label: 'Low'    },
}

function AnomalyPanel({ anomalies }: { anomalies: Anomaly[] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? anomalies : anomalies.slice(0, 3)
  const highCount = anomalies.filter((a) => a.severity === 'high').length

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: highCount > 0 ? '#fca5a5' : '#fed7aa', backgroundColor: '#ffffff' }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b" style={{ borderColor: '#f0ece4' }}>
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 13H2L8 2Z" stroke={highCount > 0 ? '#ef4444' : '#f97316'} strokeWidth="1.5" strokeLinejoin="round" fill={highCount > 0 ? '#fee2e2' : '#fff7ed'} />
            <path d="M8 6v3M8 11v0.5" stroke={highCount > 0 ? '#ef4444' : '#f97316'} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>
            Anomaly Alerts
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: highCount > 0 ? '#fee2e2' : '#fff7ed', color: highCount > 0 ? '#991b1b' : '#9a3412' }}
          >
            {anomalies.length} {anomalies.length === 1 ? 'issue' : 'issues'}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#a09a94' }}>vs. prior period</p>
      </div>
      <div className="divide-y" style={{ borderColor: '#f0ece4' }}>
        {shown.map((a, i) => {
          const s = ANOMALY_STYLE[a.severity]
          return (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <span
                className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.dot, marginTop: 6 }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: '#1a1714' }}>{a.title}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                  >
                    {s.label}
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{a.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
      {anomalies.length > 3 && (
        <div className="px-4 py-2.5 border-t" style={{ borderColor: '#f0ece4' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium transition-colors"
            style={{ color: '#b8734a' }}
          >
            {expanded ? 'Show less ↑' : `Show ${anomalies.length - 3} more ↓`}
          </button>
        </div>
      )}
    </div>
  )
}

function ClientSummaryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 5h6M4 7h6M4 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1 4.5l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
