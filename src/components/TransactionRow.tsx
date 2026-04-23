'use client'

import { useState, useEffect } from 'react'
import type { Transaction, ChartOfAccounts } from '@/types'
import { saveCorrection } from '@/lib/corrections'
import { getAlternativeSuggestions } from '@/lib/categorySuggestions'
import type { AuditCallback, AuditEvent } from '@/lib/auditTrail'
import { formatAuditEvent, fmtAuditTs } from '@/lib/auditTrail'

// ─── Cell styles ─────────────────────────────────────────────────────────────

const TD: React.CSSProperties = {
  padding: '10px 8px',
  verticalAlign: 'middle',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid #f0ece4',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Transaction['status'] }) {
  const map: Record<Transaction['status'], { bg: string; text: string; dot: string; label: string }> = {
    approved: { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Approved' },
    pending:  { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04', label: 'Pending'  },
    flagged:  { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444', label: 'Flagged'  },
    edited:   { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', label: 'Edited'   },
  }
  const s = map[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 500,
      backgroundColor: s.bg, color: s.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.85 ? '#059669' : value >= 0.7 ? '#d97706' : '#ef4444'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontSize: 12, color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      {pct}%
    </span>
  )
}

function ActionBtn({
  title, active, activeColor, activeBg, activeBorder, onClick, children,
}: {
  title: string; active: boolean; activeColor: string; activeBg: string
  activeBorder: string; onClick: (e: React.MouseEvent) => void; children: React.ReactNode
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: '1px solid',
        cursor: 'pointer', transition: 'all 0.1s',
        color:            active ? activeColor : hov ? '#6b6560' : '#c4bdb8',
        backgroundColor:  active ? activeBg    : hov ? '#f5f0ea' : '#faf8f4',
        borderColor:      active ? activeBorder : hov ? '#c4bdb8' : '#e8e0d4',
      }}
    >
      {children}
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  transaction: Transaction
  chartOfAccounts: ChartOfAccounts[]
  selected: boolean
  onToggleSelect: (id: string) => void
  onChange: (updated: Transaction) => void
  isRecurring?: boolean
  isFocused?: boolean
  onFocus?: () => void
  enterTrigger?: number
  onAudit?: AuditCallback
  txAuditEvents?: AuditEvent[]
  onCategoryRuleCandidate?: (tx: Transaction, accountCode: string, categoryName: string) => void
  onSplit?: (id: string) => void
}

// ─── TransactionRow ───────────────────────────────────────────────────────────

export default function TransactionRow({
  transaction,
  chartOfAccounts,
  selected,
  onToggleSelect,
  onChange,
  isRecurring   = false,
  isFocused     = false,
  onFocus,
  enterTrigger  = 0,
  onAudit,
  txAuditEvents = [],
  onCategoryRuleCandidate,
  onSplit,
}: Props) {
  const [expanded, setExpanded]       = useState(false)
  const [editCode, setEditCode]       = useState(transaction.final_account_code ?? transaction.suggested_account_code ?? '')
  const [notes, setNotes]             = useState(transaction.notes ?? '')
  const [rowHov, setRowHov]           = useState(false)

  useEffect(() => {
    if (enterTrigger > 0) setExpanded(v => !v)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterTrigger])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleApprove() {
    onAudit?.({ action: 'tx_approved', txId: transaction.id, txDescription: transaction.description, details: { category: transaction.final_category ?? transaction.suggested_category ?? '' } })
    onChange({ ...transaction, status: 'approved', final_category: transaction.suggested_category, final_account_code: transaction.suggested_account_code, notes: notes || undefined })
    setExpanded(false)
  }

  function handleFlag() {
    onAudit?.({ action: 'tx_flagged', txId: transaction.id, txDescription: transaction.description, details: { reason: notes || '' } })
    onChange({ ...transaction, status: 'flagged', notes: notes || undefined })
    setExpanded(false)
  }

  function handleCategoryChange(code: string) {
    const account  = chartOfAccounts.find(a => a.code === code)
    const prevCode = transaction.final_account_code ?? transaction.suggested_account_code
    setEditCode(code)
    if (code !== prevCode) {
      const fromName = transaction.final_category ?? transaction.suggested_category ?? '—'
      const toName   = account?.name ?? code
      onAudit?.({ action: 'tx_category_changed', txId: transaction.id, txDescription: transaction.description, details: { from: fromName, to: toName } })
      if (code !== transaction.suggested_account_code && transaction.suggested_category) {
        saveCorrection(transaction.description, transaction.suggested_category, toName)
      }
      onCategoryRuleCandidate?.(transaction, code, toName)
    }
    onChange({ ...transaction, status: 'edited', final_account_code: code, final_category: account?.name ?? code })
  }

  function handleNotesBlur() {
    if (notes !== (transaction.notes ?? '')) {
      if (notes) onAudit?.({ action: 'tx_note_added', txId: transaction.id, txDescription: transaction.description, details: { note: notes } })
      onChange({ ...transaction, notes: notes || undefined })
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const displayCategory = transaction.final_category ?? transaction.suggested_category
  const displayCode     = transaction.final_account_code ?? transaction.suggested_account_code
  const isCredit        = transaction.type === 'credit'
  const amtFormatted    = transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const suggestions = expanded && (transaction.status === 'flagged' || transaction.confidence < 0.7)
    ? getAlternativeSuggestions(transaction, chartOfAccounts)
    : []

  const rowBg = selected ? '#fdf2e9' : isFocused ? '#f0f4ff' : expanded ? '#fafaf8' : rowHov ? '#faf8f4' : '#ffffff'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Main row ─────────────────────────────────────────────────────── */}
      <tr
        data-row-id={transaction.id}
        onClick={() => { setExpanded(v => !v); onFocus?.() }}
        onMouseEnter={() => { setRowHov(true); onFocus?.() }}
        onMouseLeave={() => setRowHov(false)}
        style={{
          backgroundColor: rowBg,
          cursor: 'pointer',
          transition: 'background-color 0.08s',
          outline: isFocused ? '2px solid #3b5bdb' : 'none',
          outlineOffset: -2,
        }}
      >
        {/* Checkbox */}
        <td style={{ ...TD, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(transaction.id)}
            style={{ accentColor: '#2d5a27', cursor: 'pointer' }}
          />
        </td>

        {/* Date */}
        <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12, color: '#6b6560' }}>
          {transaction.date}
        </td>

        {/* Description */}
        <td
          style={{
            ...TD,
            whiteSpace: 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'table-cell',       // needed to re-apply table-cell after td override
          }}
          title={transaction.description}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, minWidth: 0 }}>
            {isRecurring && (
              <span title="Recurring" style={{ flexShrink: 0, marginTop: 1 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 6A4.5 4.5 0 0 1 9 2.5L10.5 4M10.5 6A4.5 4.5 0 0 1 3 9.5L1.5 8" stroke="#b8734a" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M10.5 1.5v2.5H8M1.5 10.5V8H4" stroke="#b8734a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            <span style={{
              fontSize: 13, color: '#1a1714',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', wordBreak: 'break-word',
            }}>
              {transaction.description}
            </span>
            {transaction.splits && transaction.splits.length > 0 && (
              <span title={`Split into ${transaction.splits.length} lines`}
                style={{ flexShrink: 0, marginLeft: 4, fontSize: 10, fontWeight: 600, color: '#1a1714', backgroundColor: '#e8f0e6', border: '1px solid #c4dec0', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.02em' }}>
                Split {transaction.splits.length}
              </span>
            )}
          </div>
        </td>

        {/* Category */}
        <td style={{ ...TD }}>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, color: '#1a1714', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayCategory || <span style={{ color: '#a09a94' }}>—</span>}
            </div>
            {displayCode && (
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#a09a94', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayCode}
              </div>
            )}
          </div>
        </td>

        {/* Confidence */}
        <td style={{ ...TD, textAlign: 'right' }}>
          {transaction.confidence > 0
            ? <ConfidencePill value={transaction.confidence} />
            : <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#a09a94' }}>—</span>}
        </td>

        {/* Amount */}
        <td style={{ ...TD, textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: isCredit ? '#166534' : '#991b1b' }}>
          {isCredit ? '+' : '−'}${amtFormatted}
        </td>

        {/* Status */}
        <td style={{ ...TD, textAlign: 'center' }}>
          <StatusPill status={transaction.status} />
        </td>

        {/* Actions */}
        <td style={{ ...TD, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <ActionBtn title="Approve" active={transaction.status === 'approved' || transaction.status === 'edited'}
              activeColor="#166534" activeBg="#dcfce7" activeBorder="#16a34a" onClick={handleApprove}>
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
            <ActionBtn title="Flag for review" active={transaction.status === 'flagged'}
              activeColor="#991b1b" activeBg="#fee2e2" activeBorder="#dc2626" onClick={handleFlag}>
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                <path d="M3 2v9M3 2h7l-2 3 2 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
            <div style={{ position: 'relative' }}>
              <ActionBtn title={txAuditEvents.length > 0 ? `${txAuditEvents.length} audit event${txAuditEvents.length !== 1 ? 's' : ''}` : 'No history'}
                active={txAuditEvents.length > 0} activeColor="#d97706" activeBg="#fffbeb" activeBorder="#d97706"
                onClick={(e) => { e.stopPropagation(); setExpanded(true) }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </ActionBtn>
              {txAuditEvents.length > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3, width: 12, height: 12,
                  borderRadius: '50%', backgroundColor: '#d97706', color: '#fff',
                  fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', lineHeight: 1,
                }}>
                  {txAuditEvents.length > 9 ? '9+' : txAuditEvents.length}
                </span>
              )}
            </div>
            <ActionBtn title={expanded ? 'Collapse' : 'Expand'} active={expanded}
              activeColor="#2d5a27" activeBg="#e8f0e6" activeBorder="#2d5a27"
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
          </div>
        </td>
      </tr>

      {/* ── Expanded detail row ───────────────────────────────────────────── */}
      {expanded && (
        <tr style={{ backgroundColor: '#faf8f4' }}>
          <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid #e8e0d4' }}>
            <div style={{ padding: '16px 20px' }}>

              {/* Suggestions (flagged / low-confidence) */}
              {suggestions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#6b6560', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Suggested categories
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <button
                      onClick={() => handleCategoryChange(transaction.suggested_account_code)}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1px solid ${editCode === transaction.suggested_account_code ? '#2d5a27' : '#d4e8d0'}`,
                        backgroundColor: editCode === transaction.suggested_account_code ? '#e8f0e6' : '#f0f9ee',
                        color: '#2d5a27',
                      }}
                    >
                      {transaction.suggested_category || '(uncategorized)'}
                      <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11, backgroundColor: '#d4e8d0', padding: '1px 4px', borderRadius: 4, color: '#1e5c1a' }}>
                        {Math.round(transaction.confidence * 100)}%
                      </span>
                    </button>
                    {suggestions.map(s => (
                      <button key={s.accountCode}
                        onClick={() => handleCategoryChange(s.accountCode)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: `1px solid ${editCode === s.accountCode ? '#b8734a' : '#e8ddd2'}`,
                          backgroundColor: editCode === s.accountCode ? '#fdf2e9' : '#faf6f2',
                          color: '#6b4c32',
                        }}
                      >
                        {s.category}
                        <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11, backgroundColor: '#f0e4d6', padding: '1px 4px', borderRadius: 4, color: '#7a4e2a' }}>
                          {s.pct}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3-col grid: Category / Notes / Reasoning */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

                {/* Category selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b6560', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Category
                  </label>
                  <select
                    value={editCode}
                    onChange={e => handleCategoryChange(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', border: '1px solid #e0dbd4', borderRadius: 8, padding: '6px 8px', fontSize: 13, color: '#1a1714', backgroundColor: '#fff', outline: 'none' }}
                  >
                    <option value="">— unassigned —</option>
                    {(['asset', 'liability', 'equity', 'revenue', 'expense'] as const).map(type => {
                      const group = chartOfAccounts.filter(a => a.type === type)
                      if (group.length === 0) return null
                      return (
                        <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                          {group.map(a => (
                            <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b6560', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    onClick={e => e.stopPropagation()}
                    placeholder="Add a note…"
                    style={{ width: '100%', border: '1px solid #e0dbd4', borderRadius: 8, padding: '6px 8px', fontSize: 13, color: '#1a1714', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* AI reasoning */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#6b6560', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AI Reasoning
                  </label>
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: '#6b6560', lineHeight: 1.4 }}>
                    {(transaction as Transaction & { reasoning?: string }).reasoning ?? 'No reasoning provided.'}
                  </p>
                </div>
              </div>

              {/* Approve / Flag buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e8e0d4' }}>
                <button
                  onClick={handleApprove}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 6l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Approve
                </button>
                <button
                  onClick={handleFlag}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid #dc2626', backgroundColor: '#fff', color: '#991b1b', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff' }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M3 1.5v9M3 1.5h6l-1.5 3 1.5 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Flag for review
                </button>
                {onSplit && (
                  <button
                    onClick={() => onSplit(transaction.id)}
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #e0dbd4', backgroundColor: '#fff', color: '#1a1714', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff' }}
                    title="Split into multiple categories (S)"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v4m0 0L3 8m3-3l3 3M2 11h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Split
                  </button>
                )}
              </div>

              {/* Audit timeline */}
              {txAuditEvents.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e0dbd4' }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: '#6b6560', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Audit history
                  </p>
                  <ol style={{ paddingLeft: 16, borderLeft: '1px solid #e0dbd4', margin: 0, listStyle: 'none' }}>
                    {[...txAuditEvents].reverse().map(ev => {
                      const dotColor = ev.action === 'tx_approved' ? '#059669' : ev.action === 'tx_flagged' ? '#ef4444' : ev.action === 'tx_category_changed' ? '#3b82f6' : '#a09a94'
                      return (
                        <li key={ev.id} style={{ position: 'relative', marginBottom: 8 }}>
                          <span style={{ position: 'absolute', left: -20, top: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, border: '2px solid #fff' }} />
                          <p style={{ fontSize: 12, color: '#1a1714', margin: 0 }}>{formatAuditEvent(ev)}</p>
                          <p style={{ fontSize: 11, color: '#a09a94', margin: '1px 0 0' }}>{ev.actor} · {fmtAuditTs(ev.timestamp)}</p>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}

            </div>
          </td>
        </tr>
      )}
    </>
  )
}
