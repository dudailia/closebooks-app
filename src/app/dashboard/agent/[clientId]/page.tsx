'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AgentTerminal from '@/components/agent/AgentTerminal'

interface ExceptionCard {
  id: string
  description: string
  date: string
  amount: number
  agentSuggestion: string
  confidence: number
  reasoning: string
}

const SMITH_EXCEPTIONS: ExceptionCard[] = [
  { id: 'exc-1', description: 'AMZN*RT9K2 - Nov 14', date: 'Nov 14', amount: 247.00, agentSuggestion: 'Office Supplies', confidence: 0.68, reasoning: 'Amazon transaction pattern suggests office or supply purchase.' },
  { id: 'exc-2', description: 'Wire Transfer OUT - Nov 22', date: 'Nov 22', amount: 47200.00, agentSuggestion: 'Unknown payee', confidence: 0.12, reasoning: 'Large unusual wire transfer. No matching vendor in history.' },
  { id: 'exc-3', description: 'STRIPE REFUND - Nov 28', date: 'Nov 28', amount: -850.00, agentSuggestion: 'Revenue reversal', confidence: 0.81, reasoning: 'Stripe refund pattern matches revenue reversal.' },
]

const CATEGORIES = ['Office Supplies', 'Office Expenses', 'Cost of Goods Sold', 'Fixed Assets', 'Revenue', 'Payroll Expense', 'Software Subscriptions', 'Other']

const HISTORY_RUNS = [
  { date: 'Nov 30', status: 'complete', duration: '4m 05s', txns: 284 },
  { date: 'Nov 1', status: 'complete', duration: '3m 48s', txns: 301 },
  { date: 'Oct 1', status: 'complete', duration: '5m 12s', txns: 276 },
  { date: 'Sep 1', status: 'warning', duration: '4m 33s', txns: 312 },
  { date: 'Aug 1', status: 'complete', duration: '3m 59s', txns: 289 },
]

const CLIENT_DATA: Record<string, { name: string; entity: string; status: 'idle' | 'running' | 'waiting' | 'scheduled' }> = {
  'smith-2024': { name: 'Smith Construction LLC', entity: '1120S', status: 'idle' },
  'bella-2024': { name: 'Bella Vista Restaurant', entity: '1065', status: 'running' },
  'chen-2024': { name: 'Chen Medical Practice', entity: '1040-S', status: 'waiting' },
  'techflow-2024': { name: 'TechFlow Inc', entity: '1120', status: 'idle' },
  'greenvally-2024': { name: 'Green Valley Farms', entity: '1065', status: 'scheduled' },
  'meridian-2024': { name: 'Meridian Consulting', entity: '1120S', status: 'idle' },
}

const STATUS_CONFIGS = {
  running: { bg: '#dcfce7', color: '#166534', dotColor: '#16a34a', label: 'Running', pulse: true },
  idle: { bg: '#f3f4f6', color: '#6b7280', dotColor: '#9ca3af', label: 'Idle', pulse: false },
  waiting: { bg: '#fef3c7', color: '#92400e', dotColor: '#f59e0b', label: 'Waiting', pulse: true },
  scheduled: { bg: '#dbeafe', color: '#1e40af', dotColor: '#3b82f6', label: 'Scheduled', pulse: false },
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color = confidence >= 0.75 ? '#2d5a27' : confidence >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 11, color: '#6b6560', marginBottom: 3 }}>{pct}% confidence</div>
      <div style={{ height: 4, borderRadius: 2, backgroundColor: '#e8e0d4', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

export default function ClientAgentDetailPage() {
  const params = useParams()
  const clientId = typeof params.clientId === 'string' ? params.clientId : 'smith-2024'
  const client = CLIENT_DATA[clientId] ?? CLIENT_DATA['smith-2024']

  const [isLive, setIsLive] = useState(clientId === 'bella-2024')
  const [runBtnHover, setRunBtnHover] = useState(false)
  const [scheduleBtnHover, setScheduleBtnHover] = useState(false)
  const [expandedRun, setExpandedRun] = useState<number | null>(null)

  const exceptions = clientId === 'smith-2024' ? SMITH_EXCEPTIONS : []
  const [resolved, setResolved] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  const allResolved = exceptions.length > 0 && exceptions.every(e => resolved[e.id])

  const handleAccept = useCallback((id: string) => {
    setResolved(r => ({ ...r, [id]: true }))
    setEditingId(null)
  }, [])

  const statusCfg = STATUS_CONFIGS[client.status]

  async function handleRunNow() {
    await fetch('/api/agent/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    setIsLive(true)
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      {/* Back nav */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8e0d4', backgroundColor: '#fff' }}>
        <Link href="/dashboard/agent" style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          ← Agent Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 49px)', overflow: 'hidden' }}>
        {/* LEFT PANEL */}
        <div style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid #e8e0d4',
          backgroundColor: '#fff',
          overflowY: 'auto',
          padding: 20,
        }}>
          {/* Client name + badge */}
          <h2 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 18,
            fontWeight: 400,
            color: '#1a1714',
            marginBottom: 6,
          }}>{client.name}</h2>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 20,
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            fontSize: 11,
            fontWeight: 500,
            marginBottom: 14,
          }}>{client.entity}</span>

          {/* Status badge */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 20,
              backgroundColor: statusCfg.bg,
              color: statusCfg.color,
              fontSize: 13,
              fontWeight: 500,
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: statusCfg.dotColor,
                animation: statusCfg.pulse ? 'dotPulse 2s infinite' : 'none',
              }} />
              {statusCfg.label}
            </span>
          </div>

          {/* Stats */}
          <div style={{ marginBottom: 24 }}>
            {[
              { label: 'Total closes this month', value: '3' },
              { label: 'Total transactions', value: '847' },
              { label: 'Exception rate', value: '0.4%' },
              { label: 'Avg close time', value: '4m 12s' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Run history */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Run History</div>
            {HISTORY_RUNS.map((run, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedRun(expandedRun === i ? null : i)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 0',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f0eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1714' }}>{run.date}</div>
                    <div style={{ fontSize: 11, color: run.status === 'warning' ? '#f59e0b' : '#2d5a27', marginTop: 1 }}>
                      {run.status === 'complete' ? '✓ Complete' : '⚠ 3 exceptions'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
                    <div>{run.duration}</div>
                    <div>{run.txns} txns</div>
                  </div>
                </button>
                {expandedRun === i && (
                  <div style={{ padding: '8px 0 8px 8px', fontSize: 11, color: '#6b6560', borderBottom: '1px solid #f3f0eb' }}>
                    <div>09:02:14 — Connected to bank</div>
                    <div>09:02:18 — Fetched {run.txns} txns</div>
                    <div>09:03:45 — Categorization complete</div>
                    <div>09:04:01 — Reconciliation done</div>
                    <div>09:04:18 — Email sent</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Exceptions link */}
          <div style={{ marginTop: 20 }}>
            <Link href={`/dashboard/agent/${clientId}/exceptions`} style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e8e0d4',
              backgroundColor: '#faf8f4',
              color: '#b8734a',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
            }}>
              View All Exceptions →
            </Link>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 2 }}>Agent Log</h2>
              <p style={{ fontSize: 12, color: '#6b6560', margin: 0 }}>Last run: Nov 30 at 9:04am</p>
            </div>
          </div>

          <AgentTerminal clientId={clientId} isLive={isLive} />

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={handleRunNow}
              onMouseEnter={() => setRunBtnHover(true)}
              onMouseLeave={() => setRunBtnHover(false)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: runBtnHover ? '#1e3d1a' : '#2d5a27',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              Run Now
            </button>
            <button
              onMouseEnter={() => setScheduleBtnHover(true)}
              onMouseLeave={() => setScheduleBtnHover(false)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid #e8e0d4',
                backgroundColor: scheduleBtnHover ? '#faf8f4' : '#fff',
                color: '#1a1714',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              Schedule...
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          width: 280,
          flexShrink: 0,
          borderLeft: '1px solid #e8e0d4',
          backgroundColor: '#fff',
          overflowY: 'auto',
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1714', margin: 0 }}>Exception Queue</h3>
            {exceptions.length > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 20,
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: 12,
                fontWeight: 700,
              }}>{exceptions.filter(e => !resolved[e.id]).length}</span>
            )}
          </div>

          {allResolved ? (
            <div style={{
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: 10,
              padding: '14px 16px',
              textAlign: 'center',
              animation: 'slideIn 0.3s ease',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>✓</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>All exceptions resolved</div>
            </div>
          ) : exceptions.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
              No exceptions for this client
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exceptions.map(exc => {
                if (resolved[exc.id]) return null
                const isEditing = editingId === exc.id
                const amountStr = exc.amount < 0
                  ? `-$${Math.abs(exc.amount).toFixed(2)}`
                  : `$${exc.amount.toFixed(2)}`

                return (
                  <div key={exc.id} style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e8e0d4',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: 8,
                    padding: '12px 16px',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1714', marginBottom: 2 }}>{exc.description}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', marginBottom: 4 }}>{amountStr}</div>
                    <div style={{ fontSize: 12, color: '#6b6560', fontStyle: 'italic', marginBottom: 4 }}>
                      Agent: {overrides[exc.id] ?? exc.agentSuggestion}
                    </div>
                    <ConfidenceBar confidence={exc.confidence} />
                    {isEditing && (
                      <select
                        value={overrides[exc.id] ?? exc.agentSuggestion}
                        onChange={e => setOverrides(o => ({ ...o, [exc.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          marginTop: 8,
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid #e8e0d4',
                          fontSize: 12,
                          color: '#1a1714',
                          backgroundColor: '#fff',
                        }}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button
                        onClick={() => handleAccept(exc.id)}
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#2d5a27',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Accept {overrides[exc.id] ?? exc.agentSuggestion}
                      </button>
                      <button
                        onClick={() => setEditingId(isEditing ? null : exc.id)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid #e8e0d4',
                          backgroundColor: '#fff',
                          color: '#6b6560',
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
