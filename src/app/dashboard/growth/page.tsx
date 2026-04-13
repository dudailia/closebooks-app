'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getClients, getJobs } from '@/lib/storage'
import { computeLeadScores, type LeadScore } from '@/lib/leadScoring'

const TIER_STYLE: Record<LeadScore['tier'], { bg: string; text: string; label: string }> = {
  hot:     { bg: '#fef2f2', text: '#b91c1c', label: 'Hot' },
  warm:    { bg: '#fffbeb', text: '#b45309', label: 'Warm' },
  nurture: { bg: '#f1f5f9', text: '#475569', label: 'Nurture' },
}

export default function GrowthDashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [scores, setScores] = useState<LeadScore[]>([])

  useEffect(() => {
    const clients = getClients()
    const jobs = getJobs()
    setScores(computeLeadScores(clients, jobs))
    setMounted(true)
  }, [])

  const summary = useMemo(() => {
    const hot = scores.filter((s) => s.tier === 'hot').length
    const warm = scores.filter((s) => s.tier === 'warm').length
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)
        : 0
    return { hot, warm, avg }
  }, [scores])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-8 page-enter">
        <div>
          <Link href="/dashboard" className="text-xs transition-colors" style={{ color: '#b8734a' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Growth &amp; pipeline
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>
            Prioritize which clients to upsell advisory, tax planning, or higher-touch closes — scored from your real client list and close history.
          </p>
        </div>

        {mounted && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Hot leads', value: summary.hot, sub: 'Score 70+' },
              { label: 'Warm', value: summary.warm, sub: 'Score 45–69' },
              { label: 'Avg score', value: summary.avg.toString(), sub: 'Across clients' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border px-5 py-4"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <p className="text-2xl font-semibold font-mono" style={{ color: '#1a1714' }}>
                  {s.value}
                </p>
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                  {s.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="px-5 py-4 border-b flex flex-wrap justify-between gap-2" style={{ borderColor: '#e8e0d4' }}>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Client opportunity scores
            </p>
            <Link href="/dashboard/pipeline" className="text-xs font-medium" style={{ color: '#2d5a27' }}>
              Open engagement pipeline →
            </Link>
          </div>
          {!mounted ? (
            <div className="p-8 animate-pulse space-y-3">
              <div className="h-4 w-1/3 rounded" style={{ backgroundColor: '#f0ece4' }} />
            </div>
          ) : scores.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm" style={{ color: '#6b6560' }}>
              Add clients under Clients, then run closes — scores appear automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#faf8f4', color: '#6b6560' }}>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium">Tier</th>
                    <th className="text-right px-4 py-3 font-medium">Score</th>
                    <th className="text-left px-4 py-3 font-medium">Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {scores
                    .sort((a, b) => b.score - a.score)
                    .map((row) => {
                      const st = TIER_STYLE[row.tier]
                      return (
                        <tr key={row.clientId} className="border-t" style={{ borderColor: '#f0ebe3' }}>
                          <td className="px-4 py-3 font-medium" style={{ color: '#1a1714' }}>
                            {row.clientName}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: st.bg, color: st.text }}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono" style={{ color: '#1a1714' }}>
                            {row.score}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: '#6b6560' }}>
                            {row.reasons.slice(0, 3).join(' · ')}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
