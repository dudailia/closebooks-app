'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getAdvisoryMemosForClient, saveAdvisoryMemo } from '@/lib/advisoryStorage'
import { buildClientAdvisoryReport, createForecastSeries, type AdvisoryTemplate, advisoryTemplateLabel } from '@/lib/advisoryEngine'
import { getClient, getJobsForClient } from '@/lib/storage'
import type { AdvisoryMemo } from '@/types/advisory'
import type { Client, CategorizationJob } from '@/types'

const TEMPLATE_OPTIONS: AdvisoryTemplate[] = [
  'quarterly_review',
  'cash_flow_advisory',
  'tax_planning',
  'annual_planning',
]

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function Chart({
  historical,
  forecast,
  mode,
}: {
  historical: { label: string; value: number }[]
  forecast: { label: string; expected: number; optimistic: number; pessimistic: number }[]
  mode: 'expected' | 'optimistic' | 'pessimistic'
}) {
  const allPoints = [
    ...historical.map((point) => ({ label: point.label, value: point.value })),
    ...forecast.map((point) => ({
      label: point.label,
      value: mode === 'optimistic' ? point.optimistic : mode === 'pessimistic' ? point.pessimistic : point.expected,
    })),
  ]
  const values = allPoints.map((point) => point.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const width = 760
  const height = 260
  const padX = 32
  const padY = 18
  const chartWidth = width - padX * 2
  const chartHeight = height - padY * 2

  function x(index: number): number {
    return padX + (chartWidth / Math.max(1, allPoints.length - 1)) * index
  }

  function y(value: number): number {
    const ratio = (value - min) / Math.max(1, max - min)
    return height - padY - ratio * chartHeight
  }

  const line = allPoints.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')
  const area = `${padX},${height - padY} ${line} ${x(allPoints.length - 1)},${height - padY}`
  const historyCount = historical.length

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
            Historical + projected cash
          </p>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            Toggle scenarios to pressure-test the next 90 days before you walk into the advisory meeting.
          </p>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: '#f5f0ea', color: '#6b6560' }}>
          {mode === 'expected' ? 'Expected case' : mode === 'optimistic' ? 'Optimistic case' : 'Pessimistic case'}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 0.5, 1].map((ratio) => {
          const yPos = padY + chartHeight * ratio
          const value = max - (max - min) * ratio
          return (
            <g key={ratio}>
              <line x1={padX} y1={yPos} x2={width - padX} y2={yPos} stroke="#efe7dc" strokeDasharray="4 6" />
              <text x={0} y={yPos + 4} fontSize="10" fill="#9a958f">
                {formatMoney(value)}
              </text>
            </g>
          )
        })}

        <path d={`M ${area}`} fill="url(#forecastArea)" opacity="0.45" />
        <polyline
          fill="none"
          stroke="#b8734a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
        <line
          x1={x(historyCount - 1)}
          y1={padY}
          x2={x(historyCount - 1)}
          y2={height - padY}
          stroke="#d9d2c8"
          strokeDasharray="6 6"
        />

        {allPoints.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r="4.5"
              fill={index < historyCount ? '#2d5a27' : '#b8734a'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text x={x(index)} y={height - 2} textAnchor="middle" fontSize="10" fill="#9a958f">
              {point.label.split(' ')[0]}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="forecastArea" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#dfc0ab" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default function ClientPredictiveAdvisoryPage({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null)
  const [jobs, setJobs] = useState<CategorizationJob[]>([])
  const [selectedScenario, setSelectedScenario] = useState<'expected' | 'optimistic' | 'pessimistic'>('expected')
  const [revenueScenario, setRevenueScenario] = useState(0)
  const [expenseScenario, setExpenseScenario] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<AdvisoryTemplate>('quarterly_review')
  const [memo, setMemo] = useState<AdvisoryMemo | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const foundClient = getClient(clientId)
    setClient(foundClient)
    if (!foundClient) return
    const clientJobs = getJobsForClient(foundClient.business_name)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
    setJobs(clientJobs)
    setMemo(getAdvisoryMemosForClient(foundClient.business_name)[0] ?? null)
  }, [clientId])

  if (!client) {
    return (
      <div className="min-h-screen px-5 py-12" style={{ backgroundColor: '#faf8f4' }}>
        <div className="mx-auto max-w-3xl rounded-3xl border p-8 text-center" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
          <h1 className="text-2xl" style={{ fontFamily: 'var(--font-dm-serif), \"DM Serif Display\", Georgia, serif', color: '#1a1714' }}>
            Client not found
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#6b6560' }}>
            This predictive advisory workspace needs a real client record first.
          </p>
          <Link href="/dashboard/clients" className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: '#2d5a27' }}>
            Back to clients
          </Link>
        </div>
      </div>
    )
  }

  const report = buildClientAdvisoryReport(client, jobs)
  const scenarioForecast = createForecastSeries(report.forecastModel, revenueScenario, expenseScenario)
  const latestJob = jobs[jobs.length - 1] ?? null
  const historical = report.timeline.slice(-6).map((point) => ({
    label: point.label,
    value: point.endingCash,
  }))

  async function generateMemo() {
    if (!latestJob) return
    setIsGenerating(true)
    try {
      const previousJobs = jobs.filter((job) => job.id !== latestJob.id).slice(-3)
      const response = await fetch('/api/advisory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: latestJob,
          previousJobs,
          client,
          tone: 'executive',
          template: selectedTemplate,
          focusAreas: [
            'Cash Flow Analysis',
            'Industry Benchmarks',
            '90-Day Forecast',
            'Recommendations',
          ],
        }),
      })

      if (!response.ok) throw new Error('Failed to generate memo')
      const data = (await response.json()) as { memo: AdvisoryMemo }
      saveAdvisoryMemo(data.memo)
      setMemo(data.memo)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f4' }}>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard/predict" className="text-sm" style={{ color: '#6b6560' }}>
              ← Back to predictive close
            </Link>
            <h1 className="mt-2 text-3xl" style={{ fontFamily: 'var(--font-dm-serif), \"DM Serif Display\", Georgia, serif', color: '#1a1714' }}>
              {client.business_name}
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#6b6560' }}>
              Predictive analytics and advisory workspace for {client.industry.toLowerCase()} clients.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/clients/${client.id}`} className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#ffffff' }}>
              Client profile
            </Link>
            <Link href="/dashboard/advisory" className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: '#ffffff' }}>
              Advisory hub
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Health score', value: `${report.health.score}/100`, detail: `${report.health.label} · churn risk ${report.health.churnRisk}` },
            { label: 'Current cash', value: formatMoney(report.currentCash), detail: `Minimum target ${formatMoney(report.minimumBalance)}` },
            { label: '30/60/90', value: `${formatMoney(scenarioForecast[0]?.expected ?? report.currentCash)} / ${formatMoney(scenarioForecast[1]?.expected ?? report.currentCash)} / ${formatMoney(scenarioForecast[2]?.expected ?? report.currentCash)}`, detail: 'Expected case' },
            { label: 'Revenue growth', value: formatPercent(report.kpis.revenueGrowthMoM), detail: 'Month over month' },
            { label: 'Runway', value: report.kpis.runwayMonths === null ? 'Healthy' : `${report.kpis.runwayMonths} mo`, detail: `Burn ${formatMoney(report.kpis.burnRate)}/mo` },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border p-4" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>{card.label}</p>
              <p className="mt-3 text-xl font-semibold" style={{ color: '#1a1714' }}>{card.value}</p>
              <p className="mt-1 text-sm" style={{ color: '#6b6560' }}>{card.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border p-5" style={{ borderColor: '#e8e0d4', background: 'linear-gradient(135deg, #fffdf9 0%, #fff5ed 100%)' }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                    Scenario builder
                  </p>
                  <h2 className="mt-1 text-xl" style={{ fontFamily: 'var(--font-dm-serif), \"DM Serif Display\", Georgia, serif', color: '#1a1714' }}>
                    Model the next 90 days before the client asks
                  </h2>
                </div>
                <div className="flex gap-2">
                  {(['expected', 'optimistic', 'pessimistic'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedScenario(mode)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold capitalize"
                      style={{
                        backgroundColor: selectedScenario === mode ? '#1a1714' : '#ffffff',
                        color: selectedScenario === mode ? '#ffffff' : '#6b6560',
                        border: '1px solid #e0dbd4',
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-2xl border p-4" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between text-sm" style={{ color: '#1a1714' }}>
                    <span>What if revenue shifts?</span>
                    <strong>{revenueScenario > 0 ? '+' : ''}{revenueScenario}%</strong>
                  </div>
                  <input
                    className="mt-3 w-full"
                    type="range"
                    min={-30}
                    max={30}
                    step={5}
                    value={revenueScenario}
                    onChange={(event) => setRevenueScenario(Number(event.target.value))}
                  />
                </label>
                <label className="rounded-2xl border p-4" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
                  <div className="flex items-center justify-between text-sm" style={{ color: '#1a1714' }}>
                    <span>What if expenses shift?</span>
                    <strong>{expenseScenario > 0 ? '+' : ''}{expenseScenario}%</strong>
                  </div>
                  <input
                    className="mt-3 w-full"
                    type="range"
                    min={-20}
                    max={30}
                    step={5}
                    value={expenseScenario}
                    onChange={(event) => setExpenseScenario(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="mt-5">
                <Chart historical={historical} forecast={scenarioForecast} mode={selectedScenario} />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                  KPI dashboard
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Gross margin', formatPercent(report.kpis.grossMargin)],
                    ['Operating margin', formatPercent(report.kpis.operatingMargin)],
                    ['Net margin', formatPercent(report.kpis.netMargin)],
                    ['Revenue growth YoY', formatPercent(report.kpis.revenueGrowthYoY)],
                    ['Current ratio', report.kpis.currentRatio === null ? 'N/A' : report.kpis.currentRatio.toFixed(2)],
                    ['DSO', report.kpis.dso === null ? 'N/A' : `${report.kpis.dso} days`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border p-3" style={{ borderColor: '#efe7dc', backgroundColor: '#faf8f4' }}>
                      <p className="text-xs" style={{ color: '#6b6560' }}>{label}</p>
                      <p className="mt-1 text-lg font-semibold" style={{ color: '#1a1714' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm" style={{ color: '#6b6560' }}>
                  Balance-sheet ratios and DSO stay conservative until enough clean balance-sheet context exists in the close history.
                </p>
              </div>

              <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                  Industry benchmark
                </p>
                {report.benchmarkResults.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {report.benchmarkResults.slice(0, 3).map((benchmark) => (
                      <div key={benchmark.category} className="rounded-xl border p-3" style={{ borderColor: '#efe7dc', backgroundColor: '#faf8f4' }}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{benchmark.label}</p>
                          <span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: '#ffffff', color: benchmark.position === 'high' ? '#b42318' : benchmark.position === 'excellent' ? '#2d5a27' : '#6b6560' }}>
                            {benchmark.clientPct}% vs {benchmark.median}%
                          </span>
                        </div>
                        <p className="mt-2 text-sm" style={{ color: '#6b6560' }}>{benchmark.insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm" style={{ color: '#6b6560' }}>
                    Complete more categorized closes to unlock client-versus-industry benchmark comparisons.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                Proactive alerts
              </p>
              <div className="mt-4 grid gap-3">
                {report.alerts.length > 0 ? report.alerts.map((alert) => (
                  <div key={alert.id} className="rounded-2xl border p-4" style={{ borderColor: alert.severity === 'critical' ? '#f0b3b0' : alert.severity === 'warning' ? '#f2d4a5' : '#d9e6d6', backgroundColor: '#fcfbf8' }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: '#ffffff', color: alert.severity === 'critical' ? '#b42318' : alert.severity === 'warning' ? '#b54708' : '#2d5a27' }}>
                        {alert.severity}
                      </span>
                      <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{alert.title}</p>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: '#6b6560' }}>{alert.description}</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: '#1a1714' }}>{alert.recommendation}</p>
                  </div>
                )) : (
                  <p className="text-sm" style={{ color: '#6b6560' }}>
                    No alerts fired. This client is a good candidate for a positive-looking advisory check-in.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                Advisory memo generator
              </p>
              <div className="mt-4 grid gap-2">
                {TEMPLATE_OPTIONS.map((template) => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    className="rounded-xl border px-3 py-2 text-left text-sm font-medium"
                    style={{
                      borderColor: selectedTemplate === template ? '#1a1714' : '#e0dbd4',
                      backgroundColor: selectedTemplate === template ? '#1a1714' : '#ffffff',
                      color: selectedTemplate === template ? '#ffffff' : '#1a1714',
                    }}
                  >
                    {advisoryTemplateLabel(template)}
                  </button>
                ))}
              </div>
              <button
                onClick={generateMemo}
                disabled={!latestJob || isGenerating}
                className="mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: '#2d5a27' }}
              >
                {isGenerating ? 'Generating memo...' : `Generate ${advisoryTemplateLabel(selectedTemplate)}`}
              </button>
              <p className="mt-3 text-sm" style={{ color: '#6b6560' }}>
                This uses the live close history, current forecast, benchmarks, and proactive alerts instead of generic prompt text.
              </p>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                Recurring signals
              </p>
              <div className="mt-4 space-y-3">
                {report.recurringPatterns.slice(0, 5).map((pattern) => (
                  <div key={`${pattern.kind}-${pattern.description}`} className="rounded-xl border p-3" style={{ borderColor: '#efe7dc', backgroundColor: '#faf8f4' }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>{pattern.description}</p>
                      <span className="text-xs font-semibold" style={{ color: pattern.kind === 'revenue' ? '#2d5a27' : '#b8734a' }}>
                        {pattern.kind === 'revenue' ? '+' : '-'}{formatMoney(pattern.averageAmount)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: '#6b6560' }}>
                      {pattern.cadence} · seen in {pattern.coverageMonths} month{pattern.coverageMonths === 1 ? '' : 's'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                Latest memo
              </p>
              {memo ? (
                <div className="mt-4 space-y-3">
                  <p className="text-lg" style={{ fontFamily: 'var(--font-dm-serif), \"DM Serif Display\", Georgia, serif', color: '#1a1714' }}>
                    {memo.headline}
                  </p>
                  <p className="text-sm" style={{ color: '#6b6560' }}>
                    {memo.sections[0]?.body}
                  </p>
                  <Link href="/dashboard/advisory" className="inline-flex text-sm font-medium" style={{ color: '#b8734a' }}>
                    Open advisory hub →
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm" style={{ color: '#6b6560' }}>
                  No memo saved yet. Generate one from the latest close and use it in your next client call.
                </p>
              )}
            </div>

            <div className="rounded-2xl border p-5" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#a09a94' }}>
                Forecast assumptions
              </p>
              <div className="mt-4 space-y-2">
                {report.assumptions.concat(report.seasonalityNotes).slice(0, 5).map((note) => (
                  <p key={note} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: '#efe7dc', color: '#6b6560', backgroundColor: '#faf8f4' }}>
                    {note}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
