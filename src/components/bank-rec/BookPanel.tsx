'use client'
import type { BookTransaction } from '@/lib/bank-rec/types'

interface Props {
  transactions: BookTransaction[]
  matchedIds: Set<string>
  selectedIds: string[]
  onToggle: (id: string) => void
}

const MUTED = '#6b6560'
const TEXT = '#1a1714'

export default function BookPanel({ transactions, matchedIds, selectedIds, onToggle }: Props) {
  const unmatched = transactions.filter(t => !matchedIds.has(t.id)).length
  const matched = transactions.filter(t => matchedIds.has(t.id)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0dbd4', background: '#faf8f4', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Book Transactions
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{unmatched}</span> unmatched ·{' '}
          <span style={{ color: '#059669', fontWeight: 600 }}>{matched}</span> matched
        </div>
      </div>

      {/* Transactions */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {transactions.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
            No approved book transactions found.<br />
            <span style={{ fontSize: 11 }}>Approve categorized transactions first.</span>
          </div>
        )}
        {transactions.map(txn => {
          const isMatched = matchedIds.has(txn.id)
          const isSelected = selectedIds.includes(txn.id)

          return (
            <div
              key={txn.id}
              onClick={() => !isMatched && onToggle(txn.id)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f0ede8',
                cursor: isMatched ? 'default' : 'pointer',
                background: isSelected ? '#eff6ff' : isMatched ? '#f3faf5' : '#fffbf8',
                borderLeft: `3px solid ${isSelected ? '#3b82f6' : isMatched ? '#86efac' : 'transparent'}`,
                transition: 'background 0.1s',
                opacity: isMatched ? 0.55 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: isSelected ? '#3b82f6' : TEXT,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {txn.description}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {txn.date}
                    {txn.category && ` · ${txn.category}`}
                    {isMatched && <span style={{ color: '#059669', marginLeft: 4 }}>✓</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: txn.type === 'credit' ? '#059669' : '#dc2626',
                  }}>
                    {txn.type === 'debit' ? '−' : '+'}${txn.amount.toFixed(2)}
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>SELECTED</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
