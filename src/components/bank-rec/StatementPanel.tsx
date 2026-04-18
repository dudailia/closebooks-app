'use client'
import type { BankStatementLine } from '@/lib/bank-rec/types'

interface Props {
  lines: BankStatementLine[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const ACCENT = '#b8734a'
const MUTED = '#6b6560'
const TEXT = '#1a1714'

function ConfBadge({ conf }: { conf?: number }) {
  if (!conf) return null
  const [bg, color] = conf >= 90 ? ['#ecfdf5', '#059669'] : conf >= 70 ? ['#fef3c7', '#b45309'] : ['#fef2f2', '#dc2626']
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: bg, color }}>
      {conf}%
    </span>
  )
}

export default function StatementPanel({ lines, selectedId, onSelect }: Props) {
  const unmatched = lines.filter(l => l.status === 'unmatched').length
  const matched = lines.filter(l => l.status === 'matched').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0dbd4', background: '#faf8f4', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Bank Statement
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{unmatched}</span> unmatched ·{' '}
          <span style={{ color: '#059669', fontWeight: 600 }}>{matched}</span> matched
        </div>
      </div>

      {/* Lines */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {lines.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
            No statement lines loaded
          </div>
        )}
        {lines.map(line => {
          const isSelected = line.id === selectedId
          const isUnmatched = line.status === 'unmatched'
          const isMatched = line.status === 'matched'

          return (
            <div
              key={line.id}
              onClick={() => isUnmatched && onSelect(line.id)}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f0ede8',
                cursor: isUnmatched ? 'pointer' : 'default',
                background: isSelected ? '#fdf2e9' : isMatched ? '#f3faf5' : '#fffbf8',
                borderLeft: `3px solid ${isSelected ? ACCENT : isMatched ? '#86efac' : isUnmatched ? 'transparent' : '#e0dbd4'}`,
                transition: 'background 0.1s',
                opacity: line.status === 'excluded' ? 0.4 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: isSelected ? ACCENT : TEXT,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {line.description}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {line.date}
                    {line.reference_number && ` · #${line.reference_number}`}
                    {isMatched && <span style={{ color: '#059669', marginLeft: 4 }}>✓</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: line.type === 'credit' ? '#059669' : '#dc2626',
                  }}>
                    {line.type === 'debit' ? '−' : '+'}${line.amount.toFixed(2)}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <ConfBadge conf={line.match_confidence} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
