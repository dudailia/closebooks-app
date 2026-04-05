'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prediction {
  id: string
  date: string
  description: string
  amount: string
  category: string
  confidence: number
  week: string
}

interface PatternRow {
  pattern: string
  reliability: number
  basis: string
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const CLIENT_INFO: Record<string, { name: string; certainty: number; predicted: number; confirmed: number; toConfirm: number }> = {
  'smith-2024': { name: 'Smith Construction LLC', certainty: 94, predicted: 284, confirmed: 268, toConfirm: 16 },
  'bella-2024': { name: 'Bella Vista Restaurant', certainty: 71, predicted: 187, confirmed: 133, toConfirm: 47 },
  'chen-2024': { name: 'Chen Medical Practice', certainty: 97, predicted: 412, confirmed: 400, toConfirm: 5 },
  'techflow-2024': { name: 'TechFlow Inc', certainty: 62, predicted: 156, confirmed: 97, toConfirm: 44 },
  'greenvalley-2024': { name: 'Green Valley Farms', certainty: 88, predicted: 93, confirmed: 82, toConfirm: 11 },
  'meridian-2024': { name: 'Meridian Consulting', certainty: 79, predicted: 67, confirmed: 53, toConfirm: 14 },
}

const SMITH_PREDICTIONS: Prediction[] = [
  { id: 'p1', date: 'Dec 1', description: 'ADP Payroll', amount: '-$12,400', category: 'Payroll Expense', confidence: 0.99, week: 'Week of Dec 1' },
  { id: 'p2', date: 'Dec 1', description: 'Wells Fargo Rent', amount: '-$4,200', category: 'Rent Expense', confidence: 1.0, week: 'Week of Dec 1' },
  { id: 'p3', date: 'Dec 3', description: 'Mesa Supplies', amount: '-$3,847', category: 'COGS', confidence: 0.94, week: 'Week of Dec 1' },
  { id: 'p4', date: 'Dec 5', description: 'Stripe Revenue', amount: '+$8,200', category: 'Revenue', confidence: 0.97, week: 'Week of Dec 1' },
  { id: 'p5', date: 'Dec 10', description: 'ADP Payroll', amount: '-$12,400', category: 'Payroll Expense', confidence: 0.99, week: 'Week of Dec 8' },
  { id: 'p6', date: 'Dec 10', description: 'Adobe Creative Cloud', amount: '-$54.99', category: 'Software', confidence: 0.91, week: 'Week of Dec 8' },
  { id: 'p7', date: 'Dec 12', description: 'Unknown Vendor TX', amount: '-$47,200', category: '???', confidence: 0.08, week: 'Week of Dec 8' },
  { id: 'p8', date: 'Dec 14', description: 'Stripe Revenue', amount: '+$11,400', category: 'Revenue', confidence: 0.96, week: 'Week of Dec 8' },
  { id: 'p9', date: 'Dec 15', description: 'AT&T Business', amount: '-$340', category: 'Utilities', confidence: 0.88, week: 'Week of Dec 15' },
  { id: 'p10', date: 'Dec 15', description: 'Insurance Premium', amount: '-$1,200', category: 'Insurance', confidence: 0.93, week: 'Week of Dec 15' },
  { id: 'p11', date: 'Dec 18', description: 'Office Depot', amount: '-$180–240', category: 'Office Supplies', confidence: 0.73, week: 'Week of Dec 15' },
  { id: 'p12', date: 'Dec 20', description: 'Stripe Revenue', amount: '+$9,800', category: 'Revenue', confidence: 0.95, week: 'Week of Dec 15' },
  { id: 'p13', date: 'Dec 24', description: 'ADP Payroll', amount: '-$12,400', category: 'Payroll Expense', confidence: 0.99, week: 'Week of Dec 22' },
  { id: 'p14', date: 'Dec 26', description: 'Equipment Lease', amount: '-$2,100', category: 'Equipment', confidence: 0.91, week: 'Week of Dec 22' },
  { id: 'p15', date: 'Dec 28', description: 'Stripe Revenue', amount: '+$7,600', category: 'Revenue', confidence: 0.94, week: 'Week of Dec 22' },
  { id: 'p16', date: 'Dec 30', description: 'New Vendor TBD', amount: '-$8,400', category: '???', confidence: 0.31, week: 'Week of Dec 22' },
]

const TOP_PATTERNS: PatternRow[] = [
  { pattern: 'ADP Payroll (bi-weekly)', reliability: 99.2, basis: '35/36 months' },
  { pattern: 'Wells Fargo Rent (1st)', reliability: 100, basis: '18/18 months' },
  { pattern: 'Mesa Supplies (net-30)', reliability: 94.1, basis: '16/17 months' },
  { pattern: 'Stripe Revenue (daily)', reliability: 96.8, basis: '847/875 days' },
  { pattern: 'Adobe Creative Cloud', reliability: 91.3, basis: '11/12 months' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidenceColor(c: number): string {
  if (c >= 0.9) return '#2d5a27'
  if (c >= 0.6) return '#f59e0b'
  return '#ef4444'
}

function rowBg(c: number): string {
  if (c >= 0.9) return '#f8fffe'
  if (c >= 0.6) return '#fffbf0'
  return '#fff5f5'
}

function rowBorder(c: number): string {
  if (c >= 0.9) return '#2d5a27'
  if (c >= 0.6) return '#f59e0b'
  return '#ef4444'
}

function rowIcon(c: number): string {
  if (c >= 0.9) return '✓'
  if (c >= 0.6) return '?'
  return '○'
}

function rowIconColor(c: number): string {
  if (c >= 0.9) return '#2d5a27'
  if (c >= 0.6) return '#f59e0b'
  return '#ef4444'
}

// ─── Prediction Row ───────────────────────────────────────────────────────────

function PredictionRow({ pred, waterfall }: { pred: Prediction; waterfall: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const pct = Math.round(pred.confidence * 100)
  const color = confidenceColor(pred.confidence)

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 200)
    return () => clearTimeout(t)
  }, [pct])

  const isConfirmed = waterfall || pred.confidence >= 0.9

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 56px 1fr 100px 130px 50px',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          backgroundColor: isConfirmed && pred.confidence >= 0.9 ? '#f0fff4' : rowBg(pred.confidence),
          borderLeft: `3px solid ${rowBorder(pred.confidence)}`,
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f8f5f0' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isConfirmed && pred.confidence >= 0.9 ? '#f0fff4' : rowBg(pred.confidence) }}
      >
        {/* Checkbox icon */}
        <span style={{ fontSize: 14, fontWeight: 700, color: rowIconColor(pred.confidence), textAlign: 'center' }}>
          {rowIcon(pred.confidence)}
        </span>
        {/* Date */}
        <span style={{ fontSize: 13, color: '#6b6560' }}>{pred.date}</span>
        {/* Description */}
        <span style={{ fontSize: 13, color: '#1a1714', fontWeight: 500 }}>{pred.description}</span>
        {/* Amount */}
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: pred.amount.startsWith('+') ? '#2d5a27' : '#1a1714',
          textAlign: 'right',
        }}>{pred.amount}</span>
        {/* Category */}
        <span style={{ fontSize: 12, color: '#6b6560' }}>{pred.category}</span>
        {/* Confidence bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ width: 40, height: 4, backgroundColor: '#e8e0d4', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${barWidth}%`, backgroundColor: color, borderRadius: 2, transition: 'width 0.8s ease-out' }} />
          </div>
          <span style={{ fontSize: 10, color, fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          backgroundColor: '#f8f5f0',
          borderLeft: `3px solid ${rowBorder(pred.confidence)}`,
          padding: '12px 16px 12px 58px',
          fontSize: 12,
          color: '#6b6560',
          display: 'flex',
          gap: 24,
        }}>
          <span>Based on: {pred.confidence >= 0.9 ? '18 of 18 months' : '12 of 14 months'}</span>
          <span>Average amount: {pred.amount.replace('-', '').replace('+', '')}</span>
          <span style={{ color: '#b8734a' }}>
            {pred.confidence < 0.9 ? 'Amount varies ±15% month to month' : 'Highly consistent'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Weekly Group ─────────────────────────────────────────────────────────────

function WeekGroup({ week, predictions, waterfall }: { week: string; predictions: Prediction[]; waterfall: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '8px 16px',
      }}>
        {week}
      </div>
      {predictions.map((p) => (
        <PredictionRow key={p.id} pred={p} waterfall={waterfall} />
      ))}
    </div>
  )
}

// ─── Left Column ──────────────────────────────────────────────────────────────

function PredictionsColumn({
  predictions,
  clientInfo,
  unknownRef,
}: {
  predictions: Prediction[]
  clientInfo: { name: string; certainty: number; predicted: number; confirmed: number; toConfirm: number }
  unknownRef: React.RefObject<HTMLDivElement>
}) {
  const [waterfallDone, setWaterfallDone] = useState(false)

  const weeks = Array.from(new Set(predictions.map((p) => p.week)))
  const byWeek = (w: string) => predictions.filter((p) => p.week === w)

  function confirmAll() {
    setWaterfallDone(true)
  }

  function jumpToUnknowns() {
    unknownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div style={{ flex: '0 0 60%' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#faf8f4',
        zIndex: 10,
        paddingBottom: 12,
        borderBottom: '1px solid #e8e0d4',
        marginBottom: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button
            onClick={confirmAll}
            style={{
              backgroundColor: '#2d5a27',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Confirm All 94%+
          </button>
          <button
            onClick={jumpToUnknowns}
            style={{
              backgroundColor: '#fff8ed',
              color: '#f59e0b',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Jump to Unknowns
          </button>
          <span style={{ fontSize: 13, color: '#6b6560', marginLeft: 'auto' }}>
            {clientInfo.predicted} predicted · {clientInfo.confirmed} confirmed · {clientInfo.toConfirm} remaining
          </span>
        </div>
      </div>

      {/* Weeks */}
      <div ref={unknownRef}>
        {weeks.map((w) => (
          <WeekGroup key={w} week={w} predictions={byWeek(w)} waterfall={waterfallDone} />
        ))}
      </div>
    </div>
  )
}

// ─── Right Column ─────────────────────────────────────────────────────────────

function PatternIntelligence() {
  return (
    <div style={{ flex: '0 0 40%' }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 12,
        padding: 24,
        position: 'sticky',
        top: 0,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1714', margin: '0 0 4px 0' }}>Pattern Intelligence</h3>

        {/* Pattern Summary */}
        <p style={{ fontSize: 13, color: '#6b6560', margin: '0 0 20px 0' }}>
          December predictions built from 18 months of history. 847 patterns identified.
        </p>

        {/* Top Patterns */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1714', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Top Patterns (by reliability)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Pattern', 'Reliability', 'Basis'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '4px 6px', color: '#9ca3af', fontSize: 11, fontWeight: 600, borderBottom: '1px solid #e8e0d4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_PATTERNS.map((row) => (
                <tr key={row.pattern}>
                  <td style={{ padding: '6px 6px', color: '#1a1714', fontSize: 12 }}>{row.pattern}</td>
                  <td style={{
                    padding: '6px 6px',
                    fontWeight: 700,
                    fontSize: 12,
                    color: row.reliability >= 90 ? '#2d5a27' : row.reliability >= 70 ? '#f59e0b' : '#ef4444',
                  }}>{row.reliability}%</td>
                  <td style={{ padding: '6px 6px', color: '#6b6560', fontSize: 12 }}>{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Uncertainty Flags */}
        <div style={{
          backgroundColor: '#fffbf0',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Uncertainty Flags</div>
          {[
            '⚠ 1 transaction 6× larger than normal (Dec 12 — $47,200)',
            '⚠ 2 new vendors not in history',
            '⚠ December is 18% higher than average for construction',
          ].map((flag) => (
            <div key={flag} style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>{flag}</div>
          ))}
        </div>

        {/* Monthly Savings */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1714', marginBottom: 6 }}>Monthly Savings</div>
          <p style={{ fontSize: 12, color: '#6b6560', margin: 0 }}>
            By confirming these predictions now, you&apos;ll reduce December close time from ~6 hours to ~45 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Close Early Banner ───────────────────────────────────────────────────────

function CloseEarlyBanner({ certainty, toConfirm }: { certainty: number; toConfirm: number }) {
  const [visible, setVisible] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 300)
    const t2 = setTimeout(() => setPulse(true), 1000)
    const t3 = setTimeout(() => setPulse(false), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  if (certainty < 90) return null

  return (
    <div style={{
      backgroundColor: '#2d5a27',
      color: '#ffffff',
      borderRadius: 10,
      padding: '14px 20px',
      marginBottom: 24,
      fontSize: 14,
      fontWeight: 600,
      transform: visible ? 'translateY(0)' : 'translateY(-20px)',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.4s ease, opacity 0.4s ease',
      boxShadow: pulse ? '0 0 0 4px rgba(45,90,39,0.3)' : 'none',
    }}>
      ✓ December books are {certainty}% complete — 5 days before month end. {toConfirm} items remaining.
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientPredictPage() {
  const params = useParams()
  const clientId = typeof params.clientId === 'string' ? params.clientId : 'smith-2024'
  const clientInfo = CLIENT_INFO[clientId] ?? CLIENT_INFO['smith-2024']
  const unknownRef = useRef<HTMLDivElement>(null)

  const badgeColor = clientInfo.certainty >= 90 ? '#2d5a27' : clientInfo.certainty >= 75 ? '#86efac' : '#f59e0b'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Back link */}
      <Link href="/dashboard/predict" style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← Predictive Close
      </Link>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: 24,
          fontWeight: 400,
          color: '#1a1714',
          margin: 0,
        }}>
          {clientInfo.name} — December 2025 Predictions
        </h1>
        <span style={{
          backgroundColor: badgeColor,
          color: '#ffffff',
          borderRadius: 20,
          padding: '4px 14px',
          fontSize: 13,
          fontWeight: 700,
        }}>
          {clientInfo.certainty}% ready
        </span>
        <Link href={`/dashboard/predict/${clientId}/patterns`} style={{
          marginLeft: 'auto',
          fontSize: 13,
          color: '#b8734a',
          textDecoration: 'none',
          fontWeight: 600,
        }}>
          View All Patterns →
        </Link>
      </div>

      {/* Close Early Banner */}
      <CloseEarlyBanner certainty={clientInfo.certainty} toConfirm={clientInfo.toConfirm} />

      {/* Main 2-col layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <PredictionsColumn predictions={SMITH_PREDICTIONS} clientInfo={clientInfo} unknownRef={unknownRef} />
        <PatternIntelligence />
      </div>
    </div>
  )
}
