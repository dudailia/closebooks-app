import { NextRequest, NextResponse } from 'next/server'
import type { CategorizationJob, Client } from '@/types'
import { buildClientAdvisoryReport } from '@/lib/advisoryEngine'

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { jobs: CategorizationJob[]; client?: Client | null; clientName?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { jobs } = body

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({
      forecast: [],
      nextMonthForecast: { totalExpenses: 0, totalRevenue: 0 },
      cashTrend: 'stable',
      runwayNote: null,
      assumptions: [],
    })
  }

  const latestJob = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const fallbackClient: Client = body.client ?? {
    id: latestJob.id,
    business_name: latestJob.client_name || body.clientName || 'Client',
    industry: 'Other',
    contact_email: '',
    accounting_software: 'Other',
    created_at: latestJob.created_at,
  }
  const report = buildClientAdvisoryReport(fallbackClient, jobs)
  const latestMonth = report.latestMonth
  const previousMonth = report.timeline[report.timeline.length - 2] ?? null
  const nextMonth = report.forecast[0]

  let cashTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (latestMonth && previousMonth) {
    if (latestMonth.netCashFlow > previousMonth.netCashFlow) cashTrend = 'improving'
    if (latestMonth.netCashFlow < previousMonth.netCashFlow) cashTrend = 'declining'
  }

  const runwayNote =
    report.alerts.find((alert) => alert.type === 'runway')?.description ??
    (report.kpis.runwayMonths !== null
      ? `Estimated runway is ${report.kpis.runwayMonths} month(s) at the current burn rate.`
      : null)

  return NextResponse.json({
    forecast: report.forecast,
    nextMonthForecast: {
      totalExpenses: report.forecastModel.baseExpenses,
      totalRevenue: nextMonth ? report.forecastModel.baseRevenue : 0,
    },
    cashTrend,
    runwayNote,
    assumptions: report.assumptions,
    minimumBalance: report.minimumBalance,
    healthScore: report.health.score,
  })
}
