'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getJobs } from '@/lib/storage'
import { getTaxReturnDrafts } from '@/lib/taxDraftsStore'
import type { CategorizationJob } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxReturn {
  id: string
  client: string
  formType: string
  taxYear: number
  status: 'draft' | 'review' | 'approved' | 'exported'
  opportunities: number
  opportunitySavings: number
  liability: number
  createdAt: string
}

function buildReturnsFromJobs(jobs: CategorizationJob[]): TaxReturn[] {
  const saved = getTaxReturnDrafts() as TaxReturn[]
  const savedIds = new Set(saved.map(r => r.id))

  // Build a return card for each job that doesn't already have one
  const fromJobs: TaxReturn[] = []
  const byClient = new Map<string, CategorizationJob>()
  for (const job of jobs) {
    const existing = byClient.get(job.client_name)
    if (!existing || new Date(job.created_at) > new Date(existing.created_at)) {
      byClient.set(job.client_name, job)
    }
  }

  for (const [, job] of Array.from(byClient.entries())) {
    const id = `taxreturn-${job.client_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
    if (savedIds.has(id)) continue

    const debits = job.transactions.filter((t: { type: string }) => t.type === 'debit')
    const credits = job.transactions.filter((t: { type: string }) => t.type === 'credit')
    const totalDebits = debits.reduce((s: number, t: { amount: number }) => s + t.amount, 0)
    const totalCredits = credits.reduce((s: number, t: { amount: number }) => s + t.amount, 0)
    const taxableIncome = Math.max(0, totalCredits - totalDebits)
    const estimatedLiability = Math.round(taxableIncome * 0.21)
    const opportunitySavings = Math.round(estimatedLiability * 0.12)

    fromJobs.push({
      id,
      client: job.client_name,
      formType: '1120S',
      taxYear: new Date(job.created_at).getFullYear(),
      status: 'draft',
      opportunities: opportunitySavings > 1000 ? 3 : 1,
      opportunitySavings,
      liability: estimatedLiability,
      createdAt: job.created_at.slice(0, 10),
    })
  }

  // Merge: saved returns first (user-created), then job-derived
  return [...saved, ...fromJobs]
}

const STATUS_CONFIG = {
  draft:    { label: 'Draft',        bg: '#fef3c7', color: '#92400e' },
  review:   { label: 'Under Review', bg: '#dbeafe', color: '#1e40af' },
  approved: { label: 'Approved',     bg: '#dcfce7', color: '#166534' },
  exported: { label: 'Exported',     bg: '#f3e8ff', color: '#6b21a8' },
}

const FORM_COLORS: Record<string, { bg: string; color: string }> = {
  '1120S':  { bg: '#e0f2fe', color: '#0369a1' },
  '1065':   { bg: '#f3e8ff', color: '#6b21a8' },
  '1040-S': { bg: '#fef3c7', color: '#92400e' },
  '1120':   { bg: '#dcfce7', color: '#166534' },
  '1041':   { bg: '#ffe4e6', color: '#9f1239' },
}

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaxDraftPage() {
  const [filter, setFilter] = useState<'all' | 'draft' | 'review' | 'approved'>('all')
  const [returns, setReturns] = useState<TaxReturn[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    setReturns(buildReturnsFromJobs(jobs))
    setMounted(true)
  }, [])

  const filtered = returns.filter(r => filter === 'all' || r.status === filter)
  const totalSavings = returns.reduce((s, r) => s + r.opportunitySavings, 0)
  const totalOpps = returns.reduce((s, r) => s + r.opportunities, 0)

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 28, fontWeight: 400, color: '#1a1714', marginBottom: 4, letterSpacing: '-0.02em',
            }}>TaxDraft AI</h1>
            <p style={{ color: '#6b6560', fontSize: 14 }}>Complete return preparation — not just assistance</p>
          </div>
          <Link
            href="/dashboard/tax-draft/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: '#b8734a', color: '#fff', padding: '10px 20px',
              borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Tax Return
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Returns', value: mounted ? String(returns.length) : '—' },
            { label: 'Opportunities Found', value: String(totalOpps), sub: fmt(totalSavings) + ' potential savings', color: '#2d5a27' },
            { label: 'Forms Supported', value: '5', sub: '1120 · 1120S · 1065 · 1040 · 1041' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, color: '#6b6560', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color ?? '#1a1714', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 12, color: '#2d5a27', marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, backgroundColor: '#f0ebe3', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['all', 'draft', 'review', 'approved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: filter === f ? 600 : 400,
                backgroundColor: filter === f ? '#fff' : 'transparent',
                color: filter === f ? '#1a1714' : '#6b6560',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? 'All Returns' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {mounted && returns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: '#fff', borderRadius: 14, border: '1px solid #e8e0d4' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', marginBottom: 8 }}>No tax returns yet</h3>
            <p style={{ fontSize: 14, color: '#6b6560', maxWidth: 360, margin: '0 auto 24px' }}>
              Upload a close first, then create a tax return from that client&apos;s data.
            </p>
            <Link href="/dashboard/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + New Close
            </Link>
          </div>
        )}

        {/* Returns grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(r => {
            const st = STATUS_CONFIG[r.status]
            const fc = FORM_COLORS[r.formType] ?? { bg: '#f3f4f6', color: '#374151' }
            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14,
                  padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', padding: '3px 8px',
                    borderRadius: 6, backgroundColor: fc.bg, color: fc.color,
                  }}>{r.formType}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px',
                    borderRadius: 20, backgroundColor: st.bg, color: st.color,
                  }}>{st.label}</span>
                </div>

                {/* Client */}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1714' }}>{r.client}</div>
                  <div style={{ fontSize: 13, color: '#6b6560' }}>Tax Year {r.taxYear}</div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ backgroundColor: '#f8f5f0', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: '#6b6560' }}>Tax Liability</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1714', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.liability)}</div>
                  </div>
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: '#6b6560' }}>Opportunities</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2d5a27', fontVariantNumeric: 'tabular-nums' }}>
                      {r.opportunities} · {fmt(r.opportunitySavings)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Link
                    href={`/dashboard/tax-draft/${r.id}`}
                    style={{
                      flex: 1, textAlign: 'center', padding: '8px 0',
                      backgroundColor: '#2d5a27', color: '#fff',
                      borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    View Draft →
                  </Link>
                  {r.opportunities > 0 && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 8, border: '1px solid #e8e0d4',
                      fontSize: 12, color: '#b8734a', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      ✦ {r.opportunities} opps
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
