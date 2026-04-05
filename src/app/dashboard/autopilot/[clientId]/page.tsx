'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Job {
  id?: string
  client?: string
  clientName?: string
  transactions?: Array<{ status?: string; confidence?: number }>
}

interface CompletedClose {
  id: string
  runId: string
  period: string
  completedAt: string
  transactions: number
  exceptions: number
  elapsedSeconds: number
  status: 'complete'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getClientData(clientId: string): { clientName: string; transactions: Job['transactions'] } {
  if (typeof window === 'undefined') return { clientName: clientId, transactions: [] }
  try {
    const raw = localStorage.getItem('closebooks_jobs') ?? localStorage.getItem('cb_jobs') ?? '[]'
    const jobs: Job[] = JSON.parse(raw)
    const job = jobs.find(j => {
      const name = j.clientName ?? j.client ?? ''
      return (
        name === clientId ||
        name.toLowerCase().replace(/\s+/g, '-') === clientId ||
        j.id === clientId
      )
    })
    return {
      clientName: job?.clientName ?? job?.client ?? decodeURIComponent(clientId),
      transactions: job?.transactions ?? [],
    }
  } catch {
    return { clientName: decodeURIComponent(clientId), transactions: [] }
  }
}

function getDemoCloses(clientId: string): CompletedClose[] {
  // Seed deterministic demo data from clientId
  const seed = clientId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const now = new Date()
  return [
    {
      id: `close_${seed}_1`,
      runId: `run_${seed}_1`,
      period: `${MONTHS[(now.getMonth() + 11) % 12]} ${now.getMonth() < 1 ? now.getFullYear() - 1 : now.getFullYear()}`,
      completedAt: new Date(now.getTime() - 32 * 24 * 3600 * 1000).toLocaleDateString('en-US'),
      transactions: 741 + (seed % 100),
      exceptions: 8 + (seed % 6),
      elapsedSeconds: 42 + (seed % 15),
      status: 'complete',
    },
    {
      id: `close_${seed}_2`,
      runId: `run_${seed}_2`,
      period: `${MONTHS[(now.getMonth() + 10) % 12]} ${now.getMonth() < 2 ? now.getFullYear() - 1 : now.getFullYear()}`,
      completedAt: new Date(now.getTime() - 63 * 24 * 3600 * 1000).toLocaleDateString('en-US'),
      transactions: 688 + (seed % 80),
      exceptions: 11 + (seed % 4),
      elapsedSeconds: 39 + (seed % 12),
      status: 'complete',
    },
    {
      id: `close_${seed}_3`,
      runId: `run_${seed}_3`,
      period: `${MONTHS[(now.getMonth() + 9) % 12]} ${now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear()}`,
      completedAt: new Date(now.getTime() - 94 * 24 * 3600 * 1000).toLocaleDateString('en-US'),
      transactions: 812 + (seed % 60),
      exceptions: 5 + (seed % 8),
      elapsedSeconds: 51 + (seed % 10),
      status: 'complete',
    },
  ]
}

// ─── CompletedCloseCard ───────────────────────────────────────────────────────

function CompletedCloseCard({ close, clientId }: { close: CompletedClose; clientId: string }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: '#e8f0e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '16px' }}>✓</span>
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1714', margin: '0 0 2px 0' }}>
            {close.period} Close
          </p>
          <p style={{ fontSize: '12px', color: '#6b6560', margin: 0 }}>
            {close.completedAt} · {close.transactions.toLocaleString()} txns · {close.exceptions} exceptions · {close.elapsedSeconds}s
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#2d5a27',
            backgroundColor: '#e8f0e6',
            padding: '3px 9px',
            borderRadius: '999px',
          }}
        >
          Complete
        </span>
        <Link
          href={`/dashboard/autopilot/close-report/${close.runId}`}
          style={{
            fontSize: '12px',
            color: '#b8734a',
            textDecoration: 'none',
            fontWeight: 600,
          }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >
          View Report →
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientAutopilotPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : (params.clientId ?? '')

  const now = new Date()
  const defaultMonth = `${MONTHS[(now.getMonth() + 11) % 12]} ${now.getMonth() < 1 ? now.getFullYear() - 1 : now.getFullYear()}`

  const [mounted, setMounted] = useState(false)
  const [clientName, setClientName] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(defaultMonth)
  const [closes, setCloses] = useState<CompletedClose[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const data = getClientData(clientId)
    setClientName(data.clientName)
    setCloses(getDemoCloses(clientId))
    setMounted(true)
  }, [clientId])

  // Build last 12 month options
  const monthOptions: string[] = []
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`)
  }

  function handleRunClose() {
    setRunning(true)
    setTimeout(() => {
      router.push(`/dashboard/autopilot/${clientId}/run`)
    }, 200)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10 space-y-8">

        {/* Back nav */}
        <button
          onClick={() => router.push('/dashboard/autopilot')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '13px',
            color: '#6b6560',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1a1714')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6b6560')}
        >
          ← AI Autopilot
        </button>

        {/* ── Client header ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '16px',
            padding: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: '#e8f0e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  🏢
                </div>
                <div>
                  <h1
                    style={{
                      fontFamily: '"DM Serif Display", Georgia, serif',
                      fontSize: '24px',
                      color: '#1a1714',
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}
                  >
                    {mounted ? clientName : '…'}
                  </h1>
                  <p style={{ fontSize: '13px', color: '#6b6560', margin: '2px 0 0 0' }}>
                    Month-End Close Autopilot
                  </p>
                </div>
              </div>
            </div>

            {/* Period selector + Run button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                style={{
                  padding: '9px 14px',
                  fontSize: '13px',
                  color: '#1a1714',
                  backgroundColor: '#faf8f4',
                  border: '1px solid #e8e0d4',
                  borderRadius: '9px',
                  cursor: 'pointer',
                }}
              >
                {monthOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <button
                onClick={handleRunClose}
                disabled={running}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: running ? '#6b9f65' : '#2d5a27',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: running ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 8px rgba(45,90,39,0.25)',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { if (!running) e.currentTarget.style.backgroundColor = '#234820' }}
                onMouseLeave={e => { if (!running) e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                {running ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Starting…
                  </>
                ) : (
                  <>▶ Run Month-End Close</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {[
            { label: 'Total closes run', value: '12' },
            { label: 'Avg exceptions', value: '8' },
            { label: 'Avg time', value: '47s' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid #e8e0d4' : 'none',
                padding: '0 20px',
              }}
            >
              <p
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: '26px',
                  color: '#2d5a27',
                  margin: '0 0 2px 0',
                  fontWeight: 700,
                }}
              >
                {stat.value}
              </p>
              <p style={{ fontSize: '12px', color: '#6b6560', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Bank connections ── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: '14px',
            padding: '20px 24px',
          }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '15px',
              color: '#1a1714',
              margin: '0 0 14px 0',
            }}
          >
            Bank Connections
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'Chase Business Checking', type: 'Checking', last4: '4821' },
              { name: 'Chase Business Credit Card', type: 'Credit Card', last4: '7293' },
            ].map(bank => (
              <div
                key={bank.last4}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#faf8f4',
                  border: '1px solid #e8e0d4',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      backgroundColor: '#114a8b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>C</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1714', margin: 0 }}>
                      {bank.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#6b6560', margin: '2px 0 0 0' }}>
                      {bank.type} ···· {bank.last4}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#2d5a27',
                    backgroundColor: '#e8f0e6',
                    padding: '4px 10px',
                    borderRadius: '999px',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#2d5a27',
                      display: 'inline-block',
                    }}
                  />
                  Connected
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Close history ── */}
        <div>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '15px',
              color: '#1a1714',
              margin: '0 0 12px 0',
            }}
          >
            Close History
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {closes.map(close => (
              <CompletedCloseCard key={close.id} close={close} clientId={clientId} />
            ))}
          </div>
        </div>

      </main>

      <AppFooter />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
