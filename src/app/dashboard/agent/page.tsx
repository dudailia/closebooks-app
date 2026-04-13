'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getJobs, getClients } from '@/lib/storage'
import { getAgentPrefs, saveAgentPrefs } from '@/lib/agentPrefsStore'
import type { CategorizationJob, Client } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  jobId?: string
}

// ─── Build agent clients from real storage ────────────────────────────────────

function buildAgentClients(jobs: CategorizationJob[], clients: Client[]): AgentClient[] {
  const prefs = getAgentPrefs()

  // Dedupe by client name — take the most recent job per client
  const byClient = new Map<string, CategorizationJob>()
  for (const job of jobs) {
    const existing = byClient.get(job.client_name)
    if (!existing || new Date(job.created_at) > new Date(existing.created_at)) {
      byClient.set(job.client_name, job)
    }
  }

  const result: AgentClient[] = []

  for (const [clientName, job] of Array.from(byClient.entries())) {
    const pref = prefs[clientName]
    const client = clients.find(c => c.business_name === clientName)

    // Determine entity type from client
    const entityHint = client?.accounting_software === 'Xero' ? 'Xero'
      : client?.industry === 'Restaurant' ? '1065'
      : client?.industry === 'Healthcare' ? '1040-S'
      : '1120S'

    // Count exceptions from flagged transactions
    const exceptions = job.transactions.filter((t: { status: string }) => t.status === 'flagged').length

    const lastRunRaw = pref?.lastRun ? new Date(pref.lastRun) : null
    const lastRun = lastRunRaw
      ? timeSince(lastRunRaw)
      : formatRelativeDate(new Date(job.created_at))

    result.push({
      id: clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      name: clientName,
      entity: entityHint,
      status: pref?.enabled ? 'idle' : 'idle',
      lastRun,
      nextRun: pref?.enabled ? nextMonthEnd() : '—',
      transactions: job.total_transactions,
      exceptions,
      agentEnabled: pref?.enabled ?? false,
      jobId: job.id,
    })
  }

  return result
}

function timeSince(d: Date): string {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatRelativeDate(d: Date): string {
  const diff = Date.now() - d.getTime()
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function nextMonthEnd(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1, 0)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Compute real stats from jobs ─────────────────────────────────────────────

interface AgentStats {
  booksClosed: number
  hoursSaved: number
  exceptions: number
  successRate: number
}

function computeStats(jobs: CategorizationJob[]): AgentStats {
  const completed = jobs.filter(j => j.status === 'completed')
  const allTx = jobs.flatMap(j => j.transactions)
  const exceptions = allTx.filter(t => t.status === 'flagged').length
  const approved = allTx.filter(t => t.status === 'approved' || t.status === 'edited').length
  const total = allTx.length
  const successRate = total > 0 ? Math.round(((total - exceptions) / total) * 100 * 10) / 10 : 100
  const hoursSaved = Math.round((approved * 2) / 60)

  return {
    booksClosed: completed.length,
    hoursSaved,
    exceptions,
    successRate,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)
  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * target)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
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
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{display}{suffix}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: AgentClient['status'] }) {
  const cfgs = {
    running:   { bg: '#dcfce7', color: '#166534', dotColor: '#16a34a', label: 'Running',   pulse: true  },
    idle:      { bg: '#f3f4f6', color: '#6b7280', dotColor: '#9ca3af', label: 'Idle',       pulse: false },
    waiting:   { bg: '#fef3c7', color: '#92400e', dotColor: '#f59e0b', label: 'Waiting',    pulse: true  },
    scheduled: { bg: '#dbeafe', color: '#1e40af', dotColor: '#3b82f6', label: 'Scheduled',  pulse: false },
  }
  const cfg = cfgs[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dotColor, display: 'inline-block', animation: cfg.pulse ? 'dotPulse 2s infinite' : 'none' }} />
      {cfg.label}
    </span>
  )
}

function EnableModal({ clientName, onActivate, onClose }: { clientName: string; onActivate: () => void; onClose: () => void }) {
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
    'Transaction history loaded from your close data',
    'Categorization patterns analyzed',
    'CloseBooks AI ready to run autonomously',
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 32, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 22, fontWeight: 400, color: '#1a1714', marginBottom: 8 }}>
          Activate Agent for {clientName}?
        </h2>
        <div style={{ marginBottom: 20 }}>
          {checks.map((check, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < checks.length - 1 ? '1px solid #f3f0eb' : 'none', opacity: visible[i] ? 1 : 0, transform: visible[i] ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.2s, transform 0.2s' }}>
              <span style={{ color: '#2d5a27', fontWeight: 700, fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 14, color: '#1a1714' }}>{check}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: '#6b6560', marginBottom: 24, lineHeight: 1.6 }}>
          Agent will run autopilot close on the 1st of each month, flag exceptions for your review, and email you a summary.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid #e8e0d4', backgroundColor: '#fff', color: '#6b6560', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Not yet</button>
          <button onClick={onActivate} style={{ flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', backgroundColor: '#b8734a', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Activate Agent</button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No clients yet</h3>
      <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 400, margin: '0 auto 24px' }}>
        Upload your first close to add clients to Agent Mode. Once you have transaction history, the agent can run automatically.
      </p>
      <Link href="/dashboard/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        + New Close
      </Link>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const router = useRouter()
  const [clients, setClients] = useState<AgentClient[]>([])
  const [stats, setStats] = useState<AgentStats>({ booksClosed: 0, hoursSaved: 0, exceptions: 0, successRate: 100 })
  const [modalClientId, setModalClientId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    const storedClients = getClients()
    const agentClients = buildAgentClients(jobs, storedClients)
    const computedStats = computeStats(jobs)
    setClients(agentClients)
    setStats(computedStats)
    setMounted(true)
  }, [])

  const modalClient = clients.find(c => c.id === modalClientId)

  const handleToggle = useCallback((id: string) => {
    const client = clients.find(c => c.id === id)
    if (!client) return
    if (!client.agentEnabled) {
      setModalClientId(id)
    } else {
      const prefs = loadAgentPrefs()
      prefs[client.name] = { enabled: false }
      saveAgentPrefs(prefs)
      setClients(prev => prev.map(c => c.id === id ? { ...c, agentEnabled: false, nextRun: '—' } : c))
    }
  }, [clients])

  const handleActivate = useCallback(() => {
    if (!modalClientId) return
    const client = clients.find(c => c.id === modalClientId)
    if (!client) return
    const prefs = loadAgentPrefs()
    prefs[client.name] = { enabled: true, lastRun: client.lastRun }
    saveAgentPrefs(prefs)
    setClients(prev => prev.map(c =>
      c.id === modalClientId
        ? { ...c, agentEnabled: true, status: 'scheduled' as const, nextRun: nextMonthEnd() }
        : c
    ))
    setStats(s => ({ ...s }))
    setModalClientId(null)
  }, [modalClientId, clients])

  const statTiles = [
    { label: 'Closes Completed', value: stats.booksClosed, suffix: '', color: '#2d5a27' },
    { label: 'Hours Saved (est.)', value: stats.hoursSaved, suffix: '', color: '#2d5a27' },
    { label: 'Items Flagged', value: stats.exceptions, suffix: '', color: '#f59e0b' },
    { label: 'Auto-Approve Rate', value: stats.successRate, suffix: '%', color: '#2d5a27' },
  ]

  const enabledCount = clients.filter(c => c.agentEnabled).length
  const totalTx = clients.reduce((s, c) => s + c.transactions, 0)

  if (!mounted) {
    return (
      <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#0f0e0d', padding: '32px 24px', height: 96 }} />
        <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ height: 120, backgroundColor: '#e8e0d4', borderRadius: 12, marginBottom: 24, animation: 'shimmer 1.5s infinite', background: 'linear-gradient(90deg, #f0ebe3 25%, #e8e0d4 50%, #f0ebe3 75%)', backgroundSize: '200% 100%' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ backgroundColor: '#0f0e0d', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 28, fontWeight: 400, color: '#ffffff', margin: 0, marginBottom: 6 }}>Agent Mode</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>Your autonomous accounting workforce</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {enabledCount > 0 ? (
            <>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block', animation: 'heroPulse 2s infinite', flexShrink: 0 }} />
              <span style={{ color: '#4ade80', fontSize: 15, fontWeight: 600 }}>
                {enabledCount} agent{enabledCount !== 1 ? 's' : ''} active · {totalTx.toLocaleString()} transactions on file
              </span>
            </>
          ) : (
            <span style={{ color: '#6b7280', fontSize: 14 }}>No agents active yet — enable one below</span>
          )}
        </div>
      </div>

      <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, flex: 1, minWidth: 280 }}>
            {statTiles.map(s => <StatTile key={s.label} {...s} />)}
          </div>
          <Link
            href="/dashboard/agent/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 10, backgroundColor: '#b8734a', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a0643d' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#b8734a' }}
          >
            + Add Client
          </Link>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e0d4', overflow: 'hidden' }}>
          {clients.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8e0d4', backgroundColor: '#faf8f4' }}>
                    {['Client', 'Status', 'Last Close', 'Next Run', 'Transactions', 'Flags', 'Agent'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b6560', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, i) => (
                    <ClientRow
                      key={client.id}
                      client={client}
                      isFirst={i === 0}
                      onToggle={() => handleToggle(client.id)}
                      onClick={() => router.push(`/dashboard/agent/${client.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {clients.length > 0 && (
          <p className="text-xs mt-3 text-center" style={{ color: '#a09a94' }}>
            Clients are loaded from your close history. Upload more closes to add more clients.
          </p>
        )}
      </div>

      {modalClient && (
        <EnableModal clientName={modalClient.name} onActivate={handleActivate} onClose={() => setModalClientId(null)} />
      )}

      <style>{`
        @keyframes heroPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes dotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}

function ClientRow({ client, isFirst, onToggle, onClick }: {
  client: AgentClient; isFirst: boolean; onToggle: () => void; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <tr
      style={{ borderTop: isFirst ? 'none' : '1px solid #f3f0eb', cursor: 'pointer', backgroundColor: hover ? '#faf8f4' : '#fff', transition: 'background-color 0.12s' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#1a1714', fontSize: 14 }}>{client.name}</span>
          <span style={{ padding: '2px 7px', borderRadius: 20, backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{client.entity}</span>
        </div>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <StatusBadge status={client.agentEnabled ? client.status : 'idle'} />
      </td>
      <td style={{ padding: '14px 12px' }}>
        <span style={{ fontSize: 12, color: '#6b6560' }}>{client.lastRun}</span>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <span style={{ fontSize: 12, color: client.agentEnabled ? '#1a1714' : '#a09a94' }}>{client.nextRun}</span>
      </td>
      <td style={{ padding: '14px 12px' }}>
        <span style={{ fontSize: 13, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>{client.transactions.toLocaleString()}</span>
      </td>
      <td style={{ padding: '14px 12px' }}>
        {client.exceptions > 0 ? (
          <span style={{ padding: '2px 8px', borderRadius: 20, backgroundColor: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600 }}>{client.exceptions}</span>
        ) : (
          <span style={{ fontSize: 13, color: '#2d5a27', fontWeight: 600 }}>0</span>
        )}
      </td>
      <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
        <div
          onClick={onToggle}
          style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: client.agentEnabled ? '#2d5a27' : '#e8e0d4', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}
        >
          <div style={{ position: 'absolute', top: 3, left: client.agentEnabled ? 21 : 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
      </td>
    </tr>
  )
}
