'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import TransactionRow from './TransactionRow'
import type { Transaction, ChartOfAccounts } from '@/types'
import type { AuditCallback, AuditEvent } from '@/lib/auditTrail'

type FilterTab = 'all' | 'pending' | 'approved' | 'flagged'

interface Props {
  initialTransactions: Transaction[]
  chartOfAccounts: ChartOfAccounts[]
  onTransactionsChange?: (transactions: Transaction[]) => void
  recurringIds?: Set<string>
  onAudit?: AuditCallback
  auditEvents?: AuditEvent[]
  highlightIds?: Set<string>
  /** For server-side learning rules */
  clientName?: string
  jobId?: string
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function MobileCard({
  transaction, selected, onToggleSelect, onChange, chartOfAccounts, onAudit,
}: {
  transaction: Transaction; selected: boolean; onToggleSelect: (id: string) => void
  onChange: (t: Transaction) => void; chartOfAccounts: ChartOfAccounts[]; onAudit?: AuditCallback
}) {
  const [expanded, setExpanded] = useState(false)
  const isCredit = transaction.type === 'credit'
  const amt = transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const statusColors: Record<Transaction['status'], [string, string]> = {
    approved: ['#065f46', '#ecfdf5'], pending: ['#854d0e', '#fef9c3'],
    flagged: ['#991b1b', '#fef2f2'], edited: ['#1d4ed8', '#eff6ff'],
  }
  const [tc, bg] = statusColors[transaction.status]
  function approve() {
    onAudit?.({ action: 'tx_approved', txId: transaction.id, txDescription: transaction.description, details: { category: transaction.suggested_category ?? '' } })
    onChange({ ...transaction, status: 'approved', final_category: transaction.suggested_category, final_account_code: transaction.suggested_account_code })
    setExpanded(false)
  }
  function flag() {
    onAudit?.({ action: 'tx_flagged', txId: transaction.id, txDescription: transaction.description, details: { reason: '' } })
    onChange({ ...transaction, status: 'flagged' })
    setExpanded(false)
  }
  return (
    <div style={{ border: `1px solid ${selected ? '#b8734a' : '#e0dbd4'}`, borderRadius: 10, backgroundColor: selected ? '#fdf2e9' : '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 10, padding: '10px 12px', cursor: 'pointer', alignItems: 'flex-start' }} onClick={() => setExpanded(v => !v)}>
        <div onClick={e => { e.stopPropagation(); onToggleSelect(transaction.id) }} style={{ paddingTop: 2 }}>
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(transaction.id)} style={{ accentColor: '#2d5a27' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6560' }}>{transaction.date}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: isCredit ? '#166534' : '#991b1b', flexShrink: 0 }}>
              {isCredit ? '+' : '−'}${amt}
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1714', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={transaction.description}>
            {transaction.description}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 7px', borderRadius: 999, color: tc, backgroundColor: bg }}>{transaction.status}</span>
            {transaction.suggested_category && <span style={{ fontSize: 11, color: '#6b6560', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{transaction.suggested_category}</span>}
          </div>
        </div>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0, marginTop: 4 }}>
          <path d="M2 4l4 4 4-4" stroke="#6b6560" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {expanded && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #f0ebe3', display: 'flex', gap: 6 }}>
          <button onClick={approve} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Approve</button>
          <button onClick={flag} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid #dc2626', backgroundColor: '#fff', color: '#991b1b', fontSize: 12, cursor: 'pointer' }}>Flag</button>
          <select value={transaction.final_account_code ?? transaction.suggested_account_code ?? ''}
            onChange={e => { const a = chartOfAccounts.find(x => x.code === e.target.value); onChange({ ...transaction, status: 'edited', final_account_code: e.target.value, final_category: a?.name ?? e.target.value }) }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, border: '1px solid #e0dbd4', borderRadius: 8, padding: '6px 4px', fontSize: 11, color: '#1a1714' }}>
            <option value="">Category…</option>
            {chartOfAccounts.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({ count, remaining, onConfirm, onCancel }: { count: number; remaining: number; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onCancel])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' }} onClick={onCancel}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e0dbd4', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 24, maxWidth: 360, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#2d5a27" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', margin: 0 }}>Approve high-confidence transactions?</p>
            <p style={{ fontSize: 13, color: '#6b6560', marginTop: 4 }}>
              Approves <strong style={{ color: '#2d5a27' }}>{count}</strong> transaction{count !== 1 ? 's' : ''} with confidence ≥ 85%
              {remaining > 0 ? `, leaving ${remaining} for manual review.` : '. All pending transactions will be approved.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#6b6560', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Approve {count}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Shortcuts popover ────────────────────────────────────────────────────────

const SHORTCUTS = [
  { key: 'a', desc: 'Approve selected' }, { key: 'f', desc: 'Flag selected' },
  { key: 'j', desc: 'Move down' }, { key: 'k', desc: 'Move up' },
  { key: '↵', desc: 'Expand / collapse' }, { key: '⎵', desc: 'Toggle checkbox' },
]

function ShortcutsPopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="Keyboard shortcuts"
        style={{ width: 26, height: 26, borderRadius: '50%', border: `1px solid ${open ? '#2d5a27' : '#e0dbd4'}`, backgroundColor: open ? '#e8f0e6' : 'transparent', color: open ? '#2d5a27' : '#6b6560', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ?
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 30, backgroundColor: '#fff', border: '1px solid #e0dbd4', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: 12, width: 200 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b6560', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keyboard shortcuts</p>
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b6560' }}>{desc}</span>
              <kbd style={{ padding: '1px 6px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f5f0ea', color: '#1a1714', border: '1px solid #e0dbd4' }}>{key}</kbd>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TransactionTable ─────────────────────────────────────────────────────────

export default function TransactionTable({
  initialTransactions, chartOfAccounts, onTransactionsChange,
  recurringIds, onAudit, auditEvents = [], highlightIds,
  clientName, jobId,
}: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [activeTab, setActiveTab]       = useState<FilterTab>('all')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm]   = useState(false)
  const [approveResult, setApproveResult] = useState<{ approved: number; remaining: number } | null>(null)
  const [focusedId, setFocusedId]       = useState<string | null>(null)
  const [enterTrigger, setEnterTrigger] = useState(0)

  const visible = useMemo(() => {
    let list = transactions
    if (activeTab === 'pending')  list = list.filter(t => t.status === 'pending')
    if (activeTab === 'approved') list = list.filter(t => t.status === 'approved' || t.status === 'edited')
    if (activeTab === 'flagged')  list = list.filter(t => t.status === 'flagged')
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(t => t.description.toLowerCase().includes(q) || (t.suggested_category ?? '').toLowerCase().includes(q) || (t.final_category ?? '').toLowerCase().includes(q))
    }
    return list
  }, [transactions, activeTab, search])

  const counts = useMemo(() => ({
    all:      transactions.length,
    pending:  transactions.filter(t => t.status === 'pending').length,
    approved: transactions.filter(t => t.status === 'approved' || t.status === 'edited').length,
    flagged:  transactions.filter(t => t.status === 'flagged').length,
  }), [transactions])

  const focusedIndex    = useMemo(() => visible.findIndex(t => t.id === focusedId), [visible, focusedId])
  const highConfPending = transactions.filter(t => t.confidence >= 0.85 && t.status === 'pending').length
  const lowConfPending  = transactions.filter(t => t.status === 'pending' && t.confidence < 0.85).length

  const handleChange = useCallback((updated: Transaction) => {
    setTransactions(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t)
      onTransactionsChange?.(next)
      return next
    })
  }, [onTransactionsChange])

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleSelectAll() {
    setSelected(selected.size === visible.length && visible.length > 0 ? new Set() : new Set(visible.map(t => t.id)))
  }

  const bulkApprove = useCallback(() => {
    setTransactions(prev => {
      const next = prev.map(t => {
        if (!selected.has(t.id)) return t
        onAudit?.({ action: 'tx_approved', txId: t.id, txDescription: t.description, details: { category: t.final_category ?? t.suggested_category ?? '', bulk: 'true' } })
        return { ...t, status: 'approved' as const, final_category: t.final_category ?? t.suggested_category, final_account_code: t.final_account_code ?? t.suggested_account_code }
      })
      onTransactionsChange?.(next)
      return next
    })
    setSelected(new Set())
  }, [selected, onTransactionsChange, onAudit])

  const bulkFlag = useCallback(() => {
    setTransactions(prev => {
      const next = prev.map(t => {
        if (!selected.has(t.id)) return t
        onAudit?.({ action: 'tx_flagged', txId: t.id, txDescription: t.description, details: { reason: '', bulk: 'true' } })
        return { ...t, status: 'flagged' as const }
      })
      onTransactionsChange?.(next)
      return next
    })
    setSelected(new Set())
  }, [selected, onTransactionsChange, onAudit])

  function doApproveHighConfidence() {
    setShowConfirm(false)
    setTransactions(prev => {
      const next = prev.map(t => {
        if (!(t.confidence >= 0.85 && t.status === 'pending')) return t
        onAudit?.({ action: 'tx_approved', txId: t.id, txDescription: t.description, details: { category: t.suggested_category ?? '', bulk: 'true' } })
        return { ...t, status: 'approved' as const, final_category: t.suggested_category, final_account_code: t.suggested_account_code }
      })
      onTransactionsChange?.(next)
      return next
    })
    setApproveResult({ approved: highConfPending, remaining: lowConfPending })
    setTimeout(() => setApproveResult(null), 6000)
  }

  // Keyboard navigation
  const bulkApproveRef  = useRef(bulkApprove)
  const bulkFlagRef     = useRef(bulkFlag)
  const selectedRef     = useRef(selected)
  const visibleRef      = useRef(visible)
  const focusedIdxRef   = useRef(focusedIndex)
  bulkApproveRef.current = bulkApprove
  bulkFlagRef.current    = bulkFlag
  selectedRef.current    = selected
  visibleRef.current     = visible
  focusedIdxRef.current  = focusedIndex

  useEffect(() => {
    function h(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const vis = visibleRef.current
      const fi  = focusedIdxRef.current
      if (e.key === 'j') { e.preventDefault(); const n = fi < vis.length - 1 ? fi + 1 : 0; setFocusedId(vis[n]?.id ?? null); setTimeout(() => { document.querySelector(`[data-row-id="${vis[n]?.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, 0); return }
      if (e.key === 'k') { e.preventDefault(); const p = fi > 0 ? fi - 1 : vis.length - 1; setFocusedId(vis[p]?.id ?? null); setTimeout(() => { document.querySelector(`[data-row-id="${vis[p]?.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, 0); return }
      if (e.key === 'Enter' && focusedIdxRef.current >= 0) { e.preventDefault(); setEnterTrigger(n => n + 1); return }
      if (e.key === 'a' && selectedRef.current.size > 0) { e.preventDefault(); bulkApproveRef.current() }
      if (e.key === 'f' && selectedRef.current.size > 0) { e.preventDefault(); bulkFlagRef.current() }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const allSelected = visible.length > 0 && selected.size === visible.length
  const someSelected = selected.size > 0

  // ─── Table column definitions ─────────────────────────────────────────────
  // Widths must add up to 100%.
  const COLS = [
    { pct: '4%'  },   // checkbox
    { pct: '9%'  },   // date
    { pct: '32%' },   // description
    { pct: '13%' },   // category
    { pct: '8%'  },   // confidence
    { pct: '13%' },   // amount
    { pct: '9%'  },   // status
    { pct: '12%' },   // actions
  ]

  const TH: React.CSSProperties = {
    padding: '10px 8px',
    fontSize: 11,
    fontWeight: 500,
    color: '#6b6560',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    borderBottom: '1px solid #e0dbd4',
    backgroundColor: '#f5f0ea',
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>

      {/* Approve result banner */}
      {approveResult && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: 10, borderRadius: 10, border: '1px solid #059669', backgroundColor: '#ecfdf5', color: '#065f46', fontSize: 13 }}>
          <span><strong>✓ {approveResult.approved} approved.</strong>{approveResult.remaining > 0 ? ` ${approveResult.remaining} transaction${approveResult.remaining !== 1 ? 's' : ''} remaining.` : ' All transactions approved.'}</span>
          <button onClick={() => setApproveResult(null)} style={{ background: 'none', border: 'none', fontSize: 18, lineHeight: 1, opacity: 0.5, cursor: 'pointer', color: '#065f46' }}>×</button>
        </div>
      )}

      {/* Controls: tabs + search + bulk */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e0dbd4', flexWrap: 'wrap', paddingBottom: 0 }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {(['all', 'pending', 'approved', 'flagged'] as FilterTab[]).map(tab => {
            const labels: Record<FilterTab, string> = { all: 'All', pending: 'Pending', approved: 'Approved', flagged: 'Flagged' }
            const active = activeTab === tab
            return (
              <button key={tab}
                onClick={() => { setActiveTab(tab); setSelected(new Set()) }}
                style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500, border: 'none', borderBottom: `2px solid ${active ? '#2d5a27' : 'transparent'}`, marginBottom: -1, backgroundColor: 'transparent', color: active ? '#2d5a27' : '#6b6560', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {labels[tab]}
                <span style={{ marginLeft: 5, fontSize: 11, fontFamily: 'monospace', padding: '1px 5px', borderRadius: 999, backgroundColor: active ? '#d4e8d0' : '#f5f0ea', color: active ? '#2d5a27' : '#a09a94' }}>
                  {counts[tab]}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Approve high-confidence */}
        {highConfPending > 0 && (
          <button onClick={() => setShowConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}>
            <svg width="10" height="10" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Approve {highConfPending} high-confidence
          </button>
        )}

        {/* Bulk actions */}
        {someSelected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 8, border: '1px solid #e0dbd4', backgroundColor: '#f5f0ea', fontSize: 12, flexShrink: 0 }}>
            <span style={{ color: '#6b6560' }}>{selected.size} selected</span>
            <span style={{ color: '#e0dbd4' }}>|</span>
            <button onClick={bulkApprove} style={{ fontWeight: 600, color: '#166534', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}>Approve</button>
            <button onClick={bulkFlag}    style={{ fontWeight: 600, color: '#991b1b', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}>Flag</button>
            <button onClick={() => setSelected(new Set())} style={{ color: '#a09a94', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0, paddingBottom: 2 }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="#a09a94" strokeWidth="1.4"/>
            <path d="M9.5 9.5L12 12" stroke="#a09a94" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6, width: 180, borderRadius: 8, border: '1px solid #e0dbd4', backgroundColor: '#faf8f4', fontSize: 13, color: '#1a1714', outline: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#2d5a27' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e0dbd4' }}
          />
        </div>

        {/* Shortcuts */}
        <div style={{ paddingBottom: 2, flexShrink: 0 }}><ShortcutsPopover /></div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0
          ? <p style={{ textAlign: 'center', padding: '40px 0', color: '#a09a94', fontSize: 13 }}>{search ? 'No transactions match your search.' : 'No transactions in this category.'}</p>
          : visible.map(tx => (
            <MobileCard key={tx.id} transaction={tx} selected={selected.has(tx.id)} onToggleSelect={toggleSelect} onChange={handleChange} chartOfAccounts={chartOfAccounts} onAudit={onAudit} />
          ))
        }
      </div>

      {/* Desktop table */}
      <div className="hidden md:block" style={{ marginTop: 10, borderRadius: 10, border: '1px solid #e0dbd4', overflow: 'hidden' }}>
        {visible.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#a09a94', fontSize: 13 }}>{search ? 'No transactions match your search.' : 'No transactions in this category.'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              {COLS.map((c, i) => <col key={i} style={{ width: c.pct }} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'center' }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ accentColor: '#2d5a27', cursor: 'pointer' }} title={allSelected ? 'Deselect all' : 'Select all'} />
                </th>
                <th style={TH}>Date</th>
                <th style={TH}>Description</th>
                <th style={TH}>Category</th>
                <th style={{ ...TH, textAlign: 'right' }}>Conf.</th>
                <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
                <th style={{ ...TH, textAlign: 'center' }}>Status</th>
                <th style={{ ...TH, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(tx => (
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
                  txAuditEvents={auditEvents.filter(e => e.txId === tx.id)}
                  clientName={clientName}
                  jobId={jobId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {visible.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <p style={{ fontSize: 11, color: '#c4bdb8' }}>
            <kbd style={{ padding: '1px 5px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e0dbd4' }}>j</kbd>
            {' / '}
            <kbd style={{ padding: '1px 5px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e0dbd4' }}>k</kbd>
            {' navigate · '}
            <kbd style={{ padding: '1px 5px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e0dbd4' }}>A</kbd>
            {' approve · '}
            <kbd style={{ padding: '1px 5px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', backgroundColor: '#f0ece4', color: '#6b6560', border: '1px solid #e0dbd4' }}>F</kbd>
            {' flag'}
          </p>
          <p style={{ fontSize: 12, color: '#a09a94' }}>Showing {visible.length} of {transactions.length}</p>
        </div>
      )}

      {showConfirm && (
        <ConfirmModal count={highConfPending} remaining={lowConfPending} onConfirm={doApproveHighConfidence} onCancel={() => setShowConfirm(false)} />
      )}
    </div>
  )
}
