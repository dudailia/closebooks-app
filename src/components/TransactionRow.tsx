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
  borderBottom: '1px solid var(--border-subtle)',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Transaction['status'] }) {
  const map: Record<Transaction['status'], { bg: string; text: string; dot: string; label: string }> = {
    approved: { bg: 'var(--accent-soft)', text: 'var(--accent)', dot: 'var(--accent)', label: 'Approved' },
    pending:  { bg: 'var(--warning-soft)', text: 'var(--warning)', dot: 'var(--warning)', label: 'Pending'  },
    flagged:  { bg: 'var(--danger-soft)', text: 'var(--danger)', dot: 'var(--danger)', label: 'Flagged'  },
    edited:   { bg: 'var(--ring-soft)', text: 'var(--ring-focus)', dot: 'var(--ring-focus)', label: 'Edited'   },
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
  const color = value >= 0.85 ? 'var(--accent)' : value >= 0.7 ? 'var(--warning)' : 'var(--danger)'
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
        color:            active ? activeColor : hov ? 'var(--text-secondary)' : 'var(--border-strong)',
        backgroundColor:  active ? activeBg    : hov ? 'var(--surface-elevated)' : 'var(--surface-base)',
        borderColor:      active ? activeBorder : hov ? 'var(--border-strong)' : 'var(--border-subtle)',
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

  const rowBg = selected ? 'var(--surface-elevated)' : isFocused ? 'var(--ring-soft)' : expanded ? 'var(--surface-elevated)' : rowHov ? 'var(--surface-base)' : 'var(--surface-card)'

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
          outline: isFocused ? '2px solid var(--ring-focus)' : 'none',
          outlineOffset: -2,
        }}
      >
        {/* Checkbox */}
        <td style={{ ...TD, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(transaction.id)}
            style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
        </td>

        {/* Date */}
        <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
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
                  <path d="M1.5 6A4.5 4.5 0 0 1 9 2.5L10.5 4M10.5 6A4.5 4.5 0 0 1 3 9.5L1.5 8" stroke="var(--warning)" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M10.5 1.5v2.5H8M1.5 10.5V8H4" stroke="var(--warning)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
            <span style={{
              fontSize: 13, color: 'var(--text-primary)',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', wordBreak: 'break-word',
            }}>
              {transaction.description}
            </span>
            {transaction.splits && transaction.splits.length > 0 && (
              <span title={`Split into ${transaction.splits.length} lines`}
                style={{ flexShrink: 0, marginLeft: 4, fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-soft)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.02em' }}>
                Split {transaction.splits.length}
              </span>
            )}
          </div>
        </td>

        {/* Category */}
        <td style={{ ...TD }}>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayCategory || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
            </div>
            {displayCode && (
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayCode}
              </div>
            )}
          </div>
        </td>

        {/* Confidence */}
        <td style={{ ...TD, textAlign: 'right' }}>
          {transaction.confidence > 0
            ? <ConfidencePill value={transaction.confidence} />
            : <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>—</span>}
        </td>

        {/* Amount */}
        <td style={{ ...TD, textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: isCredit ? 'var(--accent)' : 'var(--danger)' }}>
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
              activeColor="var(--accent)" activeBg="var(--accent-soft)" activeBorder="var(--accent)" onClick={handleApprove}>
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
            <ActionBtn title="Flag for review" active={transaction.status === 'flagged'}
              activeColor="var(--danger)" activeBg="var(--danger-soft)" activeBorder="var(--danger)" onClick={handleFlag}>
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                <path d="M3 2v9M3 2h7l-2 3 2 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </ActionBtn>
            <div style={{ position: 'relative' }}>
              <ActionBtn title={txAuditEvents.length > 0 ? `${txAuditEvents.length} audit event${txAuditEvents.length !== 1 ? 's' : ''}` : 'No history'}
                active={txAuditEvents.length > 0} activeColor="var(--warning)" activeBg="var(--warning-soft)" activeBorder="var(--warning)"
                onClick={(e) => { e.stopPropagation(); setExpanded(true) }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </ActionBtn>
              {txAuditEvents.length > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3, width: 12, height: 12,
                  borderRadius: '50%', backgroundColor: 'var(--warning)', color: '#fff',
                  fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', lineHeight: 1,
                }}>
                  {txAuditEvents.length > 9 ? '9+' : txAuditEvents.length}
                </span>
              )}
            </div>
            <ActionBtn title={expanded ? 'Collapse' : 'Expand'} active={expanded}
              activeColor="var(--accent)" activeBg="var(--accent-soft)" activeBorder="var(--accent)"
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
        <tr style={{ backgroundColor: 'var(--surface-base)' }}>
          <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ padding: '16px 20px' }}>

              {/* Suggestions (flagged / low-confidence) */}
              {suggestions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Suggested categories
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <button
                      onClick={() => handleCategoryChange(transaction.suggested_account_code)}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: `1px solid ${editCode === transaction.suggested_account_code ? 'var(--accent)' : 'var(--accent-soft)'}`,
                        backgroundColor: editCode === transaction.suggested_account_code ? 'var(--accent-soft)' : 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      {transaction.suggested_category || '(uncategorized)'}
                      <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11, backgroundColor: 'var(--accent-soft)', padding: '1px 4px', borderRadius: 4, color: 'var(--accent)' }}>
                        {Math.round(transaction.confidence * 100)}%
                      </span>
                    </button>
                    {suggestions.map(s => (
                      <button key={s.accountCode}
                        onClick={() => handleCategoryChange(s.accountCode)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          border: `1px solid ${editCode === s.accountCode ? 'var(--warning)' : 'var(--border-subtle)'}`,
                          backgroundColor: editCode === s.accountCode ? 'var(--surface-elevated)' : 'var(--surface-elevated)',
                          color: 'var(--warning)',
                        }}
                      >
                        {s.category}
                        <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11, backgroundColor: 'var(--warning-soft)', padding: '1px 4px', borderRadius: 4, color: 'var(--warning)' }}>
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
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Category
                  </label>
                  <select
                    value={editCode}
                    onChange={e => handleCategoryChange(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 8px', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--surface-card)', outline: 'none' }}
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
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    onClick={e => e.stopPropagation()}
                    placeholder="Add a note…"
                    style={{ width: '100%', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 8px', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--surface-card)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* AI reasoning */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AI Reasoning
                  </label>
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {(transaction as Transaction & { reasoning?: string }).reasoning ?? 'No reasoning provided.'}
                  </p>
                </div>
              </div>

              {/* Approve / Flag buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={handleApprove}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', backgroundColor: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 6l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Approve
                </button>
                <button
                  onClick={handleFlag}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid var(--danger)', backgroundColor: 'var(--surface-card)', color: 'var(--danger)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--danger-soft)' }}
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
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--surface-base)' }}
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
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Audit history
                  </p>
                  <ol style={{ paddingLeft: 16, borderLeft: '1px solid var(--border-subtle)', margin: 0, listStyle: 'none' }}>
                    {[...txAuditEvents].reverse().map(ev => {
                      const dotColor = ev.action === 'tx_approved' ? 'var(--accent)' : ev.action === 'tx_flagged' ? 'var(--danger)' : ev.action === 'tx_category_changed' ? 'var(--ring-focus)' : 'var(--text-tertiary)'
                      return (
                        <li key={ev.id} style={{ position: 'relative', marginBottom: 8 }}>
                          <span style={{ position: 'absolute', left: -20, top: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, border: '2px solid #fff' }} />
                          <p style={{ fontSize: 12, color: 'var(--text-primary)', margin: 0 }}>{formatAuditEvent(ev)}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '1px 0 0' }}>{ev.actor} · {fmtAuditTs(ev.timestamp)}</p>
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
