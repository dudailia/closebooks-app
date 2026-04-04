'use client'

import { useState, useEffect } from 'react'
import type { Transaction, ChartOfAccounts } from '@/types'
import { saveCorrection } from '@/lib/corrections'
import { getAlternativeSuggestions } from '@/lib/categorySuggestions'
import type { AuditCallback, AuditEvent } from '@/lib/auditTrail'
import { formatAuditEvent, fmtAuditTs } from '@/lib/auditTrail'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const styles: Record<Transaction['status'], { bg: string; text: string; dot: string; label: string }> = {
    approved: { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Approved' },
    pending:  { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04', label: 'Pending'  },
    flagged:  { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444', label: 'Flagged'  },
    edited:   { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', label: 'Edited'   },
  }
  const s = styles[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const pct        = Math.round(value * 100)
  const color      = value >= 0.85 ? '#059669' : value >= 0.7 ? '#d97706' : '#ef4444'
  const trackColor = value >= 0.85 ? '#d1fae5' : value >= 0.7 ? '#fef3c7' : '#fee2e2'
  const label      = value >= 0.85 ? 'High'    : value >= 0.7 ? 'Med'     : 'Low'
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {pct}%
        </span>
        <span className="text-xs" style={{ color: '#c4bdb8', fontSize: 10 }}>{label}</span>
      </div>
      <div
        className="w-14 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: trackColor }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props / types
// ---------------------------------------------------------------------------

interface Props {
  transaction: Transaction
  chartOfAccounts: ChartOfAccounts[]
  selected: boolean
  onToggleSelect: (id: string) => void
  onChange: (updated: Transaction) => void
  isRecurring?: boolean
  isFocused?: boolean
  onFocus?: () => void
  /** Incremented by parent to trigger expand/collapse toggle on focused row */
  enterTrigger?: number
  onAudit?: AuditCallback
  txAuditEvents?: AuditEvent[]
}

// ---------------------------------------------------------------------------
// TransactionRow
// ---------------------------------------------------------------------------

export default function TransactionRow({
  transaction,
  chartOfAccounts,
  selected,
  onToggleSelect,
  onChange,
  isRecurring    = false,
  isFocused      = false,
  onFocus,
  enterTrigger   = 0,
  onAudit,
  txAuditEvents  = [],
}: Props) {
  const [expanded, setExpanded]   = useState(false)
  const [, setEditCategory]       = useState(
    transaction.final_category ?? transaction.suggested_category
  )
  const [editAccountCode, setEditAccountCode] = useState(
    transaction.final_account_code ?? transaction.suggested_account_code
  )
  const [notes, setNotes]         = useState(transaction.notes ?? '')
  const [hovered, setHovered]     = useState(false)

  // Toggle expand when parent fires Enter for this row
  useEffect(() => {
    if (enterTrigger > 0) setExpanded((v) => !v)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterTrigger])

  function handleApprove() {
    onAudit?.({
      action: 'tx_approved',
      txId: transaction.id,
      txDescription: transaction.description,
      details: { category: transaction.final_category ?? transaction.suggested_category ?? '' },
    })
    onChange({
      ...transaction,
      status: 'approved',
      final_category: transaction.suggested_category,
      final_account_code: transaction.suggested_account_code,
      notes: notes || undefined,
    })
    setExpanded(false)
  }

  function handleFlag() {
    onAudit?.({
      action: 'tx_flagged',
      txId: transaction.id,
      txDescription: transaction.description,
      details: { reason: notes || '' },
    })
    onChange({ ...transaction, status: 'flagged', notes: notes || undefined })
    setExpanded(false)
  }

  function handleCategoryChange(code: string) {
    const account   = chartOfAccounts.find((a) => a.code === code)
    const prevCode  = transaction.final_account_code ?? transaction.suggested_account_code
    setEditAccountCode(code)
    setEditCategory(account?.name ?? code)

    if (code !== prevCode) {
      const fromName = transaction.final_category ?? transaction.suggested_category ?? '—'
      const toName   = account?.name ?? code
      onAudit?.({
        action: 'tx_category_changed',
        txId: transaction.id,
        txDescription: transaction.description,
        details: { from: fromName, to: toName },
      })
      if (code !== transaction.suggested_account_code && transaction.suggested_category) {
        saveCorrection(transaction.description, transaction.suggested_category, toName)
      }
    }

    onChange({
      ...transaction,
      status: 'edited',
      final_account_code: code,
      final_category: account?.name ?? code,
    })
  }

  function handleNotesBlur() {
    if (notes !== (transaction.notes ?? '')) {
      if (notes) {
        onAudit?.({
          action: 'tx_note_added',
          txId: transaction.id,
          txDescription: transaction.description,
          details: { note: notes },
        })
      }
      onChange({ ...transaction, notes: notes || undefined })
    }
  }

  const displayCategory = transaction.final_category ?? transaction.suggested_category
  const displayCode     = transaction.final_account_code ?? transaction.suggested_account_code

  // Show suggestions when flagged or low-confidence and expanded
  const showSuggestions = expanded && (transaction.status === 'flagged' || transaction.confidence < 0.7)
  const suggestions = showSuggestions
    ? getAlternativeSuggestions(transaction, chartOfAccounts)
    : []

  const rowBg = selected
    ? '#fdf2e9'
    : isFocused
    ? '#f0f4ff'
    : expanded
    ? '#faf8f4'
    : hovered
    ? '#faf8f4'
    : '#ffffff'

  const focusBorder = isFocused ? '2px solid #3b5bdb' : 'none'

  return (
    <>
      {/* Main row */}
      <tr
        data-row-id={transaction.id}
        style={{
          backgroundColor: rowBg,
          borderTop: '1px solid #f0ece4',
          borderLeft: focusBorder,
          cursor: 'pointer',
          transition: 'background-color 0.1s',
        }}
        onMouseEnter={() => { setHovered(true); onFocus?.() }}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { setExpanded((v) => !v); onFocus?.() }}
      >
        {/* Checkbox */}
        <td className="pl-3 pr-1 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(transaction.id)}
            className="rounded"
            style={{ accentColor: '#2d5a27' }}
          />
        </td>

        {/* Date */}
        <td
          className="px-3 py-2.5 whitespace-nowrap font-mono text-xs"
          style={{ color: '#6b6560' }}
        >
          {transaction.date}
        </td>

        {/* Description */}
        <td className="px-3 py-2.5 max-w-[220px]">
          <div className="flex items-center gap-1.5 min-w-0">
            {isRecurring && (
              <span title="Recurring transaction">
                <RecurringIcon />
              </span>
            )}
            <span
              className="text-sm block truncate"
              style={{ color: '#1a1714' }}
              title={transaction.description}
            >
              {transaction.description}
            </span>
          </div>
        </td>

        {/* Suggested category */}
        <td className="px-3 py-2.5">
          <div>
            <span className="text-xs block" style={{ color: '#1a1714' }}>
              {displayCategory || <span style={{ color: '#a09a94' }}>—</span>}
            </span>
            {displayCode && (
              <span className="font-mono text-xs" style={{ color: '#a09a94' }}>
                {displayCode}
              </span>
            )}
          </div>
        </td>

        {/* Confidence */}
        <td className="px-3 py-2.5 w-32 hidden sm:table-cell">
          {transaction.confidence > 0
            ? <ConfidenceBar value={transaction.confidence} />
            : <span className="text-xs font-mono" style={{ color: '#a09a94' }}>—</span>
          }
        </td>

        {/* Amount */}
        <td className="px-3 py-2.5 text-right whitespace-nowrap w-28">
          <span
            className="font-mono text-sm"
            style={{ color: transaction.type === 'debit' ? '#991b1b' : '#166534' }}
          >
            {transaction.type === 'debit' ? '−' : '+'}
            {transaction.amount.toFixed(2)}
          </span>
        </td>

        {/* Status */}
        <td className="px-3 py-2.5 w-24">
          <StatusBadge status={transaction.status} />
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5 w-28" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <ActionButton
              label="✓"
              title="Approve"
              onClick={handleApprove}
              active={transaction.status === 'approved'}
              activeStyle={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#16a34a' }}
            />
            <ActionButton
              label="⚑"
              title="Flag"
              onClick={handleFlag}
              active={transaction.status === 'flagged'}
              activeStyle={{ backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#dc2626' }}
            />
            {/* Audit history icon — amber when events exist */}
            <div className="relative">
              <button
                onClick={() => setExpanded(true)}
                title={txAuditEvents.length > 0 ? `${txAuditEvents.length} audit event${txAuditEvents.length !== 1 ? 's' : ''}` : 'No audit history'}
                className="px-1.5 py-1 rounded border text-xs transition-colors"
                style={{
                  borderColor: txAuditEvents.length > 0 ? '#d97706' : '#e0dbd4',
                  color:       txAuditEvents.length > 0 ? '#d97706' : '#c4bdb8',
                  backgroundColor: txAuditEvents.length > 0 ? '#fffbeb' : '#faf8f4',
                }}
              >
                <ClockIcon />
              </button>
              {txAuditEvents.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: '#d97706', fontSize: 8, lineHeight: 1 }}
                >
                  {txAuditEvents.length > 9 ? '9+' : txAuditEvents.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Collapse' : 'Expand'}
              className="px-1.5 py-1 rounded border text-xs transition-colors"
              style={{
                borderColor: expanded ? '#2d5a27' : '#e0dbd4',
                color: expanded ? '#2d5a27' : '#a09a94',
                backgroundColor: expanded ? '#f0ece4' : '#faf8f4',
              }}
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr style={{ backgroundColor: '#f5f0ea', borderTop: '1px solid #e0dbd4', borderLeft: focusBorder }}>
          <td colSpan={8} className="px-6 py-4">

            {/* Smart suggestions — shown for flagged / low-confidence */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2" style={{ color: '#6b6560' }}>
                  Suggested categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {/* Primary suggestion */}
                  <button
                    onClick={() => handleCategoryChange(transaction.suggested_account_code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                    style={{
                      borderColor: editAccountCode === transaction.suggested_account_code ? '#2d5a27' : '#d4e8d0',
                      backgroundColor: editAccountCode === transaction.suggested_account_code ? '#e8f0e6' : '#f0f9ee',
                      color: '#2d5a27',
                    }}
                    title="Primary AI suggestion"
                  >
                    <span>{transaction.suggested_category || '(uncategorized)'}</span>
                    <span
                      className="font-mono px-1 py-0.5 rounded text-xs"
                      style={{ backgroundColor: '#d4e8d0', color: '#1e5c1a' }}
                    >
                      {Math.round(transaction.confidence * 100)}%
                    </span>
                  </button>

                  {/* Alternatives */}
                  {suggestions.map((s) => (
                    <button
                      key={s.accountCode}
                      onClick={() => handleCategoryChange(s.accountCode)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                      style={{
                        borderColor: editAccountCode === s.accountCode ? '#b8734a' : '#e8ddd2',
                        backgroundColor: editAccountCode === s.accountCode ? '#fdf2e9' : '#faf6f2',
                        color: '#6b4c32',
                      }}
                    >
                      <span>{s.category}</span>
                      <span
                        className="font-mono px-1 py-0.5 rounded text-xs"
                        style={{ backgroundColor: '#f0e4d6', color: '#7a4e2a' }}
                      >
                        {s.pct}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Category selector */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b6560' }}>
                  Category
                </label>
                <select
                  value={editAccountCode}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
                  style={{ borderColor: '#e0dbd4', backgroundColor: '#fff', color: '#1a1714' }}
                >
                  <option value="">— unassigned —</option>
                  {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
                    const group = chartOfAccounts.filter((a) => a.type === type)
                    if (group.length === 0) return null
                    return (
                      <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                        {group.map((a) => (
                          <option key={a.code} value={a.code}>
                            [{a.code}] {a.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b6560' }}>
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add a note…"
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a27]"
                  style={{ borderColor: '#e0dbd4', backgroundColor: '#fff', color: '#1a1714' }}
                />
              </div>

              {/* AI reasoning */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b6560' }}>
                  AI Reasoning
                </label>
                <p className="text-sm italic" style={{ color: '#6b6560' }}>
                  {(transaction as Transaction & { reasoning?: string }).reasoning
                    ?? 'No reasoning provided.'}
                </p>
              </div>
            </div>

            {/* Approve / Flag buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApprove}
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                ✓ Approve
              </button>
              <button
                onClick={handleFlag}
                className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: '#dc2626', color: '#991b1b', backgroundColor: '#fff' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
              >
                ⚑ Flag for review
              </button>
            </div>

            {/* Audit history timeline */}
            {txAuditEvents.length > 0 && (
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid #e0dbd4' }}>
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#6b6560' }}>
                  <ClockIcon />
                  Audit history
                </p>
                <ol className="relative space-y-3 pl-4" style={{ borderLeft: '1px solid #e0dbd4' }}>
                  {[...txAuditEvents].reverse().map((ev) => (
                    <li key={ev.id} className="relative">
                      {/* Timeline dot */}
                      <span
                        className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white"
                        style={{ backgroundColor: auditDotColor(ev.action) }}
                      />
                      <p className="text-xs" style={{ color: '#1a1714' }}>
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
          </td>
        </tr>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function auditDotColor(action: AuditEvent['action']): string {
  switch (action) {
    case 'tx_approved':         return '#059669'
    case 'tx_flagged':          return '#ef4444'
    case 'tx_category_changed': return '#3b82f6'
    case 'tx_note_added':       return '#a09a94'
    default:                    return '#a09a94'
  }
}

function RecurringIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M1.5 6A4.5 4.5 0 0 1 9 2.5L10.5 4M10.5 6A4.5 4.5 0 0 1 3 9.5L1.5 8"
        stroke="#b8734a"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M10.5 1.5v2.5H8" stroke="#b8734a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 10.5V8H4" stroke="#b8734a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Tiny helper
// ---------------------------------------------------------------------------

function ActionButton({
  label, title, onClick, active, activeStyle,
}: {
  label: string
  title: string
  onClick: () => void
  active: boolean
  activeStyle: React.CSSProperties
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="px-1.5 py-1 rounded border text-xs transition-colors"
      style={
        active
          ? activeStyle
          : { borderColor: '#e0dbd4', color: '#a09a94', backgroundColor: '#faf8f4' }
      }
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = '#6b6560' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = '#e0dbd4' }}
    >
      {label}
    </button>
  )
}
