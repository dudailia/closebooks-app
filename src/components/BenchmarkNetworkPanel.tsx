'use client'

import { useState, useEffect, useMemo } from 'react'
import type { CategorizationJob, ClientIndustry } from '@/types'
import {
  getClientBenchmarks,
  getNetworkStats,
  submitBenchmarkContribution,
} from '@/lib/benchmarkNetwork'
import { NETWORK_BENCHMARKS } from '@/lib/benchmarkNetworkData'
import SpendComparisonChart from './SpendComparisonChart'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_INDUSTRIES: ClientIndustry[] = [
  'Restaurant', 'Retail', 'Professional Services', 'Construction', 'Healthcare',
  'E-commerce', 'Technology', 'Manufacturing', 'Real Estate', 'Nonprofit',
  'Legal Services', 'Transportation', 'Other',
]

const OPT_IN_KEY = 'cb_network_opt_in'

// ─── Icons ────────────────────────────────────────────────────────────────────

function NetworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="3" stroke="#2d5a27" strokeWidth="1.4" />
      <circle cx="2.5" cy="4" r="1.5" stroke="#2d5a27" strokeWidth="1.3" />
      <circle cx="15.5" cy="4" r="1.5" stroke="#2d5a27" strokeWidth="1.3" />
      <circle cx="2.5" cy="14" r="1.5" stroke="#2d5a27" strokeWidth="1.3" />
      <circle cx="15.5" cy="14" r="1.5" stroke="#2d5a27" strokeWidth="1.3" />
      <path d="M4 4.5L6.5 7M11.5 7L14 4.5M4 13.5L6.5 11M11.5 11L14 13.5" stroke="#2d5a27" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  job: CategorizationJob
  industry: ClientIndustry
}

export default function BenchmarkNetworkPanel({ job, industry }: Props) {
  const [selectedIndustry, setSelectedIndustry] = useState<ClientIndustry>(industry)
  const [optedIn, setOptedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contributed, setContributed] = useState(false)

  const networkStats = useMemo(() => getNetworkStats(), [])

  // Load opt-in state from localStorage
  useEffect(() => {
    try {
      setOptedIn(localStorage.getItem(OPT_IN_KEY) === 'true')
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  // Compute benchmark results for the selected industry
  const results = useMemo(
    () => getClientBenchmarks(job, NETWORK_BENCHMARKS, selectedIndustry),
    [job, selectedIndustry],
  )

  // Top 3 insights (above-median categories first)
  const topInsights = useMemo(() => results.slice(0, 3), [results])

  function handleOptIn(checked: boolean) {
    setOptedIn(checked)
    try {
      localStorage.setItem(OPT_IN_KEY, String(checked))
    } catch { /* ignore */ }

    if (checked && !contributed) {
      submitBenchmarkContribution(job, selectedIndustry)
      setContributed(true)
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl border p-6 animate-pulse"
        style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
      >
        <div className="h-5 w-40 rounded mb-3" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-4 w-64 rounded mb-6" style={{ backgroundColor: '#f0ece4' }} />
        <div className="h-48 rounded-xl" style={{ backgroundColor: '#f0ece4' }} />
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border"
      style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b"
        style={{ borderColor: '#f0ece4' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#e8f0e6' }}
          >
            <NetworkIcon />
          </div>
          <div>
            <h2
              className="text-base font-semibold leading-tight"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
              }}
            >
              Industry Benchmarks
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
              Powered by {networkStats.firmCount.toLocaleString()}+ firms &middot; {networkStats.industriesCount} industries
            </p>
          </div>
        </div>

        {/* Industry selector */}
        <div>
          <label className="sr-only" htmlFor="industry-select">Industry</label>
          <select
            id="industry-select"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value as ClientIndustry)}
            className="text-sm rounded-lg border px-3 py-1.5 focus:outline-none focus:ring-2"
            style={{
              borderColor: '#e8e0d4',
              color: '#1a1714',
              backgroundColor: '#faf8f4',
              // @ts-expect-error – custom property
              '--tw-ring-color': '#2d5a27',
            }}
          >
            {ALL_INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 py-5">
        <SpendComparisonChart results={results} />
      </div>

      {/* Key insights */}
      {topInsights.length > 0 && (
        <div
          className="px-6 pb-5 border-t pt-4"
          style={{ borderColor: '#f0ece4' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6b6560' }}>
            Key Insights
          </p>
          <ul className="space-y-2">
            {topInsights.map((result) => {
              const icon = result.status === 'above' ? '↑' : result.status === 'below' ? '↓' : '–'
              const iconColor =
                result.status === 'above' ? '#dc2626' : result.status === 'below' ? '#2d5a27' : '#6b6560'
              const bgColor =
                result.status === 'above' ? '#fef2f2' : result.status === 'below' ? '#e8f0e6' : '#faf8f4'
              return (
                <li
                  key={result.category}
                  className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: bgColor }}
                >
                  <span
                    className="text-xs font-bold mt-0.5 shrink-0 w-4 text-center"
                    style={{ color: iconColor }}
                  >
                    {icon}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: '#1a1714' }}>
                    {result.insight}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Opt-in toggle */}
      <div
        className="px-6 py-4 border-t rounded-b-2xl"
        style={{ borderColor: '#f0ece4', backgroundColor: '#faf8f4' }}
      >
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={optedIn}
              onChange={(e) => handleOptIn(e.target.checked)}
            />
            <div
              className="w-9 h-5 rounded-full transition-colors duration-150"
              style={{ backgroundColor: optedIn ? '#2d5a27' : '#d1ccc7' }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-150"
                style={{ transform: optedIn ? 'translateX(17px)' : 'translateX(2px)' }}
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
              Contribute to network
            </p>
            {optedIn ? (
              <p className="text-xs mt-0.5" style={{ color: '#2d5a27' }}>
                Your data has been anonymized and contributed to the network.
              </p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                Share anonymized spend ratios to improve benchmarks for all firms.
              </p>
            )}
          </div>
        </label>
      </div>
    </div>
  )
}
