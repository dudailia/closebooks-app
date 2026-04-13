'use client'

import { useState, useEffect, useMemo } from 'react'
import SpendComparisonChart from '@/components/SpendComparisonChart'
import { SkeletonBlock, SkeletonCard, SkeletonTable } from '@/components/Skeleton'
import {
  getNetworkStats,
  getClientBenchmarks,
  getBenchmarkOptIn,
  setBenchmarkOptIn,
} from '@/lib/benchmarkNetwork'
import { getJobs } from '@/lib/storage'
import { NETWORK_BENCHMARKS } from '@/lib/benchmarkNetworkData'
import type { ClientIndustry, CategorizationJob } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_INDUSTRIES: ClientIndustry[] = [
  'Restaurant', 'Retail', 'Professional Services', 'Construction', 'Healthcare',
  'E-commerce', 'Technology', 'Manufacturing', 'Real Estate', 'Nonprofit',
  'Legal Services', 'Transportation', 'Other',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex items-start gap-4"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: '#e8f0e6' }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-bold leading-none"
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            color: '#1a1714',
          }}
        >
          {value}
        </p>
        <p className="text-xs mt-1 font-medium" style={{ color: '#1a1714' }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{sub}</p>}
      </div>
    </div>
  )
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5"
        style={{ backgroundColor: '#2d5a27' }}
      >
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{title}</p>
        <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>{description}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<ClientIndustry>('Technology')
  const [optedIn, setOptedIn]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const [contribution, setContribution] = useState<{
    jobCount: number
    txnCount: number
  }>({ jobCount: 0, txnCount: 0 })

  const networkStats = useMemo(() => getNetworkStats(), [])

  useEffect(() => {
    setMounted(true)

    setOptedIn(getBenchmarkOptIn())

    try {
      const jobs: CategorizationJob[] = getJobs()
      const completed = jobs.filter((j) => j.status === 'completed')
      setContribution({
        jobCount: completed.length,
        txnCount: completed.reduce((s, j) => s + j.total_transactions, 0),
      })
    } catch { /* ignore */ }
  }, [])

  function handleOptIn(checked: boolean) {
    setOptedIn(checked)
    void setBenchmarkOptIn(checked)
  }

  // Build benchmark results for the selected industry using a dummy empty job
  // (pure network view — not a per-client comparison)
  const industryBenchmarks = useMemo(
    () => NETWORK_BENCHMARKS.filter((r) => r.industry === selectedIndustry),
    [selectedIndustry],
  )

  // Transform SpendRatio[] into BenchmarkResult[] for the chart (network-only view)
  const networkOnlyResults = useMemo(
    () =>
      industryBenchmarks.map((r) => ({
        category: r.category,
        clientPct: r.median,       // show median as "client" bar in pure-network view
        networkMedian: r.median,
        networkP25: r.p25,
        networkP75: r.p75,
        status: 'on-track' as const,
        insight: `Typical range: ${r.p25}–${r.p75}% of expenses (${r.sampleSize} firms).`,
        sampleSize: r.sampleSize,
      })),
    [industryBenchmarks],
  )

  if (!mounted) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={220} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={340} style={{ marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
      <SkeletonTable rows={5} cols={4} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col page-content" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-6xl mx-auto px-5 py-8 w-full space-y-8">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div>
          <h1
            className="text-3xl"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            Industry Network
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#6b6560' }}>
            Anonymous benchmarks from{' '}
            <span className="font-medium" style={{ color: '#1a1714' }}>
              {networkStats.firmCount.toLocaleString()}+
            </span>{' '}
            CPA firms across{' '}
            <span className="font-medium" style={{ color: '#1a1714' }}>
              {networkStats.industriesCount}
            </span>{' '}
            industries
          </p>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Firms in Network"
            value="1,247+"
            sub="Verified CPA practices"
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="#2d5a27" strokeWidth="1.4" />
                <path d="M2 16c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Transactions Analyzed"
            value="2.3M+"
            sub="Anonymized and aggregated"
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="3" width="14" height="12" rx="2" stroke="#2d5a27" strokeWidth="1.4" />
                <path d="M5 8h8M5 12h5" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Industries Covered"
            value="13"
            sub="From Restaurant to Technology"
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5z" stroke="#2d5a27" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
              </svg>
            }
          />
        </div>

        {/* ── Your contribution card ───────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-5"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  color: '#1a1714',
                }}
              >
                Your Contribution
              </h2>
              {contribution.jobCount > 0 ? (
                <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
                  You have completed{' '}
                  <span className="font-semibold" style={{ color: '#1a1714' }}>
                    {contribution.jobCount} close{contribution.jobCount !== 1 ? 's' : ''}
                  </span>
                  {' '}with{' '}
                  <span className="font-semibold" style={{ color: '#1a1714' }}>
                    {contribution.txnCount.toLocaleString()} transactions
                  </span>
                  {' '}eligible for contribution.
                </p>
              ) : (
                <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
                  Complete your first close to contribute to the benchmark network.
                </p>
              )}
            </div>

            {/* Opt-in toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none shrink-0">
              <span className="text-sm font-medium" style={{ color: '#1a1714' }}>
                Contribute anonymized data
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={optedIn}
                  onChange={(e) => handleOptIn(e.target.checked)}
                />
                <div
                  className="w-10 h-5 rounded-full transition-colors duration-150"
                  style={{ backgroundColor: optedIn ? '#2d5a27' : '#d1ccc7' }}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-150"
                    style={{ transform: optedIn ? 'translateX(21px)' : 'translateX(2px)' }}
                  />
                </div>
              </div>
            </label>
          </div>

          {optedIn && (
            <div
              className="mt-3 rounded-lg px-4 py-2.5 text-xs flex items-center gap-2"
              style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 6.5l1.5 1.5L9 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Your anonymized spend ratios are being contributed to improve network benchmarks.
            </div>
          )}
        </div>

        {/* ── Industry benchmark explorer ──────────────────────────────────── */}
        <div
          className="rounded-2xl border"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div
            className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 border-b flex-wrap"
            style={{ borderColor: '#f0ece4' }}
          >
            <div>
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  color: '#1a1714',
                }}
              >
                Industry Benchmark Explorer
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                Bars show the network median. Shaded band shows p25–p75 range.
              </p>
            </div>

            <div>
              <label className="sr-only" htmlFor="explorer-industry">Industry</label>
              <select
                id="explorer-industry"
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value as ClientIndustry)}
                className="text-sm rounded-lg border px-3 py-1.5 focus:outline-none"
                style={{
                  borderColor: '#e8e0d4',
                  color: '#1a1714',
                  backgroundColor: '#faf8f4',
                }}
              >
                {ALL_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="px-6 py-5">
            <SpendComparisonChart results={networkOnlyResults} />
          </div>

          <div
            className="px-6 pb-4 pt-0 text-xs"
            style={{ color: '#a09a94' }}
          >
            Benchmarks based on{' '}
            {industryBenchmarks[0]?.sampleSize.toLocaleString() ?? 0}{' '}
            firms. Last updated March 2026.
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <h2
            className="text-base font-semibold mb-5"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            How it works
          </h2>
          <div className="space-y-5">
            <HowItWorksStep
              number={1}
              title="Your closes generate spend ratios"
              description="Each time you complete a close, CloseBooks computes expense ratios across common categories — payroll, COGS, software, and more."
            />
            <div className="w-full h-px" style={{ backgroundColor: '#f0ece4' }} />
            <HowItWorksStep
              number={2}
              title="Anonymized and aggregated"
              description="With your opt-in, only the anonymized ratios (never client names or amounts) are aggregated with data from other CPA firms in the network."
            />
            <div className="w-full h-px" style={{ backgroundColor: '#f0ece4' }} />
            <HowItWorksStep
              number={3}
              title="You see where you stand"
              description="Compare any client's spend mix against the industry distribution — immediately spotting outliers and efficiency opportunities."
            />
          </div>
        </div>

        {/* ── Privacy footer note ──────────────────────────────────────────── */}
        <div
          className="rounded-xl border px-5 py-4 flex items-start gap-3"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <path d="M8 1.5L2 4v4c0 3.3 2.7 5.8 6 6.5 3.3-.7 6-3.2 6-6.5V4L8 1.5z" stroke="#b8734a" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
            <path d="M5.5 8l1.5 1.5L10.5 6" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-xs" style={{ color: '#6b6560' }}>
            <span className="font-semibold" style={{ color: '#1a1714' }}>Privacy guarantee: </span>
            All data is anonymized. No client names, business names, or identifying information is ever shared.
            Only aggregated spend percentages contribute to network benchmarks.
          </p>
        </div>

      </main>

    </div>
  )
}
