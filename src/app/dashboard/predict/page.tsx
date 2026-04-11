'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getJobs } from '@/lib/storage'
import type { CategorizationJob, Transaction } from '@/types'

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
  jobId: string
}

// ─── Compute predictions from real transaction data ───────────────────────────

function computePredictions(jobs: CategorizationJob[]): ClientPrediction[] {
  // Group jobs by client
  const byClient = new Map<string, CategorizationJob[]>()
  for (const job of jobs) {
    const list = byClient.get(job.client_name) ?? []
    list.push(job)
    byClient.set(job.client_name, list)
  }

  const results: ClientPrediction[] = []

  for (const [clientName, clientJobs] of Array.from(byClient.entries())) {
    // Sort jobs chronologically
    const sorted = [...clientJobs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const latestJob = sorted[sorted.length - 1]
    const allTx: Transaction[] = clientJobs.flatMap((j: CategorizationJob) => j.transactions)

    // Total transactions
    const total = latestJob.total_transactions || latestJob.transactions.length
    const approved = latestJob.transactions.filter((t: Transaction) => t.status === 'approved' || t.status === 'edited').length
    const flagged = latestJob.transactions.filter((t: Transaction) => t.status === 'flagged').length
    const pending = latestJob.transactions.filter((t: Transaction) => t.status === 'pending').length

    // Certainty: based on auto-approval rate and confidence distribution
    const withConf = latestJob.transactions.filter((t: Transaction) => t.confidence > 0)
    const avgConf = withConf.length > 0
      ? withConf.reduce((s: number, t: Transaction) => s + t.confidence, 0) / withConf.length
      : 0.75
    const certainty = Math.min(99, Math.round(avgConf * 100))

    // Detect recurring vendors (appear in multiple months)
    const vendorMonths = new Map<string, Set<string>>()
    for (const tx of allTx) {
      const key = tx.description.slice(0, 20).toLowerCase()
      const month = tx.date.slice(0, 7)
      const months = vendorMonths.get(key) ?? new Set<string>()
      months.add(month)
      vendorMonths.set(key, months)
    }
    const recurringVendors = Array.from(vendorMonths.entries()).filter(([, months]: [string, Set<string>]) => months.size >= 2).length

    // Uncertainties
    const uncertainties: string[] = []
    if (flagged > 0) uncertainties.push(`${flagged} flagged transaction${flagged !== 1 ? 's' : ''}`)
    if (pending > 0) uncertainties.push(`${pending} pending review`)
    if (recurringVendors === 0) uncertainties.push('no recurring patterns yet')

    const id = clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    results.push({
      id,
      name: clientName,
      certainty,
      predicted: total,
      confirmed: approved,
      toConfirm: pending,
      unexpected: flagged,
      uncertainties: uncertainties.slice(0, 3),
      jobId: latestJob.id,
    })
  }

  return results.sort((a, b) => b.certainty - a.certainty)
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

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

// ─── UI components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#1a1714' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function CertaintyLegend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 10, padding: '12px 20px', marginBottom: 24, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b6560' }}>Certainty:</span>
      {[
        { color: '#ef4444', label: '0–50% Too early' },
        { color: '#f59e0b', label: '50–75% Building' },
        { color: '#86efac', label: '75–90% Good' },
        { color: '#2d5a27', label: '90%+ Ready' },
      ].map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 8, backgroundColor: item.color, borderRadius: 3 }} />
          <span style={{ fontSize: 12, color: '#6b6560' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function ClientCard({ client, index }: { client: ClientPrediction; index: number }) {
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(client.certainty), 150 + index * 100)
    return () => clearTimeout(t)
  }, [client.certainty, index])

  const barColor =
    client.certainty >= 90 ? '#2d5a27'
    : client.certainty >= 75 ? '#86efac'
    : client.certainty >= 50 ? '#f59e0b'
    : '#ef4444'

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 14, padding: 24 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1714' }}>{client.name}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: barColor }}>{client.certainty}% ready</span>
      </div>
      <div style={{ height: 8, backgroundColor: '#e8e0d4', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${barWidth}%`, backgroundColor: barColor, borderRadius: 4, transition: 'width 0.8s ease-out' }} />
      </div>
      <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>
        {client.predicted} total · {client.confirmed} approved · {client.toConfirm} pending · {client.unexpected} flagged
      </div>
      {client.uncertainties.length > 0 && (
        <div style={{ fontSize: 12, color: '#b8734a', marginBottom: 14 }}>
          ⚠ {client.uncertainties.join(' · ')}
        </div>
      )}
      <Link
        href={`/dashboard/predict/${client.id}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#2d5a27', color: '#ffffff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
      >
        Review Predictions →
      </Link>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 14 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No close data yet</h3>
      <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 400, margin: '0 auto 24px' }}>
        Upload at least one close to start predicting. The more closes you complete, the more accurate predictions become.
      </p>
      <Link href="/dashboard/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        + New Close
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PredictPage() {
  const [clients, setClients] = useState<ClientPrediction[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    const predictions = computePredictions(jobs)
    setClients(predictions)
    setMounted(true)
  }, [])

  const totalPredicted = useCountUp(clients.reduce((s, c) => s + c.predicted, 0))
  const totalConfirmed = useCountUp(clients.reduce((s, c) => s + c.confirmed, 0))
  const totalReview = useCountUp(clients.reduce((s, c) => s + c.toConfirm, 0))
  const avgCertainty = useCountUp(
    clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.certainty, 0) / clients.length) : 0
  )

  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthLabel = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (!mounted) {
    return <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ height: 120, borderRadius: 12, backgroundColor: '#f0ebe3', marginBottom: 24 }} className="cb-skeleton" />
    </div>
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }} className="sm:px-10">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1a1714', margin: 0, marginBottom: 6 }}>
          Predictive Close
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>
          AI-predicted transaction volume for {nextMonthLabel} — based on your real close history.
        </p>
      </div>

      {clients.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }} className="sm:grid-cols-4">
            <StatCard label="Avg Certainty" value={`${avgCertainty}%`} color="#2d5a27" />
            <StatCard label="Total Transactions" value={totalPredicted.toLocaleString()} />
            <StatCard label="Approved" value={totalConfirmed.toLocaleString()} color="#2d5a27" />
            <StatCard label="Needs Review" value={totalReview.toLocaleString()} color="#f59e0b" />
          </div>
          <CertaintyLegend />
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {clients.length === 0 ? (
          <EmptyState />
        ) : (
          clients.map((client, i) => (
            <ClientCard key={client.id} client={client} index={i} />
          ))
        )}
      </div>

      {clients.length > 0 && (
        <p style={{ fontSize: 12, color: '#a09a94', textAlign: 'center', marginTop: 16 }}>
          Predictions are computed from your actual close history. More closes = more accurate predictions.
        </p>
      )}
    </div>
  )
}
