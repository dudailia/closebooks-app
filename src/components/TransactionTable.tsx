'use client'

import { useState, useMemo, useCallback } from 'react'
import TransactionRow from './TransactionRow'
import type { Transaction, ChartOfAccounts } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'pending' | 'approved' | 'flagged'

interface Props {
  initialTransactions: Transaction[]
  chartOfAccounts: ChartOfAccounts[]
  onTransactionsChange?: (transactions: Transaction[]) => void
}

// ---------------------------------------------------------------------------
// Summary bar
// ---------------------------------------------------------------------------

function SummaryBar({ transactions }: { transactions: Transaction[] }) {
  const total    = transactions.length
  const pending  = transactions.filter((t) => t.status === 'pending').length
  const flagged  = transactions.filter((t) => t.status === 'flagged').length
  const autoApproved = transactions.filter((t) => t.status === 'approved' && t.confidence >= 0.85).length

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
// TransactionTable
// ---------------------------------------------------------------------------

export default function TransactionTable({ initialTransactions, chartOfAccounts, onTransactionsChange }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [activeTab, setActiveTab]       = useState<FilterTab>('all')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Set<string>>(new Set())

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

  function bulkApprove() {
    setTransactions((prev) => {
      const next = prev.map((t) =>
        selected.has(t.id)
          ? { ...t, status: 'approved' as const, final_category: t.final_category ?? t.suggested_category, final_account_code: t.final_account_code ?? t.suggested_account_code }
          : t
      )
      onTransactionsChange?.(next)
      return next
    })
    setSelected(new Set())
  }

  function bulkFlag() {
    setTransactions((prev) => {
      const next = prev.map((t) => selected.has(t.id) ? { ...t, status: 'flagged' as const } : t)
      onTransactionsChange?.(next)
      return next
    })
    setSelected(new Set())
  }

  function approveHighConfidence() {
    setTransactions((prev) => {
      const next = prev.map((t) =>
        t.confidence >= 0.85 && t.status === 'pending'
          ? { ...t, status: 'approved' as const, final_category: t.suggested_category, final_account_code: t.suggested_account_code }
          : t
      )
      onTransactionsChange?.(next)
      return next
    })
  }

  const allVisibleSelected = visible.length > 0 && selected.size === visible.length
  const someSelected = selected.size > 0
  const highConfidencePending = transactions.filter((t) => t.confidence >= 0.85 && t.status === 'pending').length

  // -------------------------------------------------------------------------

  return (
    <div className="space-y-3 font-sans">

      {/* Summary bar */}
      <SummaryBar transactions={transactions} />

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
            onClick={approveHighConfidence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#16a34a', color: '#166534', backgroundColor: '#f0fdf4' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4' }}
          >
            <span style={{ fontSize: 11 }}>✓✓</span>
            Approve high confidence ({highConfidencePending})
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
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: '#e0dbd4' }}
      >
        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: '#a09a94' }}>
              {search ? 'No transactions match your search.' : 'No transactions in this category.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
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
                  ['Date',       'text-left  w-28'],
                  ['Description','text-left  max-w-[220px]'],
                  ['Category',   'text-left'],
                  ['Confidence', 'text-right w-32'],
                  ['Amount',     'text-right w-28'],
                  ['Status',     'text-left  w-24'],
                  ['Actions',    'text-left  w-24'],
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
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer count */}
      {visible.length > 0 && (
        <p className="text-xs text-right" style={{ color: '#a09a94' }}>
          Showing {visible.length} of {transactions.length} transactions
        </p>
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
