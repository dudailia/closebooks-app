'use client'

import { useState, useMemo } from 'react'
import { calcBenchmarks } from '@/lib/benchmarkCalc'
import { BENCHMARKS } from '@/lib/benchmarkData'
import type { CategorizationJob } from '@/types'
import type { ClientIndustry } from '@/types'
import type { BenchmarkResult } from '@/lib/benchmarkCalc'

interface Props {
  job: CategorizationJob
  industry: ClientIndustry | null
  onIndustryChange?: (industry: ClientIndustry) => void
}

const INDUSTRIES: ClientIndustry[] = [
  'Restaurant', 'Retail', 'Professional Services',
  'Construction', 'Healthcare', 'E-commerce', 'Other',
]

const POSITION_STYLE: Record<BenchmarkResult['position'], { dot: string; badge: string; badgeText: string; label: string }> = {
  high:      { dot: '#dc2626', badge: '#fef2f2', badgeText: '#991b1b', label: 'Above average' },
  normal:    { dot: '#059669', badge: '#ecfdf5', badgeText: '#065f46', label: 'On target' },
  excellent: { dot: '#2563eb', badge: '#eff6ff', badgeText: '#1e40af', label: 'Excellent' },
}

function DistributionBar({ result }: { result: BenchmarkResult }) {
  // Map values onto 0-100 scale within [0, max(p75*1.4, clientPct*1.1)]
  const rangeMax = Math.max(result.p75 * 1.5, result.clientPct * 1.1, result.p75 + 5)
  const toX = (v: number) => Math.round(Math.min((v / rangeMax) * 100, 100))

  const rangeLeft  = toX(result.p25)
  const rangeWidth = toX(result.p75) - toX(result.p25)
  const clientPos  = toX(result.clientPct)

  const dotColor = POSITION_STYLE[result.position].dot

  return (
    <div className="relative h-5 mt-2">
      {/* Track */}
      <div
        className="absolute top-2 left-0 right-0 h-1.5 rounded-full"
        style={{ backgroundColor: '#f0ece4' }}
      />
      {/* P25–P75 range */}
      <div
        className="absolute top-2 h-1.5 rounded-full"
        style={{
          left:  `${rangeLeft}%`,
          width: `${rangeWidth}%`,
          backgroundColor: '#c0debb',
        }}
      />
      {/* Median tick */}
      <div
        className="absolute top-1 w-0.5 h-3 rounded-full"
        style={{ left: `${toX(result.median)}%`, backgroundColor: '#2d5a27', transform: 'translateX(-50%)' }}
      />
      {/* Client marker */}
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm"
        style={{
          left: `${clientPos}%`,
          backgroundColor: dotColor,
          transform: 'translateX(-50%)',
          transition: 'left 0.4s ease',
        }}
        title={`${result.clientPct}%`}
      />
      {/* Labels */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs" style={{ color: '#a09a94' }}>
        <span style={{ left: `${toX(result.p25)}%`, position: 'absolute', transform: 'translateX(-50%)' }}>
          P25 {result.p25}%
        </span>
        <span style={{ left: `${toX(result.median)}%`, position: 'absolute', transform: 'translateX(-50%)' }}>
          Median {result.median}%
        </span>
        <span style={{ left: `${toX(result.p75)}%`, position: 'absolute', transform: 'translateX(-50%)' }}>
          P75 {result.p75}%
        </span>
      </div>
    </div>
  )
}

export default function BenchmarkPanel({ job, industry, onIndustryChange }: Props) {
  const [expanded, setExpanded]         = useState(false)
  const [showPicker, setShowPicker]     = useState(false)

  const results = useMemo(() => {
    if (!industry || industry === 'Other') return []
    return calcBenchmarks(job, industry)
  }, [job, industry])

  const hasHighResults = results.some((r) => r.position === 'high')
  const benchmarkMeta  = industry ? BENCHMARKS[industry] : null

  // No industry set
  if (!industry || industry === 'Other') {
    return (
      <div
        className="rounded-xl border px-5 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <BenchmarkIcon />
          <div>
            <p className="text-sm font-medium" style={{ color: '#1a1714' }}>Industry Benchmarks</p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
              Tag this client&apos;s industry to see how they compare to peers
            </p>
          </div>
        </div>
        {onIndustryChange && (
          <div className="relative">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors"
              style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: '#ffffff' }}
            >
              Set industry →
            </button>
            {showPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden min-w-[180px]"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
                >
                  {INDUSTRIES.filter((i) => i !== 'Other').map((ind) => (
                    <button
                      key={ind}
                      onClick={() => { onIndustryChange(ind); setShowPicker(false) }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{ color: '#1a1714' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // No revenue data
  const totalRevenue = job.transactions.filter((t) => t.type === 'credit' && (t.status === 'approved' || t.status === 'edited')).reduce((s, t) => s + t.amount, 0)
  if (totalRevenue === 0) {
    return (
      <div
        className="rounded-xl border px-5 py-4"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <BenchmarkIcon />
          <p className="text-sm" style={{ color: '#6b6560' }}>
            Benchmarks need approved revenue transactions to compute ratios.
          </p>
        </div>
      </div>
    )
  }

  // No matching categories
  if (results.length === 0) {
    return (
      <div
        className="rounded-xl border px-5 py-4"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <div className="flex items-center gap-2.5">
          <BenchmarkIcon />
          <p className="text-sm" style={{ color: '#6b6560' }}>
            No {industry} benchmark categories matched the transactions in this job.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: hasHighResults ? '#fed7aa' : '#d4e8d0',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Header */}
      <button
        className="w-full px-5 py-3.5 flex items-center justify-between gap-3"
        onClick={() => setExpanded((v) => !v)}
        style={{ backgroundColor: hasHighResults ? '#fffbf5' : '#f6faf5' }}
      >
        <div className="flex items-center gap-2.5">
          <BenchmarkIcon color={hasHighResults ? '#f97316' : '#2d5a27'} />
          <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>
            Industry Benchmarks
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f0ece4', color: '#6b6560' }}>
            {industry}
          </span>
          {hasHighResults && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
              {results.filter((r) => r.position === 'high').length} above average
            </span>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#a09a94', flexShrink: 0 }}
        >
          <path d="M2 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="divide-y" style={{ borderColor: '#f0ece4' }}>
          {results.map((result) => {
            const s = POSITION_STYLE[result.position]
            return (
              <div key={result.category} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: '#1a1714' }}>
                      {result.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: s.badge, color: s.badgeText }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: s.dot }}>
                    {result.clientPct}%
                  </span>
                </div>

                {/* Distribution bar */}
                <div style={{ paddingBottom: 24 }}>
                  <DistributionBar result={result} />
                </div>

                {/* Insight */}
                <p className="text-xs leading-relaxed pt-1" style={{ color: '#6b6560' }}>
                  {result.insight}
                </p>
              </div>
            )
          })}

          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: '#a09a94' }}>
              {benchmarkMeta?.dataSource ?? 'Industry averages'}
            </p>
            {onIndustryChange && (
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="text-xs transition-colors"
                style={{ color: '#b8734a' }}
              >
                Change industry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BenchmarkIcon({ color = '#2d5a27' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="1.5" y="10" width="3" height="5" rx="1" fill={color} opacity="0.4" />
      <rect x="6.5" y="6" width="3" height="9" rx="1" fill={color} opacity="0.7" />
      <rect x="11.5" y="2" width="3" height="13" rx="1" fill={color} />
      <path d="M2 5l4-3 4 3 4-3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
