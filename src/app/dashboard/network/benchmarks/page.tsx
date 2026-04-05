'use client'

import { useState, useEffect } from 'react'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import BenchmarkGauge from '@/components/BenchmarkGauge'
import {
  INDUSTRY_BENCHMARKS,
  ALL_INDUSTRIES,
  METRIC_LABELS,
} from '@/lib/network/benchmarkData'
import type { CategorizationJob } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const JOBS_KEY = 'closebooks_jobs'

const METRIC_KEYS = Object.keys(METRIC_LABELS)

// Demo client values per industry (realistic defaults)
const DEMO_CLIENT_VALUES: Record<string, Record<string, number>> = {
  Construction:          { gross_margin: 18, payroll_to_revenue: 48, ar_days: 54, cash_runway: 3, operating_expense_ratio: 24 },
  Restaurant:            { gross_margin: 38, payroll_to_revenue: 36, ar_days: 7,  cash_runway: 2, operating_expense_ratio: 34 },
  Technology:            { gross_margin: 66, payroll_to_revenue: 58, ar_days: 29, cash_runway: 9, operating_expense_ratio: 41 },
  Healthcare:            { gross_margin: 47, payroll_to_revenue: 59, ar_days: 44, cash_runway: 3, operating_expense_ratio: 28 },
  Retail:                { gross_margin: 31, payroll_to_revenue: 25, ar_days: 11, cash_runway: 3, operating_expense_ratio: 29 },
  'Professional Services':{ gross_margin: 54, payroll_to_revenue: 57, ar_days: 35, cash_runway: 4, operating_expense_ratio: 31 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPercentile(value: number, p25: number, p50: number, p75: number, min: number, max: number): number {
  if (value <= p25) return Math.round(((value - min) / (p25 - min)) * 25)
  if (value <= p50) return 25 + Math.round(((value - p25) / (p50 - p25)) * 25)
  if (value <= p75) return 50 + Math.round(((value - p50) / (p75 - p50)) * 25)
  return 75 + Math.round(((value - p75) / (max - p75)) * 25)
}

function getInsightText(
  metricKey: string,
  value: number,
  p25: number,
  p50: number,
  p75: number,
  min: number,
  max: number,
  higherIsBetter: boolean,
): { text: string; sentiment: 'positive' | 'neutral' | 'negative' } {
  const pct = Math.max(1, Math.min(99, getPercentile(value, p25, p50, p75, min, max)))
  const label = METRIC_LABELS[metricKey]?.label ?? metricKey
  const unit = METRIC_LABELS[metricKey]?.unit ?? ''

  if (higherIsBetter) {
    if (pct >= 75) return {
      text: `Your client is in the ${pct}th percentile for ${label} — top quartile performance. Industry top 10% average ${max}${unit}.`,
      sentiment: 'positive',
    }
    if (pct >= 50) return {
      text: `Your client is in the ${pct}th percentile for ${label} — above the industry median of ${p50}${unit}. Top quartile firms average ${p75}${unit}.`,
      sentiment: 'positive',
    }
    if (pct >= 25) return {
      text: `Your client is in the ${pct}th percentile for ${label}. Below the industry median of ${p50}${unit}. Focus on improving to reach the ${p75}${unit} top-quartile threshold.`,
      sentiment: 'neutral',
    }
    return {
      text: `Your client is in the ${pct}th percentile for ${label} — bottom quartile. The industry median is ${p50}${unit}; investigate what top firms do differently.`,
      sentiment: 'negative',
    }
  } else {
    // Lower is better
    if (pct <= 25) return {
      text: `Your client is in the ${pct}th percentile for ${label} — excellent efficiency (lower is better). Industry median is ${p50}${unit}.`,
      sentiment: 'positive',
    }
    if (pct <= 50) return {
      text: `Your client is in the ${pct}th percentile for ${label} — below the industry median of ${p50}${unit} (lower is better). Solid performance.`,
      sentiment: 'positive',
    }
    if (pct <= 75) return {
      text: `Your client is in the ${pct}th percentile for ${label}. Above the median of ${p50}${unit} — room to improve. Top quartile firms are at ${p25}${unit} or below.`,
      sentiment: 'neutral',
    }
    return {
      text: `Your client is in the ${pct}th percentile for ${label} — top quartile but in the wrong direction. Target ${p25}${unit} or below to match industry leaders.`,
      sentiment: 'negative',
    }
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BenchmarksPage() {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClient, setSelectedClient] = useState<string>('demo')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('Technology')
  const [clientValues, setClientValues] = useState<Record<string, number>>(
    DEMO_CLIENT_VALUES['Technology'],
  )

  // Load clients from localStorage
  useEffect(() => {
    try {
      const jobs: CategorizationJob[] = JSON.parse(localStorage.getItem(JOBS_KEY) ?? '[]')
      const completed = jobs.filter((j) => j.status === 'completed')
      const unique = Array.from(
        new Map(completed.map((j) => [j.client_name, { id: j.id, name: j.client_name }])).values(),
      )
      setClients(unique)
    } catch {
      // ignore
    }
  }, [])

  // Update client values when industry changes
  useEffect(() => {
    setClientValues(DEMO_CLIENT_VALUES[selectedIndustry] ?? DEMO_CLIENT_VALUES['Technology'])
  }, [selectedIndustry])

  const benchmarks = INDUSTRY_BENCHMARKS[selectedIndustry]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 64px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#e8f0e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="10" width="4" height="7" rx="1" fill="#2d5a27" />
                <rect x="7" y="6" width="4" height="11" rx="1" fill="#2d5a27" />
                <rect x="13" y="2" width="4" height="15" rx="1" fill="#2d5a27" />
              </svg>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1714', margin: 0 }}>
              Benchmark Comparison
            </h1>
          </div>
          <p style={{ fontSize: 15, color: '#6b6560', margin: 0 }}>
            See how your client compares to industry peers across key financial metrics.
          </p>
        </div>

        {/* Selectors */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 28,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-end',
          }}
        >
          {/* Client selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                padding: '9px 12px',
                fontSize: 14,
                color: '#1a1714',
                backgroundColor: '#faf8f4',
                border: '1px solid #e8e0d4',
                borderRadius: 8,
                fontFamily: 'inherit',
                cursor: 'pointer',
                minWidth: 200,
              }}
            >
              <option value="demo">Demo Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Industry selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Compare to Industry
            </label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              style={{
                padding: '9px 12px',
                fontSize: 14,
                color: '#1a1714',
                backgroundColor: '#faf8f4',
                border: '1px solid #e8e0d4',
                borderRadius: 8,
                fontFamily: 'inherit',
                cursor: 'pointer',
                minWidth: 200,
              }}
            >
              {ALL_INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Sample size badge */}
          {benchmarks && (
            <div
              style={{
                padding: '8px 14px',
                backgroundColor: '#e8f0e6',
                borderRadius: 8,
                fontSize: 13,
                color: '#2d5a27',
                fontWeight: 500,
              }}
            >
              {benchmarks.gross_margin.sampleCount.toLocaleString()} firms in dataset
            </div>
          )}
        </div>

        {/* Gauge grid */}
        {benchmarks && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
              marginBottom: 28,
            }}
          >
            {METRIC_KEYS.map((key) => {
              const bench = benchmarks[key as keyof typeof benchmarks]
              const meta = METRIC_LABELS[key]
              if (!bench || !meta) return null
              const clientVal = clientValues[key] ?? bench.p50

              return (
                <BenchmarkGauge
                  key={key}
                  label={meta.label}
                  value={clientVal}
                  p25={bench.p25}
                  p50={bench.p50}
                  p75={bench.p75}
                  unit={meta.unit}
                  higherIsBetter={meta.higherIsBetter}
                  max={Math.ceil(bench.p90 * 1.2)}
                />
              )
            })}
          </div>
        )}

        {/* Insight callouts */}
        {benchmarks && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 14,
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', margin: '0 0 16px' }}>
              Insights &amp; Recommendations
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {METRIC_KEYS.map((key) => {
                const bench = benchmarks[key as keyof typeof benchmarks]
                const meta = METRIC_LABELS[key]
                if (!bench || !meta) return null
                const clientVal = clientValues[key] ?? bench.p50
                const maxVal = Math.ceil(bench.p90 * 1.2)
                const insight = getInsightText(
                  key, clientVal,
                  bench.p25, bench.p50, bench.p75,
                  0, maxVal,
                  meta.higherIsBetter,
                )

                const sentimentColor = {
                  positive: '#16a34a',
                  neutral: '#b8734a',
                  negative: '#dc2626',
                }[insight.sentiment]

                const sentimentBg = {
                  positive: '#f0fdf4',
                  neutral: '#fdf6f0',
                  negative: '#fef2f2',
                }[insight.sentiment]

                return (
                  <div
                    key={key}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: sentimentBg,
                      borderRadius: 10,
                      borderLeft: `3px solid ${sentimentColor}`,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#1a1714', lineHeight: 1.6 }}>
                      {insight.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  )
}
