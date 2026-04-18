'use client'

interface Props {
  bankBalance: number
  bookBalance: number
  unmatchedBankCount: number
  unmatchedBookCount: number
  onComplete: () => void
  completing: boolean
  isCompleted: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function Tile({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 17, fontWeight: bold ? 800 : 600, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

export default function BalanceBar({ bankBalance, bookBalance, unmatchedBankCount, unmatchedBookCount, onComplete, completing, isCompleted }: Props) {
  const diff = bankBalance - bookBalance
  const balanced = Math.abs(diff) < 0.005

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '12px 24px',
      background: '#ffffff',
      borderBottom: '1px solid #e0dbd4',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Tile label="Adj. Bank Balance" value={fmt(bankBalance)} color="#1a1714" />
      <div style={{ width: 1, height: 32, background: '#e0dbd4' }} />
      <Tile label="Adj. Book Balance" value={fmt(bookBalance)} color="#1a1714" />
      <div style={{ width: 1, height: 32, background: '#e0dbd4' }} />
      <Tile
        label="Difference"
        value={fmt(diff)}
        color={balanced ? '#059669' : '#dc2626'}
        bold
      />

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 12, color: '#6b6560', textAlign: 'right' }}>
        <div>{unmatchedBankCount} bank unmatched</div>
        <div>{unmatchedBookCount} book unmatched</div>
      </div>

      {!isCompleted ? (
        <button
          onClick={onComplete}
          disabled={!balanced || completing}
          title={!balanced ? `Difference of ${fmt(diff)} must be $0.00` : 'Complete reconciliation'}
          style={{
            padding: '9px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: balanced && !completing ? 'pointer' : 'not-allowed',
            background: balanced ? '#b8734a' : '#e0dbd4',
            color: balanced ? '#fff' : '#9b9590',
            border: 'none',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {completing ? 'Completing…' : balanced ? '✓ Complete Rec' : `Off ${fmt(Math.abs(diff))}`}
        </button>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', padding: '9px 0' }}>
          ✓ Reconciliation Complete
        </span>
      )}
    </div>
  )
}
