'use client'
import type { Reconciliation, ReconciliationItem } from '@/lib/bank-rec/types'

interface Props {
  reconciliation: Reconciliation
  clientName: string
  items: ReconciliationItem[]
  onClose: () => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function Row({ label, amount, indent, positive, bold, subtotal }: {
  label: string; amount: number; indent?: boolean; positive?: boolean; bold?: boolean; subtotal?: boolean
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: `${subtotal ? 8 : 4}px ${indent ? '20px' : '0'}`,
      borderTop: subtotal ? '2px solid #1a1714' : undefined,
      marginTop: subtotal ? 4 : 0,
    }}>
      <span style={{ fontSize: subtotal ? 14 : 13, fontWeight: bold || subtotal ? 700 : 400, color: '#1a1714' }}>
        {label}
      </span>
      <span style={{
        fontSize: subtotal ? 14 : 13, fontWeight: bold || subtotal ? 700 : 400,
        color: positive === true ? '#059669' : positive === false ? '#dc2626' : '#1a1714',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {positive === true ? '+' : positive === false ? '' : ''}{fmt(amount)}
      </span>
    </div>
  )
}

export default function ReconciliationReport({ reconciliation, clientName, items, onClose }: Props) {
  const openItems = items.filter(i => i.status === 'open')
  const deposits = openItems.filter(i => i.type === 'deposit_in_transit').reduce((s, i) => s + i.amount, 0)
  const checks = openItems.filter(i => i.type === 'outstanding_check').reduce((s, i) => s + i.amount, 0)
  const bankAdj = openItems.filter(i => i.type === 'bank_adjustment').reduce((s, i) => s + i.amount, 0)
  const bookAdj = openItems.filter(i => i.type === 'book_adjustment').reduce((s, i) => s + i.amount, 0)
  const adjBank = reconciliation.bank_balance + deposits - checks + bankAdj
  const adjBook = reconciliation.book_balance + bookAdj
  const diff = adjBank - adjBook
  const balanced = Math.abs(diff) < 0.005

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '32px 16px', overflowY: 'auto',
    }}>
      <div id="bank-rec-report" style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700,
        padding: '40px 52px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Controls — hidden on print */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <button onClick={onClose} style={{ border: 'none', background: '#f5f3ef', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13, color: '#6b6560' }}>
            ← Back to Workspace
          </button>
          <button onClick={() => window.print()} style={{ border: 'none', background: '#b8734a', borderRadius: 8, padding: '6px 20px', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            🖨 Print / Save PDF
          </button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #1a1714', paddingBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.01em', fontFamily: 'Georgia, serif' }}>
            BANK RECONCILIATION
          </h1>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 2px', color: '#1a1714' }}>{clientName}</p>
          <p style={{ fontSize: 13, color: '#6b6560', margin: 0 }}>Period: {reconciliation.period}</p>
          {reconciliation.completed_at && (
            <p style={{ fontSize: 12, color: '#9b9590', margin: '6px 0 0' }}>
              Prepared {new Date(reconciliation.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {reconciliation.completed_by ? ` · ${reconciliation.completed_by}` : ''}
            </p>
          )}
        </div>

        {/* Bank side */}
        <div style={{ marginBottom: 24 }}>
          <Row label="Bank Statement Balance" amount={reconciliation.bank_balance} bold />
          {openItems.filter(i => i.type === 'deposit_in_transit').map(i => (
            <Row key={i.id} label={`Add: ${i.description}`} amount={i.amount} indent positive />
          ))}
          {openItems.filter(i => i.type === 'outstanding_check').map(i => (
            <Row key={i.id} label={`Less: ${i.description}`} amount={-i.amount} indent positive={false} />
          ))}
          {openItems.filter(i => i.type === 'bank_adjustment').map(i => (
            <Row key={i.id} label={`Adj: ${i.description}`} amount={i.amount} indent positive={i.amount >= 0} />
          ))}
          <Row label="Adjusted Bank Balance" amount={adjBank} subtotal bold />
        </div>

        {/* Book side */}
        <div style={{ marginBottom: 28 }}>
          <Row label="Book Balance (General Ledger)" amount={reconciliation.book_balance} bold />
          {openItems.filter(i => i.type === 'book_adjustment').map(i => (
            <Row key={i.id} label={`Adj: ${i.description}`} amount={i.amount} indent positive={i.amount >= 0} />
          ))}
          <Row label="Adjusted Book Balance" amount={adjBook} subtotal bold />
        </div>

        {/* Difference */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0', borderTop: '3px double #1a1714',
        }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>Difference (must be $0.00)</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: balanced ? '#059669' : '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
            {fmt(diff)} {balanced ? '✓' : '✗'}
          </span>
        </div>

        {!balanced && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#dc2626' }}>
            This reconciliation is not balanced. The difference of {fmt(diff)} must be investigated and resolved.
          </div>
        )}

        {/* Outstanding items detail */}
        {openItems.length > 0 && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e0dbd4' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b6560', margin: '0 0 12px' }}>
              Reconciling Items Detail
            </h3>
            {(['deposit_in_transit', 'outstanding_check', 'bank_adjustment', 'book_adjustment'] as const).map(type => {
              const group = openItems.filter(i => i.type === type)
              if (!group.length) return null
              const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              return (
                <div key={type} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  {group.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0 2px 12px', color: '#1a1714' }}>
                      <span>{i.description}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(i.amount)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bank-rec-report, #bank-rec-report * { visibility: visible !important; }
          #bank-rec-report { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; box-shadow: none !important; border-radius: 0 !important; padding: 24px 40px !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
