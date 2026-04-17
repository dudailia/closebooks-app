'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type MetricsResponse = {
  periodDays?: number
  summary?: {
    totalTransactionsCategorized?: number
    autoApprovedHighConfidence?: number
    feedbackSamples?: number
    estimatedFirstTryAccuracyPct?: number | null
    correctionsRecorded?: number
  }
  runs?: Array<{
    total_transactions?: number
    auto_approved?: number
    pending_review?: number
    flagged?: number
    learned_applied?: number
    estimated_cost_usd?: number
    created_at?: string
    client_name?: string
  }>
  feedbackByDay?: Array<{ date: string; correct: number; wrong: number }>
}

export default function CategorizationAccuracyPage() {
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/categorization/metrics?days=90')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr('Could not load metrics.'))
  }, [])

  const s = data?.summary

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-10 space-y-8">
        <div>
          <Link href="/dashboard/copilot" className="text-xs" style={{ color: '#b8734a' }}>
            ← Close Copilot settings
          </Link>
          <h1
            className="text-2xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            AI categorization accuracy
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Aggregates from categorization runs and correction feedback (last {data?.periodDays ?? 90} days). Configure thresholds on{' '}
            <Link href="/dashboard/copilot" className="underline">Close Copilot</Link>.
          </p>
        </div>

        {err && (
          <p className="text-sm" style={{ color: '#991b1b' }}>{err}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Transactions categorized', value: s?.totalTransactionsCategorized ?? '—' },
            { label: 'High-confidence auto-approved', value: s?.autoApprovedHighConfidence ?? '—' },
            { label: 'Feedback samples (corrections)', value: s?.feedbackSamples ?? '—' },
            { label: 'Est. first-try accuracy', value: s?.estimatedFirstTryAccuracyPct != null ? `${s.estimatedFirstTryAccuracyPct}%` : '—' },
            { label: 'Corrections (AI wrong)', value: s?.correctionsRecorded ?? '—' },
          ].map((x) => (
            <div
              key={x.label}
              className="rounded-xl border p-4"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <p className="text-xs" style={{ color: '#6b6560' }}>{x.label}</p>
              <p className="text-xl font-semibold mt-1" style={{ color: '#1a1714' }}>{x.value}</p>
            </div>
          ))}
        </div>

        {/* Simple bar chart */}
        {data?.feedbackByDay && data.feedbackByDay.length > 0 && (
          <div className="rounded-xl border p-4" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#1a1714' }}>Corrections over time</p>
            <div className="flex items-end gap-1 h-32">
              {data.feedbackByDay.slice(-20).map((d) => {
                const max = Math.max(1, ...data.feedbackByDay!.map((x) => x.correct + x.wrong))
                const h = ((d.correct + d.wrong) / max) * 100
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.wrong} wrong`}>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${h}%`,
                        minHeight: 4,
                        backgroundColor: d.wrong > 0 ? '#f97316' : '#22c55e',
                      }}
                    />
                    <span className="text-[9px] text-gray-400 rotate-45 origin-left">{d.date.slice(5)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#f0ece4' }}>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Recent closes (API)</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#faf8f4' }}>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-right px-4 py-2">Auto</th>
                <th className="text-right px-4 py-2">Flagged</th>
                <th className="text-right px-4 py-2">Est. $</th>
              </tr>
            </thead>
            <tbody>
              {(data?.runs ?? []).slice(0, 25).map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: '#f0ece4' }}>
                  <td className="px-4 py-2 whitespace-nowrap" style={{ color: '#6b6560' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2">{r.client_name ?? '—'}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.auto_approved ?? 0}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.flagged ?? 0}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {r.estimated_cost_usd != null ? Number(r.estimated_cost_usd).toFixed(4) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
