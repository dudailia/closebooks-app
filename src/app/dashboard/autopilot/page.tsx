'use client'

import { useEffect, useState } from 'react'
import { getJobs } from '@/lib/storage'
import { getAutopilotPref, setAutopilotPref } from '@/lib/autopilotStore'
import Link from 'next/link'
import type { CategorizationJob } from '@/types'

// ─── Types ─────────────────────────────────────────────────────────────────

const LS_ENABLED      = 'cb_autopilot_enabled'
const LS_THRESHOLD    = 'cb_autopilot_threshold'

function readBool(key: string, fallback: boolean): boolean {
  const v = getAutopilotPref(key, '')
  return v === '' ? fallback : v === 'true'
}

function readInt(key: string, fallback: number): number {
  const v = getAutopilotPref(key, '')
  const n = parseInt(v, 10)
  return isNaN(n) ? fallback : n
}

interface ClientRow {
  id: string
  clientId: string
  clientName: string
  transactions: number
  status: 'pending' | 'completed' | 'in_progress'
  lastCloseDate: string | null
  exceptionsCount: number
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function buildClientRows(jobs: CategorizationJob[]): ClientRow[] {
  const byClient: Record<string, CategorizationJob[]> = {}
  for (const job of jobs) {
    const name = job.client_name || 'Unknown'
    if (!byClient[name]) byClient[name] = []
    byClient[name].push(job)
  }

  return Object.entries(byClient).map(([name, clientJobs]) => {
    const latest = clientJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    const totalTx = clientJobs.reduce((s, j) => s + j.total_transactions, 0)
    const hasCompleted = clientJobs.some(j => j.status === 'completed')

    return {
      id: latest.id,
      clientId: slugify(name),
      clientName: name,
      transactions: totalTx,
      status: latest.status === 'completed' ? 'completed' : hasCompleted ? 'in_progress' : 'pending',
      lastCloseDate: hasCompleted ? new Date(latest.created_at).toLocaleDateString('en-US') : null,
      exceptionsCount: latest.flagged || 0,
    }
  })
}

// ─── Toggle ────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 56, height: 30, borderRadius: 15,
        backgroundColor: checked ? '#2d5a27' : '#d1ccc5',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background-color 0.2s', flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 4,
        left: checked ? 30 : 4,
        width: 22, height: 22, borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ClientRow['status'] }) {
  const cfg = {
    pending:    { label: 'Pending', bg: '#f3f4f6', color: '#6b7280' },
    in_progress:{ label: 'In Progress', bg: '#fff7ed', color: '#c2410c' },
    completed:  { label: 'Closed', bg: '#e8f0e6', color: '#2d5a27' },
  }[status]

  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 9px',
      borderRadius: '999px', backgroundColor: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AutopilotPage() {
  const [mounted, setMounted] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [threshold, setThreshold] = useState(92)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ totalTx: 0, closes: 0, hoursSaved: 0 })

  useEffect(() => {
    const jobs = getJobs() as CategorizationJob[]
    setEnabled(readBool(LS_ENABLED, false))
    setThreshold(readInt(LS_THRESHOLD, 92))

    const rows = buildClientRows(jobs)
    setClients(rows)

    const completedJobs = jobs.filter(j => j.status === 'completed')
    const totalTx = jobs.reduce((s, j) => s + j.total_transactions, 0)
    const hoursSaved = parseFloat(((completedJobs.reduce((s, j) => s + j.auto_categorized, 0) * 2) / 60).toFixed(1))

    setStats({ totalTx, closes: completedJobs.length, hoursSaved })
    setMounted(true)
  }, [])

  function toggleEnabled(v: boolean) {
    setEnabled(v)
    setAutopilotPref(LS_ENABLED, String(v))
  }

  const pendingClients = clients.filter(c => c.status !== 'completed')
  const completedClients = clients.filter(c => c.status === 'completed')

  function handleRunAll() {
    const ids = new Set(pendingClients.map(c => c.clientId))
    setRunningIds(ids)
    // Navigate to bulk-close for actual processing
    window.location.href = '/dashboard/bulk-close'
  }

  if (!mounted) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ height: 32, width: 200, backgroundColor: '#f0ebe3', borderRadius: 8, marginBottom: 24 }} />
        <div style={{ height: 300, backgroundColor: '#f0ebe3', borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-8">

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px',
              backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '22px' }}>🚀</span>
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '28px', color: '#1a1714', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0,
              }}>
                AI Autopilot
              </h1>
              <p style={{ fontSize: '13px', color: '#6b6560', margin: '4px 0 0 0', maxWidth: 480 }}>
                Autonomous month-end close pipeline — 8 stages, minimal human intervention.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '13px', color: '#6b6560' }}>
              {enabled ? 'Autopilot ON' : 'Autopilot OFF'}
            </span>
            <Toggle checked={enabled} onChange={toggleEnabled} />
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Clients tracked', value: String(clients.length), accent: '#1a1714' },
            { label: 'Closes completed', value: String(stats.closes), accent: '#2d5a27' },
            { label: 'Hours saved', value: `${stats.hoursSaved}h`, accent: '#b8734a' },
          ].map(s => (
            <div key={s.label} style={{
              backgroundColor: '#ffffff', border: '1px solid #e8e0d4',
              borderRadius: '14px', padding: '18px 20px',
            }}>
              <p style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: '28px', color: s.accent, margin: '0 0 4px 0', lineHeight: 1,
              }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: '#6b6560', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Pending clients ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '16px', color: '#1a1714', margin: 0,
            }}>
              Ready to Close {pendingClients.length > 0 && `(${pendingClients.length})`}
            </h2>
            {pendingClients.length > 1 && (
              <button
                onClick={handleRunAll}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                  color: '#fff', backgroundColor: '#2d5a27',
                  border: 'none', borderRadius: '9px', cursor: 'pointer',
                }}
              >
                ▶ Run All ({pendingClients.length})
              </button>
            )}
          </div>

          {pendingClients.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: '14px',
            }}>
              <p style={{ fontSize: '36px', margin: '0 0 12px 0' }}>✅</p>
              <h3 style={{ fontSize: '16px', color: '#1a1714', margin: '0 0 8px 0' }}>All clients closed!</h3>
              <p style={{ fontSize: '13px', color: '#6b6560', margin: '0 0 20px 0' }}>
                No pending closes. Upload new data to start a close.
              </p>
              <Link
                href="/dashboard/upload"
                style={{
                  display: 'inline-block', padding: '10px 20px', borderRadius: '9px',
                  backgroundColor: '#2d5a27', color: '#fff', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Upload Statement
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingClients.map(client => (
                <div key={client.id} style={{
                  backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: '12px',
                  padding: '16px 20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '18px', flexShrink: 0,
                    }}>
                      🏢
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1714', margin: 0 }}>
                        {client.clientName}
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b6560', margin: '2px 0 0 0' }}>
                        {client.transactions.toLocaleString()} transactions
                        {client.exceptionsCount > 0 && ` · ${client.exceptionsCount} exceptions`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={client.status} />
                    <Link
                      href={`/dashboard/autopilot/${client.clientId}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', fontSize: '12px', fontWeight: 600,
                        color: '#fff', backgroundColor: '#2d5a27',
                        border: 'none', borderRadius: '8px', textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ▶ Run Close
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Completed clients ── */}
        {completedClients.length > 0 && (
          <div>
            <h2 style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '16px', color: '#1a1714', margin: '0 0 14px 0',
            }}>
              Recently Closed
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completedClients.map(client => (
                <div key={client.id} style={{
                  backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: '12px',
                  padding: '14px 20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '16px', color: '#2d5a27' }}>✓</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1714', margin: 0 }}>
                        {client.clientName}
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b6560', margin: '2px 0 0 0' }}>
                        {client.lastCloseDate ? `Closed ${client.lastCloseDate}` : 'Closed'} · {client.transactions.toLocaleString()} transactions
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status="completed" />
                    <Link
                      href={`/dashboard/autopilot/${client.clientId}`}
                      style={{ fontSize: '12px', color: '#b8734a', textDecoration: 'none', fontWeight: 600 }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Config ── */}
        <div style={{
          backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: '14px', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e0d4' }}>
            <h2 style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '15px', color: '#1a1714', margin: 0,
            }}>
              Autopilot Rules
            </h2>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1a1714' }}>
                  Auto-approve above <strong style={{ color: '#2d5a27' }}>{threshold}%</strong> confidence
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '11px', color: '#6b6560', width: 28 }}>85%</span>
                <input
                  type="range" min={85} max={99} step={1} value={threshold}
                  onChange={e => {
                    setThreshold(Number(e.target.value))
                    setAutopilotPref(LS_THRESHOLD, e.target.value)
                  }}
                  style={{ flex: 1, accentColor: '#2d5a27' }}
                />
                <span style={{ fontSize: '11px', color: '#6b6560', width: 28 }}>99%</span>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', backgroundColor: '#faf8f4', borderRadius: '9px', border: '1px solid #e8e0d4',
            }}>
              <Link
                href="/dashboard/bulk-close"
                style={{
                  fontSize: '13px', fontWeight: 600, color: '#b8734a', textDecoration: 'none',
                }}
              >
                → Go to Bulk Close
              </Link>
              <span style={{ fontSize: '12px', color: '#6b6560' }}>
                Run autopilot for all clients simultaneously
              </span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
