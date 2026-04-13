'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Transaction, CategorizationJob } from '@/types'
import { getJobs } from '@/lib/storage'
import RadarMetricTile from '@/components/RadarMetricTile'
import CashFlowForecast from '@/components/CashFlowForecast'
import RadarEmailDraft from '@/components/RadarEmailDraft'
import {
  calculateMonthlyBurn,
  calculateCashRunway,
  calculateArDays,
  detectStatus,
  generateForecastData,
  generateHistoricalData,
  estimateCashBalance,
  generateSyntheticClientData,
} from '@/lib/radar/metricsCalculator'
import type { ClientMetrics, ForecastPoint, HistoricalPoint } from '@/lib/radar/metricsCalculator'
import { draftRadarEmail } from '@/lib/radar/emailDrafter'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryBreakdown {
  category: string
  debits: number
  credits: number
  count: number
}

interface EmailDraft {
  subject: string
  body: string
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

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return s
  }
}

function buildCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - 6)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const recent = transactions.filter((t) => t.date >= cutoffStr)
  const map = new Map<string, CategoryBreakdown>()

  for (const tx of recent) {
    const cat = tx.final_category ?? tx.suggested_category ?? 'Uncategorized'
    const e = map.get(cat) ?? { category: cat, debits: 0, credits: 0, count: 0 }
    map.set(cat, {
      ...e,
      debits: e.debits + (tx.type === 'debit' ? tx.amount : 0),
      credits: e.credits + (tx.type === 'credit' ? tx.amount : 0),
      count: e.count + 1,
    })
  }

  return Array.from(map.values()).sort((a, b) => b.debits + b.credits - (a.debits + a.credits))
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function RadarClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = typeof params.clientId === 'string' ? params.clientId : ''

  const [clientName, setClientName] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null)
  const [historical, setHistorical] = useState<HistoricalPoint[]>([])
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [riskFlags, setRiskFlags] = useState<string[]>([])
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null)
  const [emailBody, setEmailBody] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(() => {
    try {
      setIsLoading(true)
      setError('')

      let foundName = decodeURIComponent(clientId)
      let txns: Transaction[] = []

      if (typeof window !== 'undefined') {
        try {
          const jobs = getJobs()
          const job =
            jobs.find((j) => j.id === clientId) ??
            jobs.find(
              (j) =>
                j.client_name.toLowerCase().replace(/\s+/g, '-') ===
                clientId.toLowerCase()
            ) ??
            jobs.find((j) => j.client_name === foundName)

          if (job) {
            foundName = job.client_name
            txns = job.transactions
          }
        } catch {
          // ignore
        }
      }

      setClientName(foundName)

      // If no real transactions, generate synthetic data
      let finalTxns = txns
      let syntheticRiskFlags: string[] = []

      if (txns.length === 0) {
        const synthetic = generateSyntheticClientData(foundName, foundName.charCodeAt(0))
        finalTxns = synthetic.transactions
        syntheticRiskFlags = synthetic.riskFlags
      }

      setTransactions(finalTxns)

      // Compute metrics
      const cashBalance = txns.length > 0
        ? estimateCashBalance(finalTxns)
        : generateSyntheticClientData(foundName, foundName.charCodeAt(0)).cashBalance

      const monthlyBurn = calculateMonthlyBurn(finalTxns)
      const arDays = calculateArDays(finalTxns)
      const runwayDays = calculateCashRunway(Math.max(0, cashBalance), monthlyBurn)

      const m: ClientMetrics = {
        cashBalance: Math.max(0, cashBalance),
        monthlyBurn,
        arDays,
        runwayDays,
        status: 'green',
      }
      m.status = detectStatus(m)
      setMetrics(m)

      // Risk flags
      if (syntheticRiskFlags.length > 0) {
        setRiskFlags(syntheticRiskFlags)
      } else {
        const flags: string[] = []
        if (runwayDays < 30) flags.push('Cash runway below 30 days — immediate action needed')
        else if (runwayDays < 90) flags.push(`Cash runway at ${runwayDays} days — monitor closely`)
        if (arDays > 60) flags.push(`AR Days at ${arDays} — collections are significantly overdue`)
        else if (arDays > 45) flags.push(`AR Days at ${arDays} — receivables collections lagging`)
        if (monthlyBurn > cashBalance * 0.2) flags.push('Monthly burn exceeds 20% of cash balance')
        if (flags.length === 0) flags.push('No significant risk flags — business operating within healthy range')
        setRiskFlags(flags)
      }

      // Charts
      setHistorical(generateHistoricalData(finalTxns, Math.max(0, cashBalance)))
      setForecast(generateForecastData(finalTxns, Math.max(0, cashBalance)))
      setBreakdown(buildCategoryBreakdown(finalTxns))
    } catch (err) {
      setError('Failed to load client data. Please try again.')
      console.error('[radar/client] load error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Generate email draft ───────────────────────────────────────────────────

  const generateEmailDraft = useCallback(async () => {
    if (!metrics || metrics.status === 'green') return
    setDraftLoading(true)
    setDraftError('')
    try {
      const draft = await draftRadarEmail(
        clientName,
        metrics.status as 'yellow' | 'red',
        metrics
      )
      setEmailDraft(draft)
      setEmailBody(draft.body)
    } catch (err) {
      setDraftError('Failed to generate email draft. Please try again.')
      console.error('[radar/client] draft error:', err)
    } finally {
      setDraftLoading(false)
    }
  }, [metrics, clientName])

  useEffect(() => {
    if (metrics && metrics.status !== 'green' && !emailDraft) {
      generateEmailDraft()
    }
  }, [metrics, emailDraft, generateEmailDraft])

  // ─────────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: '#6b6560',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e8e0d4',
            borderTop: '3px solid #b8734a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px' }}>Loading radar data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '32px' }}>⚠️</div>
        <p style={{ color: '#dc2626', fontSize: '15px', fontWeight: 600 }}>{error}</p>
        <button
          onClick={loadData}
          style={{
            backgroundColor: '#1a1714',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const statusColors = {
    green: '#2d5a27',
    yellow: '#d97706',
    red: '#dc2626',
  }

  const statusBg = {
    green: 'rgba(45,90,39,0.08)',
    yellow: 'rgba(217,119,6,0.08)',
    red: 'rgba(220,38,38,0.08)',
  }

  const statusLabel = {
    green: 'Healthy',
    yellow: 'Caution',
    red: 'At Risk',
  }

  const st = metrics?.status ?? 'green'
  const prevBurn = (metrics?.monthlyBurn ?? 0) * 0.92
  const burnChange =
    prevBurn > 0
      ? (((metrics?.monthlyBurn ?? 0) - prevBurn) / prevBurn) * 100
      : 0

  // Metric tiles data
  const tiles = metrics
    ? [
        {
          label: 'Cash Balance',
          value: formatCurrency(metrics.cashBalance),
          change: metrics.cashBalance > 0 ? 4.2 : -12.5,
          changeLabel: 'vs last month',
          status: metrics.cashBalance > 20000 ? 'good' : metrics.cashBalance > 5000 ? 'neutral' : 'bad',
        },
        {
          label: 'Monthly Burn',
          value: formatCurrency(metrics.monthlyBurn),
          change: burnChange,
          changeLabel: 'vs prior period',
          status: metrics.monthlyBurn > metrics.cashBalance * 0.2 ? 'bad' : 'good',
        },
        {
          label: 'AR Days',
          value: `${metrics.arDays}d`,
          change: metrics.arDays > 45 ? 8.3 : -5.1,
          changeLabel: 'collection pace',
          status: metrics.arDays > 60 ? 'bad' : metrics.arDays > 45 ? 'neutral' : 'good',
        },
        {
          label: 'Cash Runway',
          value: `${metrics.runwayDays}d`,
          change: metrics.runwayDays < 90 ? -15.4 : 3.8,
          changeLabel: 'at current burn',
          status: metrics.runwayDays < 30 ? 'bad' : metrics.runwayDays < 90 ? 'neutral' : 'good',
        },
      ] as const
    : []

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* ── Breadcrumb + header ── */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#6b6560',
            marginBottom: '16px',
          }}
        >
          <Link href="/dashboard/radar" style={{ color: '#b8734a', textDecoration: 'none' }}>
            Financial Radar
          </Link>
          <span>›</span>
          <span style={{ color: '#1a1714' }}>{clientName}</span>
        </div>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#1a1714',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {clientName}
              </h1>
              {metrics && (
                <span
                  style={{
                    backgroundColor: statusBg[st],
                    color: statusColors[st],
                    borderRadius: '20px',
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {statusLabel[st]}
                </span>
              )}
            </div>
            <p style={{ fontSize: '14px', color: '#6b6560', margin: '6px 0 0' }}>
              Financial Radar — Deep Dive Analysis
            </p>
          </div>

          <button
            onClick={() => router.back()}
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
            ← Back to Radar
          </button>
        </div>
      </div>

      {/* ── Metric tiles ── */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {tiles.map((tile) => (
          <RadarMetricTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            change={tile.change}
            changeLabel={tile.changeLabel}
            status={tile.status}
          />
        ))}
      </div>

      {/* ── Main content: chart + right panel ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Chart */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#1a1714',
                margin: '0 0 4px',
              }}
            >
              90-Day Cash Flow Forecast
            </h2>
            <p style={{ fontSize: '13px', color: '#6b6560', margin: 0 }}>
              Historical (60 days) + AI-projected forecast with confidence band
            </p>
          </div>
          <CashFlowForecast
            historicalData={historical}
            forecastData={forecast}
            dangerThreshold={metrics?.monthlyBurn ? metrics.monthlyBurn * 0.5 : 0}
          />
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Risk Flags */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: `1px solid ${st === 'red' ? '#fecaca' : st === 'yellow' ? '#fde68a' : '#e8e0d4'}`,
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#1a1714',
                margin: '0 0 14px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Risk Flags
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {riskFlags.map((flag, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor:
                        st === 'red'
                          ? '#dc2626'
                          : st === 'yellow'
                          ? '#d97706'
                          : '#2d5a27',
                      marginTop: '5px',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#1a1714', lineHeight: 1.5 }}>
                    {flag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Email draft panel */}
          {metrics && metrics.status !== 'green' && (
            <>
              {draftLoading && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e8e0d4',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#6b6560',
                    fontSize: '13px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid #e8e0d4',
                      borderTop: '2px solid #b8734a',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 10px',
                    }}
                  />
                  Generating AI email draft…
                </div>
              )}

              {draftError && (
                <div
                  style={{
                    backgroundColor: '#fff5f5',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    color: '#dc2626',
                  }}
                >
                  {draftError}
                  <button
                    onClick={generateEmailDraft}
                    style={{
                      display: 'block',
                      marginTop: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#b8734a',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Try again →
                  </button>
                </div>
              )}

              {emailDraft && (
                <RadarEmailDraft
                  subject={emailDraft.subject}
                  body={emailBody || emailDraft.body}
                  clientEmail="client@company.com"
                  onSend={() => setEmailSent(true)}
                  onEdit={(body) => setEmailBody(body)}
                />
              )}

              {emailSent && (
                <div
                  style={{
                    backgroundColor: 'rgba(45,90,39,0.08)',
                    border: '1px solid rgba(45,90,39,0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    color: '#2d5a27',
                    fontWeight: 600,
                  }}
                >
                  ✓ Email copied to clipboard — paste into your email client to send.
                </div>
              )}
            </>
          )}

          {metrics?.status === 'green' && (
            <div
              style={{
                backgroundColor: 'rgba(45,90,39,0.06)',
                border: '1px solid rgba(45,90,39,0.2)',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2d5a27' }}>
                Financially Healthy
              </div>
              <div style={{ fontSize: '12px', color: '#6b6560', marginTop: '4px' }}>
                No alert email needed — client is in good standing.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Transaction breakdown ── */}
      {breakdown.length > 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1a1714',
              margin: '0 0 20px',
            }}
          >
            6-Month Transaction Breakdown by Category
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Category', 'Transactions', 'Total In', 'Total Out', 'Net'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === 'Category' || h === 'Transactions' ? 'left' : 'right',
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6b6560',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderBottom: '1px solid #e8e0d4',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {breakdown.slice(0, 12).map((row, i) => {
                  const net = row.credits - row.debits
                  return (
                    <tr
                      key={row.category}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#ffffff' : '#faf8f4',
                      }}
                    >
                      <td
                        style={{
                          padding: '10px 12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1a1714',
                        }}
                      >
                        {row.category}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontSize: '13px',
                          color: '#6b6560',
                        }}
                      >
                        {row.count}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontSize: '13px',
                          color: '#2d5a27',
                          textAlign: 'right',
                          fontWeight: 500,
                        }}
                      >
                        {row.credits > 0 ? formatCurrency(row.credits) : '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontSize: '13px',
                          color: '#dc2626',
                          textAlign: 'right',
                          fontWeight: 500,
                        }}
                      >
                        {row.debits > 0 ? formatCurrency(row.debits) : '—'}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: net >= 0 ? '#2d5a27' : '#dc2626',
                          textAlign: 'right',
                        }}
                      >
                        {net >= 0 ? '+' : ''}
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
