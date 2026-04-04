'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import { getJobs } from '@/lib/storage'
import type { CategorizationJob, Transaction } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Data derivation helpers
// ─────────────────────────────────────────────────────────────────────────────

interface Analytics {
  totalClients: number
  totalJobs: number
  totalTransactions: number
  autoApproved: number
  avgConfidence: number | null
  hoursSaved: number
  moneySaved: number
  monthlyVolume: { label: string; count: number }[]
  confidenceBuckets: { label: string; count: number; pct: number; color: string }[]
  topCategories: { name: string; count: number; amount: number }[]
  recentActivity: { date: string; client: string; count: number; auto: number }[]
}

function deriveAnalytics(jobs: CategorizationJob[]): Analytics {
  const allTx: Transaction[] = jobs.flatMap((j) => j.transactions)
  const totalTransactions    = allTx.length
  const autoApproved         = allTx.filter((t) => t.status === 'approved' && t.confidence >= 0.85).length
  const uniqueClients        = new Set(jobs.map((j) => j.client_name.toLowerCase())).size

  // Avg confidence (only transactions with a real confidence value)
  const withConf = allTx.filter((t) => t.confidence > 0)
  const avgConf  = withConf.length > 0
    ? withConf.reduce((s, t) => s + t.confidence, 0) / withConf.length
    : null

  // Time / money saved (2 min per tx, $50/hr bookkeeper rate)
  const hoursSaved  = (totalTransactions * 2) / 60
  const moneySaved  = hoursSaved * 50

  // Monthly volume — last 6 months
  const now = new Date()
  const months: { label: string; key: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count: 0,
    })
  }
  for (const job of jobs) {
    const key = job.created_at.slice(0, 7) // "YYYY-MM"
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.count += job.total_transactions
  }

  // Confidence distribution
  const high   = withConf.filter((t) => t.confidence >= 0.90).length
  const mid    = withConf.filter((t) => t.confidence >= 0.75 && t.confidence < 0.90).length
  const low    = withConf.filter((t) => t.confidence < 0.75).length
  const total  = withConf.length || 1
  const confidenceBuckets = [
    { label: '90%+ · Auto-approved', count: high,  pct: Math.round(high  / total * 100), color: '#059669' },
    { label: '75–90% · Reviewed',    count: mid,   pct: Math.round(mid   / total * 100), color: '#d97706' },
    { label: 'Below 75% · Flagged',  count: low,   pct: Math.round(low   / total * 100), color: '#dc2626' },
  ]

  // Top categories
  const catMap = new Map<string, { count: number; amount: number }>()
  for (const tx of allTx) {
    const cat = tx.final_category ?? tx.suggested_category
    if (!cat) continue
    const e = catMap.get(cat) ?? { count: 0, amount: 0 }
    catMap.set(cat, { count: e.count + 1, amount: e.amount + tx.amount })
  }
  const topCategories = Array.from(catMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Recent activity (last 8 jobs)
  const recentActivity = jobs.slice(0, 8).map((j) => ({
    date:   j.created_at,
    client: j.client_name,
    count:  j.total_transactions,
    auto:   j.auto_categorized,
  }))

  return {
    totalClients: uniqueClients,
    totalJobs: jobs.length,
    totalTransactions,
    autoApproved,
    avgConfidence: avgConf,
    hoursSaved,
    moneySaved,
    monthlyVolume: months,
    confidenceBuckets,
    topCategories,
    recentActivity,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.14em] uppercase mb-1" style={{ color: '#b8734a' }}>
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero stat card
// ─────────────────────────────────────────────────────────────────────────────

function HeroStat({
  value, label, sub, accent = false, large = false,
}: {
  value: string; label: string; sub?: string; accent?: boolean; large?: boolean
}) {
  return (
    <div
      className="rounded-2xl border px-5 py-5 flex flex-col gap-1"
      style={{
        borderColor: accent ? '#c4d9c0' : '#e0dbd4',
        backgroundColor: accent ? '#f0f5ef' : '#ffffff',
      }}
    >
      <p
        className="font-semibold leading-none tabular-nums"
        style={{
          fontSize: large ? '2.6rem' : '2rem',
          letterSpacing: '-0.03em',
          color: accent ? '#2d5a27' : '#1a1714',
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        }}
      >
        {value}
      </p>
      <p className="text-sm font-medium mt-0.5" style={{ color: '#1a1714' }}>{label}</p>
      {sub && <p className="text-xs" style={{ color: '#a09a94' }}>{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bar chart (CSS only, no library)
// ─────────────────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => {
        const heightPct = d.count > 0 ? Math.max((d.count / max) * 100, 4) : 0
        const isEmpty   = d.count === 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            {/* Value label */}
            <span
              className="text-xs font-mono font-semibold transition-all"
              style={{ color: isEmpty ? '#e0dbd4' : '#1a1714', minHeight: 16 }}
            >
              {d.count > 0 ? d.count.toLocaleString() : ''}
            </span>
            {/* Bar */}
            <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isEmpty ? '#f0ece4' : '#2d5a27',
                  transition: 'height 0.6s ease',
                  minHeight: isEmpty ? 4 : undefined,
                }}
              />
            </div>
            {/* Month label */}
            <span className="text-xs text-center" style={{ color: '#a09a94' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence distribution
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceChart({ buckets }: { buckets: Analytics['confidenceBuckets'] }) {
  return (
    <div className="space-y-3">
      {buckets.map((b) => (
        <div key={b.label}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm" style={{ color: '#1a1714' }}>{b.label}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold" style={{ color: b.color }}>
                {b.count.toLocaleString()}
              </span>
              <span className="text-xs w-8 text-right tabular-nums" style={{ color: '#a09a94' }}>
                {b.pct}%
              </span>
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${b.pct}%`, backgroundColor: b.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Top categories table
// ─────────────────────────────────────────────────────────────────────────────

function CategoryTable({ categories }: { categories: Analytics['topCategories'] }) {
  const max = categories[0]?.count ?? 1
  return (
    <div className="space-y-0 divide-y" style={{ borderColor: '#f5f0ea' }}>
      {categories.map((cat, i) => {
        const pct = Math.round((cat.count / max) * 100)
        return (
          <div key={cat.name} className="flex items-center gap-3 py-3">
            <span className="text-xs font-mono w-5 text-right shrink-0" style={{ color: '#c4bdb8' }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate" style={{ color: '#1a1714' }}>{cat.name}</span>
                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <span className="text-xs tabular-nums" style={{ color: '#6b6560' }}>
                    {cat.count} tx
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: '#2d5a27', minWidth: 72, textAlign: 'right' }}>
                    ${cat.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#2d5a27' : i < 3 ? '#4a8c42' : '#a0bfa0' }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent activity feed
// ─────────────────────────────────────────────────────────────────────────────

function ActivityFeed({ activity }: { activity: Analytics['recentActivity'] }) {
  return (
    <div className="space-y-2">
      {activity.map((a, i) => {
        const autoRate = a.count > 0 ? Math.round((a.auto / a.count) * 100) : 0
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: i % 2 === 0 ? '#faf8f4' : '#ffffff' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
            >
              {a.client.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1a1714' }}>{a.client}</p>
              <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
                {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-mono font-semibold" style={{ color: '#1a1714' }}>{a.count}</p>
              <p className="text-xs" style={{ color: '#a09a94' }}>tx</p>
            </div>
            <div
              className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
              style={{
                backgroundColor: autoRate >= 85 ? '#ecfdf5' : autoRate >= 70 ? '#fef9c3' : '#fef2f2',
                color:           autoRate >= 85 ? '#065f46' : autoRate >= 70 ? '#854d0e' : '#991b1b',
              }}
            >
              {autoRate}% auto
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-2xl border-2 border-dashed px-8 py-20 text-center"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4 opacity-40">
        <rect x="4" y="28" width="8" height="16" rx="2" stroke="#b8734a" strokeWidth="1.8" fill="none" />
        <rect x="16" y="18" width="8" height="26" rx="2" stroke="#b8734a" strokeWidth="1.8" fill="none" />
        <rect x="28" y="10" width="8" height="34" rx="2" stroke="#b8734a" strokeWidth="1.8" fill="none" />
        <rect x="40" y="20" width="5" height="24" rx="2" stroke="#b8734a" strokeWidth="1.8" fill="none" />
        <path d="M4 8h40" stroke="#b8734a" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
      <p
        className="text-xl"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}
      >
        No data yet
      </p>
      <p className="text-sm mt-2 mb-6" style={{ color: '#6b6560' }}>
        Complete a few closes and your analytics will appear here automatically.
      </p>
      <Link
        href="/dashboard/upload"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ backgroundColor: '#2d5a27' }}
      >
        Start your first close
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    const jobs = getJobs()
    setAnalytics(deriveAnalytics(jobs))
    setMounted(true)
  }, [])

  const isEmpty = mounted && analytics?.totalTransactions === 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-10 page-enter">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-xs transition-colors" style={{ color: '#b8734a' }}>
              ← Dashboard
            </Link>
            <h1
              className="text-3xl mt-1"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
                letterSpacing: '-0.02em',
              }}
            >
              Analytics
            </h1>
            <p className="text-sm mt-1" style={{ color: '#a09a94' }}>
              Firm-wide performance across all clients and closes.
            </p>
          </div>
        </div>

        {/* ── Loading skeleton ────────────────────────────────────────────── */}
        {!mounted && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0,1,2,3].map((i) => (
              <div key={i} className="rounded-2xl border px-5 py-5 animate-pulse h-28" style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }} />
            ))}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {isEmpty && <EmptyState />}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {mounted && !isEmpty && analytics && (
          <>
            {/* ── Hero stats ──────────────────────────────────────────────── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <HeroStat
                value={analytics.totalClients.toString()}
                label="Clients"
                sub={`${analytics.totalJobs} total closes`}
              />
              <HeroStat
                value={analytics.totalTransactions.toLocaleString()}
                label="Transactions Processed"
                sub={`${analytics.autoApproved.toLocaleString()} auto-approved`}
              />
              <HeroStat
                value={analytics.avgConfidence !== null ? `${Math.round(analytics.avgConfidence * 100)}%` : '—'}
                label="Avg AI Confidence"
                sub={analytics.avgConfidence !== null
                  ? analytics.avgConfidence >= 0.85 ? 'Excellent accuracy'
                  : analytics.avgConfidence >= 0.70 ? 'Good accuracy'
                  : 'Room to improve'
                  : 'No data yet'}
              />
              <HeroStat
                value={analytics.hoursSaved >= 1
                  ? `${analytics.hoursSaved.toFixed(1)}h`
                  : `${Math.round(analytics.hoursSaved * 60)}m`}
                label="Hours Saved"
                sub="at 2 min per transaction"
                accent
              />
            </section>

            {/* ── ROI callout ─────────────────────────────────────────────── */}
            <section>
              <div
                className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden"
                style={{ backgroundColor: '#1a1714', color: '#ffffff' }}
              >
                {/* Background glow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(ellipse at 10% 50%, rgba(45,90,39,0.4) 0%, transparent 55%), radial-gradient(ellipse at 90% 20%, rgba(184,115,74,0.2) 0%, transparent 50%)',
                  }}
                />

                <div className="relative z-10 flex-1 space-y-2">
                  <SectionLabel>Return on Investment</SectionLabel>
                  <p
                    className="text-3xl sm:text-4xl leading-tight"
                    style={{
                      fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                      letterSpacing: '-0.025em',
                    }}
                  >
                    CloseBooks saved you{' '}
                    <span style={{ color: '#6ee7b7' }}>
                      ${analytics.moneySaved.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>{' '}
                    in bookkeeper time.
                  </p>
                  <p className="text-sm" style={{ color: '#8a8078' }}>
                    {analytics.totalTransactions.toLocaleString()} transactions × 2 min each ÷ 60 = {analytics.hoursSaved.toFixed(1)} hours × $50/hr
                  </p>
                </div>

                <div className="relative z-10 text-right shrink-0">
                  <p
                    className="text-5xl sm:text-6xl font-semibold leading-none tabular-nums"
                    style={{
                      fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                      color: '#6ee7b7',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    ${analytics.moneySaved.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                    {analytics.hoursSaved.toFixed(1)}h @ $50/hr
                  </p>
                </div>
              </div>
            </section>

            {/* ── Monthly volume + Confidence side by side ────────────────── */}
            <section className="grid sm:grid-cols-2 gap-5">

              {/* Monthly bar chart */}
              <div
                className="rounded-2xl border p-6"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
              >
                <SectionLabel>Volume by Month</SectionLabel>
                <h2 className="text-base font-semibold mb-5" style={{ color: '#1a1714' }}>
                  Transactions categorized
                </h2>
                {analytics.monthlyVolume.every((m) => m.count === 0) ? (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-sm" style={{ color: '#c4bdb8' }}>No data in last 6 months</p>
                  </div>
                ) : (
                  <BarChart data={analytics.monthlyVolume} />
                )}
              </div>

              {/* Confidence distribution */}
              <div
                className="rounded-2xl border p-6"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
              >
                <SectionLabel>Confidence Distribution</SectionLabel>
                <h2 className="text-base font-semibold mb-5" style={{ color: '#1a1714' }}>
                  How accurate is the AI?
                </h2>
                <ConfidenceChart buckets={analytics.confidenceBuckets} />

                {/* Auto-approval rate highlight */}
                <div
                  className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: '#f0f5ef' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0"
                    style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
                  >
                    {analytics.totalTransactions > 0
                      ? Math.round((analytics.autoApproved / analytics.totalTransactions) * 100)
                      : 0}%
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1a1714' }}>Auto-approval rate</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b9965' }}>
                      {analytics.autoApproved.toLocaleString()} of {analytics.totalTransactions.toLocaleString()} transactions approved without manual review
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Top categories + Recent activity side by side ───────────── */}
            <section className="grid sm:grid-cols-2 gap-5">

              {/* Top categories */}
              <div
                className="rounded-2xl border p-6"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
              >
                <SectionLabel>Category Breakdown</SectionLabel>
                <h2 className="text-base font-semibold mb-1" style={{ color: '#1a1714' }}>
                  Top 10 categories
                </h2>
                <p className="text-xs mb-5" style={{ color: '#a09a94' }}>
                  By transaction count across all clients
                </p>
                {analytics.topCategories.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: '#c4bdb8' }}>No categorized transactions yet</p>
                ) : (
                  <CategoryTable categories={analytics.topCategories} />
                )}
              </div>

              {/* Recent activity */}
              <div
                className="rounded-2xl border p-6"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
              >
                <SectionLabel>Recent Activity</SectionLabel>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#1a1714' }}>
                  Latest closes
                </h2>
                {analytics.recentActivity.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: '#c4bdb8' }}>No closes yet</p>
                ) : (
                  <ActivityFeed activity={analytics.recentActivity} />
                )}
                {analytics.totalJobs > 8 && (
                  <Link
                    href="/dashboard"
                    className="block text-center text-xs mt-4 transition-colors"
                    style={{ color: '#b8734a' }}
                  >
                    View all {analytics.totalJobs} closes →
                  </Link>
                )}
              </div>
            </section>

            {/* ── Time saved breakdown ────────────────────────────────────── */}
            <section>
              <div
                className="rounded-2xl border p-6 sm:p-8"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff' }}
              >
                <SectionLabel>Time Savings Calculator</SectionLabel>
                <h2 className="text-lg font-semibold mb-6" style={{ color: '#1a1714' }}>
                  Where the time goes
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ backgroundColor: '#f0ece4' }}>
                  {[
                    {
                      step: '01',
                      label: 'Transactions processed',
                      value: analytics.totalTransactions.toLocaleString(),
                      unit: 'total',
                      note: 'Across all clients and closes',
                    },
                    {
                      step: '02',
                      label: 'Minutes saved',
                      value: (analytics.totalTransactions * 2).toLocaleString(),
                      unit: 'minutes',
                      note: '2 min per manual categorization',
                    },
                    {
                      step: '03',
                      label: 'Hours recovered',
                      value: analytics.hoursSaved >= 1
                        ? analytics.hoursSaved.toFixed(1)
                        : `${Math.round(analytics.hoursSaved * 60)}`,
                      unit: analytics.hoursSaved >= 1 ? 'hours' : 'minutes',
                      note: 'Time you can spend on advisory work',
                    },
                  ].map(({ step, label, value, unit, note }) => (
                    <div key={step} className="px-5 py-5" style={{ backgroundColor: '#ffffff' }}>
                      <span className="text-xs font-bold" style={{ color: '#b8734a' }}>STEP {step}</span>
                      <p
                        className="text-3xl font-semibold mt-2 leading-none tabular-nums"
                        style={{ color: '#1a1714', letterSpacing: '-0.02em' }}
                      >
                        {value}
                        <span className="text-base font-normal ml-1.5" style={{ color: '#a09a94' }}>{unit}</span>
                      </p>
                      <p className="text-sm font-medium mt-1.5" style={{ color: '#1a1714' }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{note}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-5 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{ backgroundColor: '#f0f5ef', border: '1px solid #c4d9c0' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                      Estimated money saved
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b9965' }}>
                      Based on $50/hr average bookkeeper rate (US, 2024)
                    </p>
                  </div>
                  <p
                    className="text-3xl font-semibold tabular-nums"
                    style={{
                      color: '#2d5a27',
                      fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    ${analytics.moneySaved.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
