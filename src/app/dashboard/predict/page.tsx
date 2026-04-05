'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CertaintyBar from '@/components/predict/CertaintyBar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientPrediction {
  id: string
  name: string
  certainty: number
  predicted: number
  confirmed: number
  toConfirm: number
  unexpected: number
  uncertainties: string[]
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const CLIENTS: ClientPrediction[] = [
  {
    id: 'smith-2024',
    name: 'Smith Construction LLC',
    certainty: 94,
    predicted: 284,
    confirmed: 268,
    toConfirm: 16,
    unexpected: 0,
    uncertainties: ['1 large unusual payment', '2 new vendors'],
  },
  {
    id: 'bella-2024',
    name: 'Bella Vista Restaurant',
    certainty: 71,
    predicted: 187,
    confirmed: 133,
    toConfirm: 47,
    unexpected: 3,
    uncertainties: ['3 unexpected vendor charges', 'seasonal variation'],
  },
  {
    id: 'chen-2024',
    name: 'Chen Medical Practice',
    certainty: 97,
    predicted: 412,
    confirmed: 400,
    toConfirm: 5,
    unexpected: 7,
    uncertainties: ['Medical supply variance'],
  },
  {
    id: 'techflow-2024',
    name: 'TechFlow Inc',
    certainty: 62,
    predicted: 156,
    confirmed: 97,
    toConfirm: 44,
    unexpected: 15,
    uncertainties: ['New SaaS subscriptions', 'irregular payroll'],
  },
  {
    id: 'greenvalley-2024',
    name: 'Green Valley Farms',
    certainty: 88,
    predicted: 93,
    confirmed: 82,
    toConfirm: 11,
    unexpected: 0,
    uncertainties: [],
  },
  {
    id: 'meridian-2024',
    name: 'Meridian Consulting',
    certainty: 79,
    predicted: 67,
    confirmed: 53,
    toConfirm: 14,
    unexpected: 2,
    uncertainties: [],
  },
]

// ─── Count-up Hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const steps = 60
    const increment = target / steps
    let current = 0
    let step = 0
    const interval = setInterval(() => {
      step++
      current = Math.min(current + increment, target)
      setValue(Math.round(current))
      if (step >= steps) clearInterval(interval)
    }, duration / steps)
    return () => clearInterval(interval)
  }, [target, duration])
  return value
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#1a1714' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e8e0d4',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--font-dm-serif)' }}>{value}</div>
    </div>
  )
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow() {
  const avgCertainty = useCountUp(84)
  const predicted = useCountUp(1847)
  const preConfirmed = useCountUp(1628)
  const needsReview = useCountUp(219)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      <StatCard label="Avg Certainty" value={`${avgCertainty}%`} color="#2d5a27" />
      <StatCard label="Predicted Transactions" value={predicted.toLocaleString()} />
      <StatCard label="Pre-Confirmed" value={`${preConfirmed.toLocaleString()} (88%)`} color="#2d5a27" />
      <StatCard label="Needs Review" value={needsReview.toLocaleString()} color="#f59e0b" />
    </div>
  )
}

// ─── Certainty Legend ─────────────────────────────────────────────────────────

function CertaintyLegend() {
  const items = [
    { color: '#ef4444', label: '0–50% Too early' },
    { color: '#f59e0b', label: '50–75% Building' },
    { color: '#86efac', label: '75–90% Good' },
    { color: '#2d5a27', label: '90%+ Ready' },
  ]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      backgroundColor: '#ffffff',
      border: '1px solid #e8e0d4',
      borderRadius: 10,
      padding: '12px 20px',
      marginBottom: 24,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', marginRight: 4 }}>Certainty Legend:</span>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 10, backgroundColor: item.color, borderRadius: 3 }} />
          <span style={{ fontSize: 12, color: '#6b6560' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Client Card ─────────────────────────────────────────────────────────────

function ClientCard({ client, index }: { client: ClientPrediction; index: number }) {
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(client.certainty), 150 + index * 100)
    return () => clearTimeout(timer)
  }, [client.certainty, index])

  const barColor =
    client.certainty >= 90 ? '#2d5a27'
    : client.certainty >= 75 ? '#86efac'
    : client.certainty >= 50 ? '#f59e0b'
    : '#ef4444'

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e8e0d4',
      borderRadius: 14,
      padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1714' }}>{client.name}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: barColor }}>{client.certainty}% ready</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, backgroundColor: '#e8e0d4', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          height: '100%',
          width: `${barWidth}%`,
          backgroundColor: barColor,
          borderRadius: 4,
          transition: 'width 0.8s ease-out',
        }} />
      </div>

      {/* Metrics */}
      <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>
        {client.predicted} predicted · {client.confirmed} confirmed · {client.toConfirm} to confirm · {client.unexpected} unexpected
      </div>

      {/* Uncertainties */}
      {client.uncertainties.length > 0 && (
        <div style={{ fontSize: 12, color: '#b8734a', marginBottom: 14 }}>
          Biggest uncertainties: {client.uncertainties.join(', ')}
        </div>
      )}

      <Link href={`/dashboard/predict/${client.id}`}>
        <button style={{
          backgroundColor: '#2d5a27',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          Review Predictions →
        </button>
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PredictPage() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: 28,
          fontWeight: 400,
          color: '#1a1714',
          margin: 0,
          marginBottom: 6,
        }}>
          Predictive Close
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          AI-predicted transactions for December 2025 — ready before month end.
        </p>
      </div>

      {/* Stats Row */}
      <StatsRow />

      {/* Certainty Legend */}
      <CertaintyLegend />

      {/* Client Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20,
      }}>
        {CLIENTS.map((client, i) => (
          <ClientCard key={client.id} client={client} index={i} />
        ))}
      </div>
    </div>
  )
}
