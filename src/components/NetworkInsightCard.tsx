'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { CategorizationJob, ClientIndustry } from '@/types'
import { getClientBenchmarks } from '@/lib/benchmarkNetwork'
import { NETWORK_BENCHMARKS } from '@/lib/benchmarkNetworkData'
import { getJobs } from '@/lib/storage'

// ─── Component ────────────────────────────────────────────────────────────────

export default function NetworkInsightCard() {
  const [insight, setInsight] = useState<{
    category: string
    clientPct: number
    networkMedian: number
    networkP25: number
    networkP75: number
    industry: ClientIndustry
  } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const jobs: CategorizationJob[] = getJobs()
      const completed = jobs.filter((j) => j.status === 'completed')
      if (completed.length === 0) { setLoaded(true); return }

      // Most recent completed job
      const latest = completed.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0]

      // Try each industry until we get results
      const industriesToTry: ClientIndustry[] = [
        'Professional Services', 'Restaurant', 'Retail', 'Technology',
        'Healthcare', 'Construction', 'E-commerce', 'Manufacturing',
        'Real Estate', 'Nonprofit', 'Legal Services', 'Transportation', 'Other',
      ]

      let results = null
      let chosenIndustry: ClientIndustry = 'Other'

      for (const ind of industriesToTry) {
        const r = getClientBenchmarks(latest, NETWORK_BENCHMARKS, ind)
        if (r.length > 0) { results = r; chosenIndustry = ind; break }
      }

      if (!results || results.length === 0) { setLoaded(true); return }

      // Find the category most above industry median
      const aboveMedian = results
        .filter((r) => r.status === 'above')
        .sort((a, b) => (b.clientPct - b.networkMedian) - (a.clientPct - a.networkMedian))

      const top = aboveMedian[0] ?? results[0]
      setInsight({
        category: top.category,
        clientPct: top.clientPct,
        networkMedian: top.networkMedian,
        networkP25: top.networkP25,
        networkP75: top.networkP75,
        industry: chosenIndustry,
      })
    } catch {
      // Silently ignore localStorage errors
    } finally {
      setLoaded(true)
    }
  }, [])

  // ── Empty / not loaded ─────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div
        className="rounded-xl border p-4 animate-pulse"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-3 w-48 rounded" style={{ backgroundColor: '#f0ece4' }} />
      </div>
    )
  }

  if (!insight) {
    return (
      <div
        className="rounded-xl border px-4 py-4"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: '#f0ece4' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#b8734a" strokeWidth="1.3" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
              No benchmark data yet
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              Complete your first close to see industry benchmarks.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const diffPct = Math.round(
    ((insight.clientPct - insight.networkMedian) / insight.networkMedian) * 100,
  )
  const isAbove = insight.clientPct > insight.networkMedian
  const accentColor = isAbove ? '#dc2626' : '#2d5a27'
  const accentBg = isAbove ? '#fef2f2' : '#e8f0e6'

  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: accentBg }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" stroke={accentColor} strokeWidth="1.3" />
            <path d="M1 7h2.5M10.5 7H13M7 1v2.5M7 10.5V13" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: '#1a1714' }}>
            <span style={{ color: accentColor }}>{insight.category}</span>
            {' '}is{' '}
            <span style={{ color: accentColor, fontWeight: 600 }}>
              {Math.abs(diffPct)}% {isAbove ? 'above' : 'below'}
            </span>
            {' '}the median for <span className="font-medium">{insight.industry}</span> firms.
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
            Typical range: {insight.networkP25}–{insight.networkP75}% of expenses.
          </p>
          <Link
            href="/dashboard/network"
            className="inline-flex items-center gap-1 text-xs font-medium mt-2 transition-colors"
            style={{ color: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#2d5a27' }}
          >
            View full benchmarks
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
