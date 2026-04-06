'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CategorizationJob } from '@/types'
import RadarClientCard from '@/components/RadarClientCard'
import { SkeletonBlock, StatsSkeleton, ClientCardsSkeleton } from '@/components/Skeleton'
import {
  calculateMonthlyBurn,
  calculateCashRunway,
  calculateArDays,
  detectStatus,
  generateSparkline,
  estimateCashBalance,
  generateSyntheticClientData,
} from '@/lib/radar/metricsCalculator'
import type { ClientMetrics } from '@/lib/radar/metricsCalculator'
import { draftRadarEmail } from '@/lib/radar/emailDrafter'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RadarClient {
  id: string
  name: string
  metrics: ClientMetrics
  sparkline: number[]
}

interface AlertModal {
  clientName: string
  subject: string
  body: string
  loading: boolean
  error: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Radar Page
// ─────────────────────────────────────────────────────────────────────────────

export default function RadarPage() {
  const router = useRouter()
  const [clients, setClients] = useState<RadarClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all')
  const [search, setSearch] = useState('')
  const [alertModal, setAlertModal] = useState<AlertModal | null>(null)

  // ── Load & compute ─────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      setIsLoading(true)
      let rows: RadarClient[] = []

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('closebooks_jobs')
          if (raw) {
            const jobs = JSON.parse(raw) as CategorizationJob[]
            const seen = new Set<string>()

            for (const job of jobs) {
              if (seen.has(job.client_name)) continue
              seen.add(job.client_name)

              const txns = job.transactions
              const cashBalance = Math.max(0, estimateCashBalance(txns))
              const monthlyBurn = calculateMonthlyBurn(txns)
              const arDays = calculateArDays(txns)
              const runwayDays = calculateCashRunway(cashBalance, monthlyBurn)
              const m: ClientMetrics = { cashBalance, monthlyBurn, arDays, runwayDays, status: 'green' }
              m.status = detectStatus(m)
              const sparkline = generateSparkline(txns, 6)

              rows.push({
                id: job.id,
                name: job.client_name,
                metrics: m,
                sparkline,
              })
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      // Supplement with demo clients if fewer than 6 real clients
      const demoNames = [
        'Apex Construction LLC',
        'Blue Harbor Restaurant',
        'Crestline Tech Solutions',
        'Dune Ridge Retail Co.',
        'Echo Valley Healthcare',
        'Fortis Legal Partners',
        'Greenway Logistics',
        'Harbor Street Cafe',
      ]

      const realNames = new Set(rows.map((r) => r.name))
      let demoIdx = 0

      while (rows.length < 6 && demoIdx < demoNames.length) {
        const name = demoNames[demoIdx]
        demoIdx++
        if (realNames.has(name)) continue
        const synthetic = generateSyntheticClientData(name, demoIdx * 13 + name.length)
        const m: ClientMetrics = {
          cashBalance: synthetic.cashBalance,
          monthlyBurn: synthetic.monthlyBurn,
          arDays: synthetic.arDays,
          runwayDays: synthetic.runwayDays,
          status: synthetic.status,
        }
        rows.push({
          id: `demo-${demoIdx}`,
          name,
          metrics: m,
          sparkline: synthetic.sparkline,
        })
      }

      // Sort: red → yellow → green, then by runway ascending
      rows.sort((a, b) => {
        const order = { red: 0, yellow: 1, green: 2 }
        const od = order[a.metrics.status] - order[b.metrics.status]
        if (od !== 0) return od
        return a.metrics.runwayDays - b.metrics.runwayDays
      })

      setClients(rows)
    } finally {
      setIsLoading(false)
      setMounted(true)
    }
  }, [])

  // ── Alert modal ────────────────────────────────────────────────────────────

  async function openAlertModal(client: RadarClient) {
    if (client.metrics.status === 'green') return

    setAlertModal({
      clientName: client.name,
      subject: '',
      body: '',
      loading: true,
      error: '',
    })

    try {
      const draft = await draftRadarEmail(
        client.name,
        client.metrics.status as 'yellow' | 'red',
        client.metrics
      )
      setAlertModal({
        clientName: client.name,
        subject: draft.subject,
        body: draft.body,
        loading: false,
        error: '',
      })
    } catch {
      setAlertModal((prev) =>
        prev
          ? { ...prev, loading: false, error: 'Failed to generate email draft.' }
          : null
      )
    }
  }

  async function copyAlertEmail() {
    if (!alertModal) return
    const text = `Subject: ${alertModal.subject}\n\n${alertModal.body}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback
    }
    setAlertModal(null)
  }

  // ── Filter + search ────────────────────────────────────────────────────────

  const displayed = clients.filter((c) => {
    const matchStatus = filter === 'all' || c.metrics.status === filter
    const matchSearch =
      search === '' || c.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const redCount = clients.filter((c) => c.metrics.status === 'red').length
  const yellowCount = clients.filter((c) => c.metrics.status === 'yellow').length
  const greenCount = clients.filter((c) => c.metrics.status === 'green').length

  // ─────────────────────────────────────────────────────────────────────────────

  if (!mounted) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={180} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={320} style={{ marginBottom: 32 }} />
      <StatsSkeleton count={3} />
      <ClientCardsSkeleton count={4} />
    </div>
  )

  return (
    <div className="page-content">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .radar-grid { animation: fadeIn 0.3s ease; }
      `}</style>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px' }}>📡</span>
              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: '#1a1714',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Financial Radar
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>
              Real-time financial health monitoring across all clients
            </p>
          </div>

          <Link
            href="/dashboard/radar/report"
            style={{
              backgroundColor: '#1a1714',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🗓 Weekly Report
          </Link>
        </div>

        {/* ── Status summary ── */}
        {!isLoading && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { key: 'all' as const, label: 'All Clients', count: clients.length, color: '#1a1714', bg: '#faf8f4' },
              { key: 'red' as const, label: 'At Risk', count: redCount, color: '#dc2626', bg: 'rgba(220,38,38,0.07)' },
              { key: 'yellow' as const, label: 'Caution', count: yellowCount, color: '#d97706', bg: 'rgba(217,119,6,0.07)' },
              { key: 'green' as const, label: 'Healthy', count: greenCount, color: '#2d5a27', bg: 'rgba(45,90,39,0.07)' },
            ].map((tile) => (
              <button
                key={tile.key}
                onClick={() => setFilter(tile.key)}
                style={{
                  flex: '1 1 120px',
                  backgroundColor: filter === tile.key ? tile.bg : '#ffffff',
                  border: `1.5px solid ${filter === tile.key ? tile.color : '#e8e0d4'}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: tile.color,
                    lineHeight: 1,
                    marginBottom: '2px',
                  }}
                >
                  {tile.count}
                </div>
                <div style={{ fontSize: '11px', color: '#6b6560', fontWeight: 600 }}>
                  {tile.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Search ── */}
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: '#6b6560',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              fontSize: '13px',
              border: '1px solid #e8e0d4',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              color: '#1a1714',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              gap: '16px',
              color: '#6b6560',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e8e0d4',
                borderTop: '3px solid #b8734a',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Loading radar data…
          </div>
        ) : displayed.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: '#6b6560',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1714' }}>
              No clients found
            </p>
            <p style={{ fontSize: '13px' }}>
              {search ? 'Try a different search term.' : 'No clients match the selected filter.'}
            </p>
          </div>
        ) : (
          <div
            className="radar-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {displayed.map((client) => (
              <RadarClientCard
                key={client.id}
                clientName={client.name}
                status={client.metrics.status}
                cashBalance={client.metrics.cashBalance}
                runwayDays={client.metrics.runwayDays}
                monthlyBurn={client.metrics.monthlyBurn}
                sparklineData={client.sparkline}
                onView={() =>
                  router.push(
                    `/dashboard/radar/${encodeURIComponent(client.name)}`
                  )
                }
                onSendAlert={() => openAlertModal(client)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Alert modal ── */}
      {alertModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(26,23,20,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setAlertModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1a1714',
                  margin: 0,
                }}
              >
                ✉ Alert Email — {alertModal.clientName}
              </h2>
              <button
                onClick={() => setAlertModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#6b6560',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            {alertModal.loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: '#6b6560',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '2px solid #e8e0d4',
                    borderTop: '2px solid #b8734a',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <span style={{ fontSize: '13px' }}>Generating AI email draft…</span>
              </div>
            ) : alertModal.error ? (
              <div
                style={{
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '13px',
                  color: '#dc2626',
                  textAlign: 'center',
                }}
              >
                {alertModal.error}
              </div>
            ) : (
              <>
                <div
                  style={{
                    backgroundColor: '#faf8f4',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: '#1a1714',
                  }}
                >
                  <span style={{ color: '#6b6560', marginRight: '6px' }}>Subject:</span>
                  {alertModal.subject}
                </div>
                <textarea
                  readOnly
                  value={alertModal.body}
                  rows={12}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#1a1714',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e8e0d4',
                    borderRadius: '10px',
                    padding: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setAlertModal(null)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e8e0d4',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1a1714',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={copyAlertEmail}
                    style={{
                      backgroundColor: '#b8734a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📋 Copy & Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
