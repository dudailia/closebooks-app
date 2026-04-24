'use client'
import { useEffect, useState, useMemo } from 'react'
import type { Transaction, TransactionSplit, ChartOfAccounts } from '@/types'

interface Props {
  transaction: Transaction | null
  chartOfAccounts: ChartOfAccounts[]
  onSave: (splits: TransactionSplit[]) => void
  onClose: () => void
}

function mkSplit(amount: number, seed?: Partial<TransactionSplit>): TransactionSplit {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount,
    account_code: seed?.account_code ?? '',
    category: seed?.category ?? '',
    notes: seed?.notes,
  }
}

export default function SplitModal({ transaction, chartOfAccounts, onSave, onClose }: Props) {
  const [splits, setSplits] = useState<TransactionSplit[]>([])

  useEffect(() => {
    if (!transaction) return
    if (transaction.splits && transaction.splits.length > 0) {
      setSplits(transaction.splits.map(s => ({ ...s })))
    } else {
      const seed = {
        account_code: transaction.final_account_code ?? transaction.suggested_account_code ?? '',
        category: transaction.final_category ?? transaction.suggested_category ?? '',
      }
      const half = Math.round(transaction.amount * 50) / 100
      setSplits([
        { ...mkSplit(half, seed) },
        mkSplit(Number((transaction.amount - half).toFixed(2))),
      ])
    }
  }, [transaction])

  const total = useMemo(
    () => splits.reduce((s, x) => s + (Number.isFinite(x.amount) ? x.amount : 0), 0),
    [splits]
  )
  const delta = transaction ? Number((transaction.amount - total).toFixed(2)) : 0
  const balanced = transaction ? Math.abs(delta) < 0.005 : false
  const allCategorized = splits.every(s => s.account_code)

  if (!transaction) return null

  function update(i: number, patch: Partial<TransactionSplit>) {
    setSplits(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  function addRow() {
    setSplits(prev => [...prev, mkSplit(0)])
  }
  function removeRow(i: number) {
    if (splits.length <= 2) return
    setSplits(prev => prev.filter((_, idx) => idx !== i))
  }
  function splitEven() {
    if (!transaction) return
    const n = splits.length
    const per = Math.round((transaction.amount / n) * 100) / 100
    const next = splits.map((s, i) => ({
      ...s,
      amount: i === n - 1 ? Number((transaction.amount - per * (n - 1)).toFixed(2)) : per,
    }))
    setSplits(next)
  }
  function split50() {
    if (!transaction || splits.length !== 2) return
    const half = Math.round(transaction.amount * 50) / 100
    setSplits([
      { ...splits[0], amount: half },
      { ...splits[1], amount: Number((transaction.amount - half).toFixed(2)) },
    ])
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--surface-card)',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          width: 680,
          maxWidth: '95vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: 'var(--text-primary)',
            }}
          >
            Split transaction
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            {transaction.description} ·{' '}
            <strong>${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <div style={{ padding: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 6px' }}>Amount</th>
                <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 6px' }}>Category</th>
                <th style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 6px' }}>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {splits.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ padding: '4px 0' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={s.amount}
                      onChange={e => update(i, { amount: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: 110,
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '6px 8px',
                        fontFamily: 'monospace',
                        fontSize: 13,
                      }}
                    />
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <select
                      value={s.account_code}
                      onChange={e => {
                        const a = chartOfAccounts.find(x => x.code === e.target.value)
                        update(i, {
                          account_code: e.target.value,
                          category: a?.name ?? e.target.value,
                        })
                      }}
                      style={{
                        width: 240,
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '6px 8px',
                        fontSize: 13,
                      }}
                    >
                      <option value="">— choose —</option>
                      {(['asset', 'liability', 'equity', 'revenue', 'expense'] as const).map(type => {
                        const g = chartOfAccounts.filter(a => a.type === type)
                        if (g.length === 0) return null
                        return (
                          <optgroup key={type} label={type[0].toUpperCase() + type.slice(1)}>
                            {g.map(a => (
                              <option key={a.code} value={a.code}>
                                [{a.code}] {a.name}
                              </option>
                            ))}
                          </optgroup>
                        )
                      })}
                    </select>
                  </td>
                  <td style={{ padding: '4px 8px' }}>
                    <input
                      type="text"
                      value={s.notes ?? ''}
                      onChange={e => update(i, { notes: e.target.value })}
                      placeholder="Optional"
                      style={{
                        width: '100%',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '6px 8px',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>
                    <button
                      onClick={() => removeRow(i)}
                      disabled={splits.length <= 2}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: splits.length <= 2 ? 'var(--border-strong)' : 'var(--danger)',
                        fontSize: 18,
                        cursor: splits.length <= 2 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={addRow}
              style={{
                border: '1px dashed var(--border-strong)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              + Add row
            </button>
            <button
              onClick={splitEven}
              style={{
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-base)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Split evenly
            </button>
            {splits.length === 2 && (
              <button
                onClick={split50}
                style={{
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--surface-base)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                50 / 50
              </button>
            )}
          </div>
        </div>
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: balanced ? 'var(--accent)' : 'var(--danger)',
            }}
          >
            {balanced
              ? '$0.00 remaining ✓'
              : `${delta > 0 ? 'Short' : 'Over'} by $${Math.abs(delta).toFixed(2)}`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-secondary)',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              disabled={!balanced || !allCategorized}
              onClick={() => onSave(splits)}
              style={{
                border: 'none',
                backgroundColor: balanced && allCategorized ? 'var(--accent)' : 'var(--text-tertiary)',
                color: '#fff',
                padding: '7px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: balanced && allCategorized ? 'pointer' : 'not-allowed',
              }}
            >
              Save split
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
