'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CategorizationJob } from '@/types'
import { getJobs } from '@/lib/storage'
import {
  calculateMonthlyBurn,
  calculateCashRunway,
  calculateArDays,
  detectStatus,
  estimateCashBalance,
  generateSyntheticClientData,
} from '@/lib/radar/metricsCalculator'
import type { ClientMetrics } from '@/lib/radar/metricsCalculator'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string
  name: string
  metrics: ClientMetrics
  topFlag: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function getTopFlag(m: ClientMetrics): string {
  if (m.cashBalance <= 0) return 'Negative cash balance — immediate review needed'
  if (m.runwayDays < 30) return `Only ${m.runwayDays} days of cash runway remaining`
  if (m.arDays > 60) return `AR Days at ${m.arDays} — collections critically overdue`
  if (m.runwayDays < 90) return `Cash runway at ${m.runwayDays} days — below healthy threshold`
  if (m.arDays > 45) return `AR Days at ${m.arDays} — monitor receivables collections`
  return 'Within normal operating range'
}

const STATUS_CONFIG = {
  red: {
    label: 'At Risk',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: '#fecaca',
    order: 0,
  },
  yellow: {
    label: 'Caution',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
    border: '#fde68a',
    order: 1,
  },
  green: {
    label: 'Healthy',
    color: '#2d5a27',
    bg: 'rgba(45,90,39,0.08)',
    border: '#bbf7d0',
    order: 2,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Page
// ─────────────────────────────────────────────────────────────────────────────

export default function RadarReportPage() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reportDate] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  )

  useEffect(() => {
    try {
      setIsLoading(true)

      let rows: ClientRow[] = []

      if (typeof window !== 'undefined') {
        try {
          const jobs = getJobs()
          if (jobs.length > 0) {
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

              rows.push({
                id: job.id,
                name: job.client_name,
                metrics: m,
                topFlag: getTopFlag(m),
              })
            }
          }
        } catch {
          // ignore
        }
      }

      // If no real clients, generate demo roster
      if (rows.length === 0) {
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

        rows = demoNames.map((name, i) => {
          const synthetic = generateSyntheticClientData(name, i * 17 + name.length)
          const m: ClientMetrics = {
            cashBalance: synthetic.cashBalance,
            monthlyBurn: synthetic.monthlyBurn,
            arDays: synthetic.arDays,
            runwayDays: synthetic.runwayDays,
            status: synthetic.status,
          }
          return {
            id: `demo-${i}`,
            name,
            metrics: m,
            topFlag: synthetic.riskFlags[0] ?? getTopFlag(m),
          }
        })
      }

      // Sort: red first, then yellow, then green; within each group by runway asc
      rows.sort((a, b) => {
        const orderDiff =
          STATUS_CONFIG[a.metrics.status].order -
          STATUS_CONFIG[b.metrics.status].order
        if (orderDiff !== 0) return orderDiff
        return a.metrics.runwayDays - b.metrics.runwayDays
      })

      setClients(rows)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Counts ─────────────────────────────────────────────────────────────────

  const redCount = clients.filter((c) => c.metrics.status === 'red').length
  const yellowCount = clients.filter((c) => c.metrics.status === 'yellow').length
  const greenCount = clients.filter((c) => c.metrics.status === 'green').length

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-container { padding: 20px !important; max-width: 100% !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div
        className="report-container"
        style={{
          maxWidth: '960px',
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
            paddingBottom: '24px',
            borderBottom: '2px solid #e8e0d4',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#b8734a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#fff',
                }}
              >
                📡
              </span>
              <div>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#1a1714',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Financial Radar — Weekly Report
                </h1>
                <p style={{ fontSize: '13px', color: '#6b6560', margin: '2px 0 0' }}>
                  {reportDate}
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#6b6560', margin: 0, maxWidth: '480px' }}>
              All clients sorted by financial health status. Red clients require immediate attention.
              Print or share this report with your team.
            </p>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/radar"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e8e0d4',
                borderRadius: '10px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1a1714',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ← Radar
            </Link>
            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: '#1a1714',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨 Print Report
            </button>
          </div>
        </div>

        {/* ── Summary tiles ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Clients', value: clients.length, color: '#1a1714', bg: '#faf8f4' },
            { label: 'At Risk', value: redCount, color: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
            { label: 'Caution', value: yellowCount, color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
            { label: 'Healthy', value: greenCount, color: '#2d5a27', bg: 'rgba(45,90,39,0.06)' },
          ].map((tile) => (
            <div
              key={tile.label}
              style={{
                flex: '1 1 120px',
                backgroundColor: tile.bg,
                border: '1px solid #e8e0d4',
                borderRadius: '14px',
                padding: '16px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: tile.color,
                  lineHeight: 1,
                  marginBottom: '4px',
                }}
              >
                {tile.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6b6560', fontWeight: 600 }}>
                {tile.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Client table ── */}
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px',
              color: '#6b6560',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                border: '2px solid #e8e0d4',
                borderTop: '2px solid #b8734a',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Loading client data…
          </div>
        ) : (
          <>
            {/* Red section */}
            {redCount > 0 && (
              <ReportSection
                title="At Risk Clients"
                subtitle="Require immediate attention"
                status="red"
                clients={clients.filter((c) => c.metrics.status === 'red')}
              />
            )}

            {/* Yellow section */}
            {yellowCount > 0 && (
              <ReportSection
                title="Caution Clients"
                subtitle="Monitor closely — proactive outreach recommended"
                status="yellow"
                clients={clients.filter((c) => c.metrics.status === 'yellow')}
              />
            )}

            {/* Green section */}
            {greenCount > 0 && (
              <ReportSection
                title="Healthy Clients"
                subtitle="Operating within normal range"
                status="green"
                clients={clients.filter((c) => c.metrics.status === 'green')}
              />
            )}
          </>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            paddingTop: '24px',
            borderTop: '1px solid #e8e0d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b6560' }}>
            Generated by CloseBooks Financial Radar · {reportDate}
          </span>
          <span style={{ fontSize: '12px', color: '#6b6560' }}>
            Metrics based on transaction data in CloseBooks
          </span>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportSection
// ─────────────────────────────────────────────────────────────────────────────

function ReportSection({
  title,
  subtitle,
  status,
  clients,
}: {
  title: string
  subtitle: string
  status: 'red' | 'yellow' | 'green'
  clients: ClientRow[]
}) {
  const cfg = STATUS_CONFIG[status]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: cfg.color,
            flexShrink: 0,
          }}
        />
        <div>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#1a1714',
              margin: 0,
            }}
          >
            {title}
            <span
              style={{
                marginLeft: '8px',
                fontSize: '12px',
                fontWeight: 700,
                color: cfg.color,
                backgroundColor: cfg.bg,
                borderRadius: '20px',
                padding: '2px 8px',
              }}
            >
              {clients.length}
            </span>
          </h2>
          <p style={{ fontSize: '12px', color: '#6b6560', margin: '2px 0 0' }}>
            {subtitle}
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${cfg.border}`,
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf8f4' }}>
              {[
                'Client',
                'Cash Balance',
                'Monthly Burn',
                'AR Days',
                'Runway',
                'Primary Flag',
                '',
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '10px 14px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#6b6560',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textAlign: i === 0 || i === 5 ? 'left' : 'right',
                    borderBottom: '1px solid #e8e0d4',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => (
              <tr
                key={client.id}
                style={{
                  backgroundColor: i % 2 === 0 ? '#ffffff' : '#fdfbf9',
                  borderBottom:
                    i < clients.length - 1 ? '1px solid #f0ebe3' : 'none',
                }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1714' }}>
                    {client.name}
                  </div>
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1a1714',
                  }}
                >
                  {formatCurrency(client.metrics.cashBalance)}
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    color:
                      client.metrics.monthlyBurn > client.metrics.cashBalance * 0.2
                        ? '#dc2626'
                        : '#1a1714',
                    fontWeight: 500,
                  }}
                >
                  {formatCurrency(client.metrics.monthlyBurn)}
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    color:
                      client.metrics.arDays > 60
                        ? '#dc2626'
                        : client.metrics.arDays > 45
                        ? '#d97706'
                        : '#2d5a27',
                    fontWeight: 600,
                  }}
                >
                  {client.metrics.arDays}d
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    textAlign: 'right',
                    fontSize: '13px',
                    color:
                      client.metrics.runwayDays < 30
                        ? '#dc2626'
                        : client.metrics.runwayDays < 90
                        ? '#d97706'
                        : '#2d5a27',
                    fontWeight: 700,
                  }}
                >
                  {client.metrics.runwayDays}d
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: '#6b6560',
                    maxWidth: '240px',
                  }}
                >
                  {client.topFlag}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <Link
                    href={`/dashboard/radar/${encodeURIComponent(client.name)}`}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#b8734a',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Deep Dive →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
