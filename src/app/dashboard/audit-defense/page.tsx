'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuditRiskBadge from '@/components/AuditRiskBadge'
import { getJobs } from '@/lib/storage'
import type { CategorizationJob } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveAudit {
  id: string
  client: string
  auditType: string
  auditTypeCode: string
  taxYear: number
  responseDueDays: number
  status: 'in-progress' | 'pending' | 'closed'
  description: string
  amountInQuestion: number
}

interface ClientReadiness {
  id: string
  name: string
  documentationScore: number
  missingDocs: number
  lastClose: string
  risk: 'low' | 'medium' | 'high' | 'critical'
  industry: string
}

const AUDITS_KEY = 'cb_active_audits'

function loadActiveAudits(): ActiveAudit[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(AUDITS_KEY) ?? '[]') } catch { return [] }
}

function computeReadiness(jobs: CategorizationJob[]): ClientReadiness[] {
  const byClient = new Map<string, CategorizationJob>()
  for (const job of jobs) {
    const existing = byClient.get(job.client_name)
    if (!existing || new Date(job.created_at) > new Date(existing.created_at)) {
      byClient.set(job.client_name, job)
    }
  }

  return Array.from(byClient.entries()).map(([name, job], i) => {
    const approvedPct = job.total_transactions > 0
      ? (job.approved / job.total_transactions) * 100
      : 0
    const flaggedPct = job.total_transactions > 0
      ? (job.flagged / job.total_transactions) * 100
      : 0

    // Documentation score based on how complete the close is
    const docScore = Math.min(99, Math.round(
      approvedPct * 0.7 +
      (job.auto_categorized / Math.max(1, job.total_transactions)) * 30
    ))

    const missingDocs = job.flagged

    const risk: ClientReadiness['risk'] =
      docScore >= 90 ? 'low'
      : docScore >= 75 ? 'medium'
      : docScore >= 60 ? 'high'
      : 'critical'

    return {
      id: `c${i + 1}`,
      name,
      documentationScore: docScore,
      missingDocs,
      lastClose: job.created_at.slice(0, 10),
      risk,
      industry: 'Business',
    }
  })
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          flex: 1, height: '8px', borderRadius: '4px',
          backgroundColor: '#e8e0d4', overflow: 'hidden', minWidth: '80px',
        }}
      >
        <div
          style={{
            height: '100%', width: `${score}%`,
            borderRadius: '4px', backgroundColor: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '32px' }}>
        {score}%
      </span>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function AuditStatusBadge({ status }: { status: ActiveAudit['status'] }) {
  const cfg = {
    'in-progress': { bg: '#fef9c3', text: '#854d0e', label: 'In Progress' },
    'pending':     { bg: '#dbeafe', text: '#1d4ed8', label: 'Pending Review' },
    'closed':      { bg: '#dcfce7', text: '#15803d', label: 'Closed' },
  }[status]

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '9999px',
        fontSize: '12px', fontWeight: 600,
        backgroundColor: cfg.bg, color: cfg.text,
      }}
    >
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: cfg.text }} />
      {cfg.label}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditDefensePage() {
  const [sortBy, setSortBy] = useState<'score' | 'risk' | 'name'>('score')
  const [clientReadiness, setClientReadiness] = useState<ClientReadiness[]>([])
  const [activeAudits, setActiveAudits] = useState<ActiveAudit[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    setClientReadiness(computeReadiness(jobs))
    setActiveAudits(loadActiveAudits())
    setMounted(true)
  }, [])

  const CLIENT_READINESS = clientReadiness
  const ACTIVE_AUDITS = activeAudits

  const sorted = [...CLIENT_READINESS].sort((a, b) => {
    if (sortBy === 'score') return a.documentationScore - b.documentationScore
    if (sortBy === 'risk') {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return riskOrder[a.risk] - riskOrder[b.risk]
    }
    return a.name.localeCompare(b.name)
  })

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a2e1a 0%, #2d5a27 50%, #3a6b33 100%)',
          borderRadius: '20px', padding: '40px 48px',
          marginBottom: '32px', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background shield pattern */}
        <div
          style={{
            position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)',
            opacity: 0.08,
          }}
        >
          <svg width="120" height="140" viewBox="0 0 24 24" fill="white">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div
            style={{
              width: '52px', height: '52px', borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              IRS Audit? We've got every document.
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
              Audit Defense Command Center — professional response packages built in minutes
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Active Audits', value: '1', icon: '⚡' },
            { label: 'Clients Monitored', value: CLIENT_READINESS.length.toString(), icon: '👥' },
            { label: 'High Risk', value: CLIENT_READINESS.filter(c => ['high','critical'].includes(c.risk)).length.toString(), icon: '⚠️' },
            { label: 'Fully Protected', value: CLIENT_READINESS.filter(c => c.risk === 'low').length.toString(), icon: '✓' },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                {stat.icon} {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Audits */}
      <section style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1714', margin: 0 }}>
            Active Audits
          </h2>
          <span
            style={{
              fontSize: '12px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '9999px', backgroundColor: '#fee2e2', color: '#991b1b',
            }}
          >
            {ACTIVE_AUDITS.length} Open
          </span>
        </div>

        {ACTIVE_AUDITS.map((audit) => (
          <div
            key={audit.id}
            style={{
              backgroundColor: '#ffffff', borderRadius: '16px',
              border: '1px solid #e8e0d4', padding: '24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1714', margin: 0 }}>
                    {audit.client}
                  </h3>
                  <AuditStatusBadge status={audit.status} />
                </div>

                <div
                  style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '16px', marginBottom: '14px',
                  }}
                >
                  {[
                    { label: 'Audit Type', value: audit.auditType },
                    { label: 'Tax Year', value: audit.taxYear.toString() },
                    { label: 'Amount in Question', value: fmt(audit.amountInQuestion) },
                    { label: 'Response Due', value: `${audit.responseDueDays} days` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: '11px', color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1714' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '13px', color: '#6b6560', lineHeight: 1.6, margin: 0 }}>
                  {audit.description}
                </p>
              </div>

              {/* Due timer */}
              <div
                style={{
                  backgroundColor: audit.responseDueDays < 14 ? '#fef2f2' : '#fffbeb',
                  borderRadius: '12px', padding: '16px 20px',
                  border: `1px solid ${audit.responseDueDays < 14 ? '#fca5a5' : '#fde68a'}`,
                  textAlign: 'center', flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: '36px', fontWeight: 900,
                    color: audit.responseDueDays < 14 ? '#dc2626' : '#d97706',
                  }}
                >
                  {audit.responseDueDays}
                </div>
                <div style={{ fontSize: '12px', color: '#6b6560', fontWeight: 600 }}>days remaining</div>
                <div style={{ fontSize: '11px', color: '#6b6560', marginTop: '4px' }}>to respond</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #f0ede8', flexWrap: 'wrap' }}>
              <Link
                href={`/dashboard/audit-defense/${audit.id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '10px',
                  fontWeight: 700, fontSize: '14px',
                  backgroundColor: '#b8734a', color: '#ffffff',
                  textDecoration: 'none',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                Generate Response Package
              </Link>
              <Link
                href={`/dashboard/audit-defense/${audit.id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 18px', borderRadius: '10px',
                  fontWeight: 600, fontSize: '14px',
                  border: '1px solid #e8e0d4', color: '#6b6560',
                  textDecoration: 'none', backgroundColor: 'transparent',
                }}
              >
                Open Workspace
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Audit Readiness */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1714', margin: 0 }}>
              Audit Readiness
            </h2>
            <p style={{ fontSize: '13px', color: '#6b6560', marginTop: '4px' }}>
              Documentation completeness and risk assessment for all clients
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#6b6560' }}>Sort by:</span>
            {(['score', 'risk', 'name'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                  border: '1px solid',
                  borderColor: sortBy === s ? '#2d5a27' : '#e8e0d4',
                  backgroundColor: sortBy === s ? '#e8f0e6' : 'transparent',
                  color: sortBy === s ? '#2d5a27' : '#6b6560',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff', borderRadius: '14px',
            border: '1px solid #e8e0d4', overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf8f4', borderBottom: '1px solid #e8e0d4' }}>
                  {['Client', 'Documentation', 'Missing Docs', 'Last Close', 'Audit Risk', ''].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: '12px', fontWeight: 700,
                        color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((client, idx) => (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom: idx < sorted.length - 1 ? '1px solid #f0ede8' : 'none',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1714' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b6560', marginTop: '2px' }}>
                        {client.industry}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: '180px' }}>
                      <ScoreBar score={client.documentationScore} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {client.missingDocs > 0 ? (
                        <span
                          style={{
                            fontSize: '13px', fontWeight: 700,
                            color: client.missingDocs > 3 ? '#dc2626' : '#d97706',
                          }}
                        >
                          {client.missingDocs} missing
                        </span>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                          ✓ Complete
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b6560', whiteSpace: 'nowrap' }}>
                      {client.lastClose}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <AuditRiskBadge risk={client.risk} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        style={{
                          padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                          border: '1px solid #e8e0d4', color: '#6b6560',
                          backgroundColor: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        View Docs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
