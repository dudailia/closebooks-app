'use client'
import type { BankStatementLine, BookTransaction, MatchedPair } from '@/lib/bank-rec/types'

interface Props {
  matches: MatchedPair[]
  bankLines: BankStatementLine[]
  bookTransactions: BookTransaction[]
  onUnmatch: (bankLineId: string) => void
  unmatchingId: string | null
}

const MUTED = '#6b6560'
const TEXT = '#1a1714'

function ConfBadge({ conf, type }: { conf: number; type: string }) {
  const [bg, color] =
    conf >= 90 ? ['#ecfdf5', '#059669'] :
    conf >= 70 ? ['#fef3c7', '#b45309'] :
    ['#fef2f2', '#dc2626']

  const label =
    type === 'exact' ? 'EXACT' :
    type === 'ai' ? 'AI' :
    type === 'manual' ? 'MANUAL' :
    type === 'compound' ? 'COMPOUND' :
    `${conf}%`

  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: bg, color }}>
      {label} {type !== 'exact' && type !== 'ai' && type !== 'manual' && type !== 'compound' ? '' : conf < 100 ? `${conf}%` : ''}
    </span>
  )
}

export default function MatchedPairs({ matches, bankLines, bookTransactions, onUnmatch, unmatchingId }: Props) {
  const bankMap = new Map(bankLines.map(l => [l.id, l]))
  const bookMap = new Map(bookTransactions.map(t => [t.id, t]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0dbd4', background: '#faf8f4', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Matched Pairs
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          <span style={{ color: '#059669', fontWeight: 600 }}>{matches.length}</span> matched
        </div>
      </div>

      {/* Matches */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {matches.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
            No matches yet<br />
            <span style={{ fontSize: 11 }}>Click Auto-Match or select items manually</span>
          </div>
        )}
        {matches.map(m => {
          const bank = bankMap.get(m.bankLineId)
          const books = m.bookTransactionIds.map(id => bookMap.get(id)).filter((b): b is BookTransaction => !!b)
          if (!bank) return null
          const bookTotal = books.reduce((s, b) => s + b.amount, 0)
          const discrepancy = Math.abs(bank.amount - bookTotal)
          const hasDisc = discrepancy > 0.01

          return (
            <div
              key={m.bankLineId}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f0ede8',
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <ConfBadge conf={m.confidence} type={m.matchType} />
                <button
                  onClick={() => onUnmatch(m.bankLineId)}
                  disabled={unmatchingId === m.bankLineId}
                  style={{
                    fontSize: 11, color: MUTED, background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 6px', borderRadius: 6,
                    opacity: unmatchingId === m.bankLineId ? 0.5 : 1,
                  }}
                >
                  ✕ unmatch
                </button>
              </div>

              {/* Bank side */}
              <div style={{
                fontSize: 11, padding: '5px 8px', background: '#f0fdf4', borderRadius: 6,
                marginBottom: 3, borderLeft: '3px solid #86efac',
              }}>
                <span style={{ color: MUTED, fontWeight: 600, fontSize: 10, marginRight: 4 }}>BANK</span>
                <span style={{ fontWeight: 600, color: TEXT }}>{bank.description}</span>
                <span style={{ color: bank.type === 'credit' ? '#059669' : '#dc2626', fontWeight: 700, marginLeft: 6 }}>
                  {bank.type === 'debit' ? '−' : '+'}${bank.amount.toFixed(2)}
                </span>
                <span style={{ color: MUTED, marginLeft: 6 }}>{bank.date}</span>
              </div>

              {/* Book side(s) */}
              {books.map(b => (
                <div key={b.id} style={{
                  fontSize: 11, padding: '5px 8px', background: '#eff6ff', borderRadius: 6,
                  marginBottom: 3, borderLeft: '3px solid #93c5fd',
                }}>
                  <span style={{ color: MUTED, fontWeight: 600, fontSize: 10, marginRight: 4 }}>BOOK</span>
                  <span style={{ fontWeight: 600, color: TEXT }}>{b.description}</span>
                  <span style={{ color: b.type === 'credit' ? '#059669' : '#dc2626', fontWeight: 700, marginLeft: 6 }}>
                    {b.type === 'debit' ? '−' : '+'}${b.amount.toFixed(2)}
                  </span>
                  <span style={{ color: MUTED, marginLeft: 6 }}>{b.date}</span>
                </div>
              ))}

              {hasDisc && (
                <div style={{ fontSize: 10, color: '#b45309', marginTop: 4, padding: '3px 6px', background: '#fef3c7', borderRadius: 4 }}>
                  ⚠ Amount discrepancy: ${discrepancy.toFixed(2)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
