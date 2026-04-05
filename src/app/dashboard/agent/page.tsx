'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AgentClient {
  id: string
  name: string
  entity: string
  status: 'idle' | 'running' | 'waiting' | 'scheduled'
  lastRun: string
  nextRun: string
  transactions: number
  exceptions: number
  agentEnabled: boolean
}

const INITIAL_CLIENTS: AgentClient[] = [
  { id: 'smith-2024', name: 'Smith Construction LLC', entity: '1120S', status: 'idle', lastRun: '2 hours ago', nextRun: 'Dec 1 at 11pm', transactions: 847, exceptions: 3, agentEnabled: true },
  { id: 'bella-2024', name: 'Bella Vista Restaurant', entity: '1065', status: 'running', lastRun: 'Running now...', nextRun: 'Continuous', transactions: 284, exceptions: 0, agentEnabled: true },
  { id: 'chen-2024', name: 'Chen Medical Practice', entity: '1040-S', status: 'waiting', lastRun: 'Yesterday', nextRun: 'Tonight 11pm', transactions: 412, exceptions: 7, agentEnabled: true },
  { id: 'techflow-2024', name: 'TechFlow Inc', entity: '1120', status: 'idle', lastRun: '3 days ago', nextRun: 'Dec 1', transactions: 156, exceptions: 0, agentEnabled: false },
  { id: 'greenvally-2024', name: 'Green Valley Farms', entity: '1065', status: 'scheduled', lastRun: '5 days ago', nextRun: 'Dec 1 at 11pm', transactions: 93, exceptions: 0, agentEnabled: false },
  { id: 'meridian-2024', name: 'Meridian Consulting', entity: '1120S', status: 'idle', lastRun: 'Never', nextRun: '—', transactions: 0, exceptions: 0, agentEnabled: false },
]

const STAT_TARGETS = [
  { label: 'Books Closed This Month', value: 34, suffix: '', color: '#2d5a27' },
  { label: 'Hours Saved', value: 272, suffix: '', color: '#2d5a27' },
  { label: 'Exceptions This Month', value: 47, suffix: '', color: '#f59e0b' },
  { label: 'Success Rate', value: 98.6, suffix: '%', color: '#2d5a27' },
]

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // cubic ease out
      setCount(eased * target)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return count
}

function StatTile({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  const count = useCountUp(value)
  const display = suffix === '%' ? count.toFixed(1) : Math.round(count).toString()

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e8e0d4',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {display}{suffix}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AgentClient['status'] }) {
  const configs = {
    running: { bg: '#dcfce7', color: '#166534', dotColor: '#16a34a', label: 'Running', pulse: true },
    idle: { bg: '#f3f4f6', color: '#6b7280', dotColor: '#9ca3af', label: 'Idle', pulse: false },
    waiting: { bg: '#fef3c7', color: '#92400e', dotColor: '#f59e0b', label: 'Waiting', pulse: true },
    scheduled: { bg: '#dbeafe', color: '#1e40af', dotColor: '#3b82f6', label: 'Scheduled', pulse: false },
  }
  const cfg = configs[status]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 10px',
      borderRadius: 20,
      backgroundColor: cfg.bg,
      color: cfg.color,
      fontSize: 12,
      fontWeight: 500,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: cfg.dotColor,
        display: 'inline-block',
        animation: cfg.pulse ? 'dotPulse 2s infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  )
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: enabled ? '#2d5a27' : '#e8e0d4',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
        boxShadow: hover ? '0 0 0 2px rgba(45,90,39,0.2)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: enabled ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

interface EnableModalProps {
  clientName: string
  onActivate: () => void
  onClose: () => void
}

function EnableModal({ clientName, onActivate, onClose }: EnableModalProps) {
  const [visible, setVisible] = useState([false, false, false])

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisible(v => [true, v[1], v[2]]), 100),
      setTimeout(() => setVisible(v => [v[0], true, v[2]]), 300),
      setTimeout(() => setVisible(v => [v[0], v[1], true]), 500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const checks = [
    'Bank connection verified',
    '14 months of history loaded',
    'Categorization rules trained (847 patterns)',
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 32,
          maxWidth: 440,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: 22,
          fontWeight: 400,
          color: '#1a1714',
          marginBottom: 8,
        }}>
          Activate Agent for {clientName}?
        </h2>
        <div style={{ marginBottom: 20 }}>
          {checks.map((check, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < checks.length - 1 ? '1px solid #f3f0eb' : 'none',
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
            >
              <span style={{ color: '#2d5a27', fontWeight: 700, fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 14, color: '#1a1714' }}>{check}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#6b6560', marginBottom: 24, lineHeight: 1.6 }}>
          Agent will categorize transactions nightly, email monthly reports, and escalate anything unusual.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: 10,
              border: '1px solid #e8e0d4',
              backgroundColor: '#fff',
              color: '#6b6560',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Not yet
          </button>
          <button
            onClick={onActivate}
            style={{
              flex: 2,
              padding: '11px 0',
              borderRadius: 10,
              border: 'none',
              backgroundColor: '#b8734a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Activate Agent
          </button>
        </div>
      </div>
    </div>
  )
}

function ClientRow({ client, onToggleClick, onRowClick }: {
  client: AgentClient
  onToggleClick: (id: string) => void
  onRowClick: (id: string) => void
}) {
  const [hover, setHover] = useState(false)

  const formatAmount = (n: number) =>
    n.toLocaleString('en-US', { useGrouping: true })

  return (
    <tr
      style={{
        cursor: 'pointer',
        boxShadow: hover ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        backgroundColor: hover ? '#faf8f4' : '#fff',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onRowClick(client.id)}
    >
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#1a1714', fontSize: 14 }}>{client.name}</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 20,
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            fontSize: 11,
            fontWeight: 500,
          }}>{client.entity}</span>
        </div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <StatusBadge status={client.status} />
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ fontSize: 12, color: '#6b6560' }}>{client.lastRun}</div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <div style={{ fontSize: 12, color: '#6b6560' }}>{client.nextRun}</div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <span style={{ fontSize: 13, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>
          {formatAmount(client.transactions)}
        </span>
      </td>
      <td style={{ padding: '14px 12px' }}>
        {client.exceptions > 0 ? (
          <span style={{
            padding: '2px 8px',
            borderRadius: 20,
            backgroundColor: '#fef3c7',
            color: '#92400e',
            fontSize: 12,
            fontWeight: 600,
          }}>{client.exceptions}</span>
        ) : (
          <span style={{ fontSize: 13, color: '#2d5a27', fontWeight: 600 }}>0</span>
        )}
      </td>
      <td style={{ padding: '14px 20px' }} onClick={e => e.stopPropagation()}>
        <Toggle
          enabled={client.agentEnabled}
          onToggle={() => onToggleClick(client.id)}
        />
      </td>
    </tr>
  )
}

export default function AgentPage() {
  const router = useRouter()
  const [clients, setClients] = useState<AgentClient[]>(INITIAL_CLIENTS)
  const [modalClientId, setModalClientId] = useState<string | null>(null)
  const [addBtnHover, setAddBtnHover] = useState(false)

  const modalClient = clients.find(c => c.id === modalClientId)

  const handleToggleClick = useCallback((id: string) => {
    const client = clients.find(c => c.id === id)
    if (!client) return
    if (!client.agentEnabled) {
      setModalClientId(id)
    } else {
      setClients(prev => prev.map(c => c.id === id ? { ...c, agentEnabled: false } : c))
    }
  }, [clients])

  const handleActivate = useCallback(() => {
    if (!modalClientId) return
    setClients(prev => prev.map(c =>
      c.id === modalClientId
        ? { ...c, agentEnabled: true, status: 'idle' as const }
        : c
    ))
    setModalClientId(null)
  }, [modalClientId])

  const handleRowClick = useCallback((id: string) => {
    router.push(`/dashboard/agent/${id}`)
  }, [router])

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      {/* Hero banner */}
      <div style={{
        backgroundColor: '#0f0e0d',
        padding: '32px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 28,
            fontWeight: 400,
            color: '#ffffff',
            margin: 0,
            marginBottom: 6,
          }}>Agent Mode</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
            Your autonomous accounting workforce
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#4ade80',
            display: 'inline-block',
            animation: 'heroPulse 2s infinite',
            flexShrink: 0,
          }} />
          <span style={{ color: '#4ade80', fontSize: 15, fontWeight: 600 }}>
            847 books closed · 0 errors
          </span>
        </div>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Top row: stats + button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, flex: 1, minWidth: 280 }}>
            {STAT_TARGETS.map(s => (
              <StatTile key={s.label} label={s.label} value={s.value} suffix={s.suffix} color={s.color} />
            ))}
          </div>
          <Link
            href="/dashboard/agent/new"
            onMouseEnter={() => setAddBtnHover(true)}
            onMouseLeave={() => setAddBtnHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '11px 20px',
              borderRadius: 10,
              backgroundColor: addBtnHover ? '#a0643d' : '#b8734a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s',
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          >
            + Add Client to Agent Mode
          </Link>
        </div>

        {/* Client table */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          border: '1px solid #e8e0d4',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8e0d4', backgroundColor: '#faf8f4' }}>
                {['Client', 'Status', 'Last Run', 'Next Run', 'Transactions', 'Exceptions', 'Agent Mode'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6b6560',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => (
                <tr key={client.id} style={{ borderTop: i > 0 ? '1px solid #f3f0eb' : 'none' }}>
                  <ClientRowCells client={client} onToggleClick={handleToggleClick} onRowClick={handleRowClick} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enable modal */}
      {modalClient && (
        <EnableModal
          clientName={modalClient.name}
          onActivate={handleActivate}
          onClose={() => setModalClientId(null)}
        />
      )}

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

function ClientRowCells({ client, onToggleClick, onRowClick }: {
  client: AgentClient
  onToggleClick: (id: string) => void
  onRowClick: (id: string) => void
}) {
  const [hover, setHover] = useState(false)

  const formatAmount = (n: number) =>
    n.toLocaleString('en-US', { useGrouping: true })

  const statusConfigs = {
    running: { bg: '#dcfce7', color: '#166534', dotColor: '#16a34a', label: 'Running', pulse: true },
    idle: { bg: '#f3f4f6', color: '#6b7280', dotColor: '#9ca3af', label: 'Idle', pulse: false },
    waiting: { bg: '#fef3c7', color: '#92400e', dotColor: '#f59e0b', label: 'Waiting', pulse: true },
    scheduled: { bg: '#dbeafe', color: '#1e40af', dotColor: '#3b82f6', label: 'Scheduled', pulse: false },
  }
  const cfg = statusConfigs[client.status]

  return (
    <>
      <td
        style={{ padding: '14px 20px', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onRowClick(client.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#1a1714', fontSize: 14 }}>{client.name}</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 20,
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            fontSize: 11,
            fontWeight: 500,
          }}>{client.entity}</span>
        </div>
      </td>
      <td
        style={{ padding: '14px 12px', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onRowClick(client.id)}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 20,
          backgroundColor: cfg.bg, color: cfg.color,
          fontSize: 12, fontWeight: 500,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dotColor,
            display: 'inline-block',
            animation: cfg.pulse ? 'dotPulse 2s infinite' : 'none',
          }} />
          {cfg.label}
        </span>
      </td>
      <td
        style={{ padding: '14px 12px', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onRowClick(client.id)}
      >
        <div style={{ fontSize: 12, color: '#6b6560' }}>{client.lastRun}</div>
      </td>
      <td
        style={{ padding: '14px 12px', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onRowClick(client.id)}
      >
        <div style={{ fontSize: 12, color: '#6b6560' }}>{client.nextRun}</div>
      </td>
      <td
        style={{ padding: '14px 12px', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onRowClick(client.id)}
      >
        <span style={{ fontSize: 13, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>
          {formatAmount(client.transactions)}
        </span>
      </td>
      <td
        style={{ padding: '14px 12px', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onRowClick(client.id)}
      >
        {client.exceptions > 0 ? (
          <span style={{
            padding: '2px 8px', borderRadius: 20,
            backgroundColor: '#fef3c7', color: '#92400e',
            fontSize: 12, fontWeight: 600,
          }}>{client.exceptions}</span>
        ) : (
          <span style={{ fontSize: 13, color: '#2d5a27', fontWeight: 600 }}>0</span>
        )}
      </td>
      <td style={{ padding: '14px 20px', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.15s' }}>
        <div
          onClick={(e) => { e.stopPropagation(); onToggleClick(client.id) }}
          style={{
            width: 40, height: 22, borderRadius: 11,
            backgroundColor: client.agentEnabled ? '#2d5a27' : '#e8e0d4',
            position: 'relative', cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: client.agentEnabled ? 21 : 3,
            width: 16, height: 16, borderRadius: '50%',
            backgroundColor: '#fff', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </td>
    </>
  )
}
