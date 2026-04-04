'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import TransactionRow from './TransactionRow'
import type { Transaction, ChartOfAccounts } from '@/types'
import type { AuditCallback, AuditEvent } from '@/lib/auditTrail'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'pending' | 'approved' | 'flagged'

interface Props {
  initialTransactions: Transaction[]
  chartOfAccounts: ChartOfAccounts[]
  onTransactionsChange?: (transactions: Transaction[]) => void
  recurringIds?: Set<string>
  onAudit?: AuditCallback
  auditEvents?: AuditEvent[]
}

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

function SummaryBar({ transactions }: { transactions: Transaction[] }) {
  const total         = transactions.length
  const pending       = transactions.filter((t) => t.status === 'pending').length
  const flagged       = transactions.filter((t) => t.status === 'flagged').length
  const autoApproved  = transactions.filter((t) => t.status === 'approved' && t.confidence >= 0.85).length

  const stats = [
    { label: 'Total',         value: total,       color: '#1a1714' },
    { label: 'Auto-approved', value: autoApproved, color: '#166534' },
    { label: 'Need review',   value: pending,      color: '#854d0e' },
    { label: 'Flagged',       value: flagged,      color: '#991b1b' },
  ]

  return (
    <div
      className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-3 rounded-xl text-sm border"
      style={{ backgroundColor: '#f5f0ea', borderColor: '#e0dbd4' }}
    >
      {stats.map((s) => (
        <span key={s.label} style={{ color: '#6b6560' }}>
          <span className="font-mono font-semibold mr-1" style={{ color: s.color }}>{s.value}</span>
          {s.label}
        </span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm modal
// ---------------------------------------------------------------------------

interface ConfirmApproveModalProps {
  count: number
  remaining: number
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmApproveModal({ count, remaining, onConfirm, onCancel }: ConfirmApproveModalProps) {
  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl border shadow-xl p-6 max-w-sm w-full"
        style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#e8f0e6' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l4 4 8-8" stroke="#2d5a27" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Approve high-confidence transactions?
            </p>
            <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
              This will approve{' '}
              <span className="font-semibold" style={{ color: '#2d5a27' }}>{count}</span> transaction{count !== 1 ? 's' : ''} with confidence ≥ 85%
              {remaining > 0
                ? `, leaving ${remaining} for manual review.`
                : '. All pending transactions will be approved.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm border transition-colors"
            style={{ borderColor: '#e0dbd4', color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1a1714' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            Approve {count}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts popover
// ---------------------------------------------------------------------------

const SHORTCUTS = [
  { key: 'a',     desc: 'Approve selected rows' },
  { key: 'f',     desc: 'Flag selected rows' },
  { key: 'j',     desc: 'Move focus down' },
  { key: 'k',     desc: 'Move focus up' },
  { key: '↵',     desc: 'Expand / collapse row' },
  { key: '⎵',     desc: 'Toggle checkbox' },
]

function ShortcutsPopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold border transition-colors"
        style={{
          borderColor: open ? '#2d5a27' : '#e0dbd4',
          color: open ? '#2d5a27' : '#6b6560',
          backgroundColor: open ? '#e8f0e6' : 'transparent',
        }}
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        ?
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-30 rounded-xl border shadow-lg p-3 w-52"
          style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: '#6b6560' }}>
            Keyboard shortcuts
          </p>
          <div className="space-y-1.5">
            {SHORTCUTS.map(({ key, desc }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-xs" style={{ color: '#6b6560' }}>{desc}</span>
                <kbd
                  className="px-1.5 py-0.5 rounded text-xs font-mono shrink-0"
                  style={{ backgroundColor: '#f5f0ea', color: '#1a1714', border: '1px solid #e0dbd4' }}
                >
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TransactionTable
// ---------------------------------------------------------------------------

export default function TransactionTable({ initialTransactions, chartOfAccounts, onTransactionsChange, recurringIds, onAudit, auditEvents = [] }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [activeTab, setActiveTab]       = useState<FilterTab>('all')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Set<string>>(new Set())

  // Bulk approve confirm state
  const [showConfirm, setShowConfirm]   = useState(false)
  const [approveResult, setApproveResult] = useState<{ approved: number; remaining: number } | null>(null)

  // j/k row focus
  const [focusedId, setFocusedId]       = useState<string | null>(null)
  // Enter key → toggle expand for focused row
  const [enterTrigger, setEnterTrigger] = useState(0)

  // --- Derived filtered list -----------------------------------------------

  const visible = useMemo(() => {
    let list = transactions

    if (activeTab === 'pending')  list = list.filter((t) => t.status === 'pending')
    if (activeTab === 'approved') list = list.filter((t) => t.status === 'approved' || t.status === 'edited')
    if (activeTab === 'flagged')  list = list.filter((t) => t.status === 'flagged')

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.suggested_category ?? '').toLowerCase().includes(q) ||
          (t.final_category ?? '').toLowerCase().includes(q)
      )
    }

    return list
  }, [transactions, activeTab, search])

  const focusedIndex = useMemo(
    () => visible.findIndex((t) => t.id === focusedId),
    [visible, focusedId]
  )

  // --- Tab counts ----------------------------------------------------------

  const counts = useMemo(() => ({
    all:      transactions.length,
    pending:  transactions.filter((t) => t.status === 'pending').length,
    approved: transactions.filter((t) => t.status === 'approved' || t.status === 'edited').length,
    flagged:  transactions.filter((t) => t.status === 'flagged').length,
  }), [transactions])

  // --- Row change handler --------------------------------------------------

  const handleChange = useCallback((updated: Transaction) => {
    setTransactions((prev) => {
      const next = prev.map((t) => t.id === updated.id ? updated : t)
      onTransactionsChange?.(next)
      return next
    })
  }, [onTransactionsChange])

  // --- Select helpers ------------------------------------------------------

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === visible.length && visible.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visible.map((t) => t.id)))
    }
  }

  // --- Bulk actions --------------------------------------------------------

  const bulkApprove = useCallback(() => {
    setTransactions((prev) => {
      const next = prev.map((t) => {
        if (!selected.has(t.id)) return t
        onAudit?.({
          action: 'tx_approved',
          txId: t.id,
          txDescription: t.description,
          details: { category: t.final_category ?? t.suggested_category ?? '', bulk: 'true' },
        })
        return { ...t, status: 'approved' as const, final_category: t.final_category ?? t.suggested_category, final_account_code: t.final_account_code ?? t.suggested_account_code }
      })
      onTransactionsChange?.(next)
      return next
    })
    setSelected(new Set())
  }, [selected, onTransactionsChange, onAudit])

  const bulkFlag = useCallback(() => {
    setTransactions((prev) => {
      const next = prev.map((t) => {
        if (!selected.has(t.id)) return t
        onAudit?.({
          action: 'tx_flagged',
          txId: t.id,
          txDescription: t.description,
          details: { reason: '', bulk: 'true' },
        })
        return { ...t, status: 'flagged' as const }
      })
      onTransactionsChange?.(next)
      return next
    })
    setSelected(new Set())
  }, [selected, onTransactionsChange, onAudit])

  // --- High-confidence approve (with confirm) -------------------------------

  const highConfidencePending = transactions.filter(
    (t) => t.confidence >= 0.85 && t.status === 'pending'
  ).length

  const lowConfidencePending = transactions.filter(
    (t) => t.status === 'pending' && t.confidence < 0.85
  ).length

  function handleApproveHighConfidenceClick() {
    if (highConfidencePending === 0) return
    setShowConfirm(true)
  }

  function doApproveHighConfidence() {
    setShowConfirm(false)
    setTransactions((prev) => {
      const next = prev.map((t) => {
        if (!(t.confidence >= 0.85 && t.status === 'pending')) return t
        onAudit?.({
          action: 'tx_approved',
          txId: t.id,
          txDescription: t.description,
          details: { category: t.suggested_category ?? '', bulk: 'true' },
        })
        return { ...t, status: 'approved' as const, final_category: t.suggested_category, final_account_code: t.suggested_account_code }
      })
      onTransactionsChange?.(next)
      return next
    })
    setApproveResult({ approved: highConfidencePending, remaining: lowConfidencePending })
    // Auto-clear the result banner after 6s
    setTimeout(() => setApproveResult(null), 6000)
  }

  // --- Keyboard shortcuts --------------------------------------------------

  const bulkApproveRef = useRef(bulkApprove)
  const bulkFlagRef    = useRef(bulkFlag)
  const selectedRef    = useRef(selected)
  const visibleRef     = useRef(visible)
  const focusedIndexRef = useRef(focusedIndex)
  bulkApproveRef.current    = bulkApprove
  bulkFlagRef.current       = bulkFlag
  selectedRef.current       = selected
  visibleRef.current        = visible
  focusedIndexRef.current   = focusedIndex

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const vis = visibleRef.current
      const fi  = focusedIndexRef.current

      if (e.key === 'j') {
        e.preventDefault()
        const next = fi < vis.length - 1 ? fi + 1 : 0
        setFocusedId(vis[next]?.id ?? null)
        // Scroll into view
        setTimeout(() => {
          document.querySelector(`[data-row-id="${vis[next]?.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }, 0)
        return
      }

      if (e.key === 'k') {
        e.preventDefault()
        const prev = fi > 0 ? fi - 1 : vis.length - 1
        setFocusedId(vis[prev]?.id ?? null)
        setTimeout(() => {
          document.querySelector(`[data-row-id="${vis[prev]?.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }, 0)
        return
      }

      if (e.key === 'Enter' && focusedIndexRef.current >= 0) {
        e.preventDefault()
        setEnterTrigger((n) => n + 1)
        return
      }

      if (e.key === 'a' && selectedRef.current.size > 0) {
        e.preventDefault()
        bulkApproveRef.current()
      }
      if (e.key === 'f' && selectedRef.current.size > 0) {
        e.preventDefault()
        bulkFlagRef.current()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const allVisibleSelected = visible.length > 0 && selected.size === visible.length
  const someSelected       = selected.size > 0

  // -------------------------------------------------------------------------

  return (
    <div className="space-y-3 font-sans">

      {/* Summary bar */}
      <SummaryBar transactions={transactions} />

      {/* Post-approve result banner */}
      {approveResult && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ backgroundColor: '#ecfdf5', borderColor: '#059669', color: '#065f46' }}
        >
          <span>
            <span className="font-semibold">✓ {approveResult.approved} approved.</span>
            {approveResult.remaining > 0
              ? ` ${approveResult.remaining} transaction${approveResult.remaining !== 1 ? 's' : ''} remaining for review.`
              : ' All transactions approved.'}
          </span>
          <button onClick={() => setApproveResult(null)} className="opacity-50 hover:opacity-100 transition-opacity text-lg leading-none">×</button>
        </div>
      )}

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search descriptions…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#faf8f4', color: '#1a1714' }}
          />
        </div>

        {/* Approve high confidence */}
        {highConfidencePending > 0 && (
          <button
            onClick={handleApproveHighConfidenceClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27'; e.currentTarget.style.transform = 'none' }}
            title={`Approve all ${highConfidencePending} transactions with confidence ≥ 85%`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5l3 3 6-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Approve {highConfidencePending} high-confidence
          </button>
        )}

        {/* Bulk actions — only when rows are selected */}
        {someSelected && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
            style={{ borderColor: '#e0dbd4', backgroundColor: '#f5f0ea' }}
          >
            <span style={{ color: '#6b6560' }}>{selected.size} selected</span>
            <span style={{ color: '#e0dbd4' }}>|</span>
            <button
              onClick={bulkApprove}
              className="font-medium transition-colors"
              style={{ color: '#166534' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#14532d' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#166534' }}
            >
              Approve
            </button>
            <button
              onClick={bulkFlag}
              className="font-medium transition-colors"
              style={{ color: '#991b1b' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7f1d1d' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#991b1b' }}
            >
              Flag
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs"
              style={{ color: '#a09a94' }}
            >
              ✕ clear
            </button>
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <ShortcutsPopover />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: '#e0dbd4' }}>
        {(['all', 'pending', 'approved', 'flagged'] as FilterTab[]).map((tab) => {
          const labels: Record<FilterTab, string> = {
            all: 'All', pending: 'Pending Review', approved: 'Approved', flagged: 'Flagged',
          }
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelected(new Set()) }}
              className="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
              style={{
                borderBottomColor: active ? '#2d5a27' : 'transparent',
                color: active ? '#2d5a27' : '#6b6560',
              }}
            >
              {labels[tab]}
              <span
                className="ml-1.5 font-mono text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: active ? '#d4e8d0' : '#f5f0ea',
                  color: active ? '#2d5a27' : '#a09a94',
                }}
              >
                {counts[tab]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden overflow-x-auto"
        style={{ borderColor: '#e0dbd4' }}
      >
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: '#a09a94' }}>
              {search ? 'No transactions match your search.' : 'No transactions in this category.'}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: '#f5f0ea', borderBottom: '1px solid #e0dbd4' }}>
                <th className="pl-3 pr-1 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="rounded"
                    style={{ accentColor: '#2d5a27' }}
                    title={allVisibleSelected ? 'Deselect all' : 'Select all'}
                  />
                </th>
                {[
                  ['Date',        'text-left  w-28',              ''],
                  ['Description', 'text-left  max-w-[220px]',     ''],
                  ['Category',    'text-left',                    ''],
                  ['Confidence',  'text-right w-32 hidden sm:table-cell', ''],
                  ['Amount',      'text-right w-28',              ''],
                  ['Status',      'text-left  w-24',              ''],
                  ['Actions',     'text-left  w-24',              ''],
                ].map(([label, cls]) => (
                  <th
                    key={label}
                    className={`px-3 py-2.5 text-xs font-medium uppercase tracking-wide ${cls}`}
                    style={{ color: '#6b6560' }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  chartOfAccounts={chartOfAccounts}
                  selected={selected.has(tx.id)}
                  onToggleSelect={toggleSelect}
                  onChange={handleChange}
                  isRecurring={recurringIds?.has(tx.id) ?? false}
                  isFocused={focusedId === tx.id}
                  onFocus={() => setFocusedId(tx.id)}
                  enterTrigger={focusedId === tx.id ? enterTrigger : 0}
                  onAudit={onAudit}
                  txAuditEvents={auditEvents.filter((e) => e.txId === tx.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer row */}
      {visible.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#c4bdb8' }}>
            <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: '#f0ece4', color: '#6b6560' }}>j</kbd>
            {' / '}
            <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: '#f0ece4', color: '#6b6560' }}>k</kbd>
            {' navigate · '}
            <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: '#f0ece4', color: '#6b6560' }}>A</kbd>
            {' approve · '}
            <kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: '#f0ece4', color: '#6b6560' }}>F</kbd>
            {' flag'}
          </p>
          <p className="text-xs" style={{ color: '#a09a94' }}>
            Showing {visible.length} of {transactions.length}
          </p>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmApproveModal
          count={highConfidencePending}
          remaining={lowConfidencePending}
          onConfirm={doApproveHighConfidence}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg
      className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
      width="14" height="14" viewBox="0 0 14 14"
      fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="6" cy="6" r="4" stroke="#a09a94" strokeWidth="1.4" />
      <path d="M9.5 9.5L12 12" stroke="#a09a94" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
