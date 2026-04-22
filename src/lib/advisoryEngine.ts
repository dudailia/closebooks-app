import { calcBenchmarks, type BenchmarkResult } from '@/lib/benchmarkCalc'
import type { CategorizationJob, Client, ClientIndustry, Transaction } from '@/types'

export type AdvisoryTemplate =
  | 'quarterly_review'
  | 'cash_flow_advisory'
  | 'tax_planning'
  | 'annual_planning'

export interface AdvisoryMetricPoint {
  period: string
  label: string
  revenue: number
  expenses: number
  cogs: number
  operatingExpenses: number
  netCashFlow: number
  endingCash: number
  flaggedTransactions: number
  uncategorizedAmount: number
  totalTransactions: number
}

export interface ForecastSeriesPoint {
  label: string
  period: string
  expected: number
  optimistic: number
  pessimistic: number
}

export interface AdvisoryForecastModel {
  baseRevenue: number
  baseExpenses: number
  revenueTrend: number
  expenseTrend: number
  volatility: number
  minimumBalance: number
  startCash: number
  startPeriod: string
}

export interface AdvisoryAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type:
    | 'cash_flow'
    | 'revenue_drop'
    | 'expense_spike'
    | 'uncategorized'
    | 'runway'
    | 'health'
    | 'growth'
  title: string
  description: string
  recommendation: string
}

export interface ClientHealthScore {
  score: number
  label: 'Excellent' | 'Strong' | 'Stable' | 'Watchlist' | 'At Risk'
  churnRisk: 'low' | 'moderate' | 'high'
  drivers: string[]
}

export interface AdvisoryKpis {
  grossMargin: number | null
  netMargin: number | null
  operatingMargin: number | null
  revenueGrowthMoM: number | null
  revenueGrowthYoY: number | null
  currentRatio: number | null
  quickRatio: number | null
  dso: number | null
  burnRate: number
  runwayMonths: number | null
}

export interface RecurringPattern {
  description: string
  cadence: string
  averageAmount: number
  coverageMonths: number
  kind: 'revenue' | 'expense'
}

export interface ClientAdvisoryReport {
  clientId: string
  clientName: string
  industry: ClientIndustry
  monthsOfHistory: number
  currentCash: number
  minimumBalance: number
  timeline: AdvisoryMetricPoint[]
  forecastModel: AdvisoryForecastModel
  forecast: ForecastSeriesPoint[]
  forecast30: number
  forecast60: number
  forecast90: number
  assumptions: string[]
  seasonalityNotes: string[]
  recurringPatterns: RecurringPattern[]
  benchmarkResults: BenchmarkResult[]
  alerts: AdvisoryAlert[]
  health: ClientHealthScore
  kpis: AdvisoryKpis
  latestMonth: AdvisoryMetricPoint | null
}

const COGS_KEYWORDS = [
  'cogs',
  'cost of goods',
  'inventory',
  'materials',
  'subcontract',
  'direct labor',
  'merchant fees',
  'job materials',
]

const OPEX_KEYWORDS = [
  'rent',
  'payroll',
  'salary',
  'wages',
  'software',
  'marketing',
  'utilities',
  'insurance',
  'travel',
  'office',
  'professional fees',
]

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function addMonths(key: string, offset: number): string {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function roundMetric(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null
  return Math.round(value * 10) / 10
}

function safePct(numerator: number, denominator: number): number | null {
  if (!denominator) return null
  return (numerator / denominator) * 100
}

function pctChange(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

function linearTrend(values: number[]): number {
  const n = values.length
  if (n <= 1) return 0
  const xs = values.map((_, index) => index)
  const sumX = xs.reduce((sum, value) => sum + value, 0)
  const sumY = values.reduce((sum, value) => sum + value, 0)
  const sumXY = xs.reduce((sum, x, index) => sum + x * values[index], 0)
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0)
  const denominator = n * sumX2 - sumX * sumX
  if (!denominator) return 0
  return (n * sumXY - sumX * sumY) / denominator
}

function normalizeDescription(transaction: Transaction): string {
  const raw = transaction.description || transaction.original_description || 'Unknown'
  return raw
    .toLowerCase()
    .replace(/[0-9]/g, '')
    .replace(/\b(?:inc|llc|co|corp|payment|deposit|transfer|debit|credit|ach|pos)\b/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getCategory(transaction: Transaction): string {
  return (transaction.final_category ?? transaction.suggested_category ?? 'Uncategorized').trim()
}

function isCogs(category: string): boolean {
  const lower = category.toLowerCase()
  return COGS_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function isOperatingExpense(category: string): boolean {
  const lower = category.toLowerCase()
  return OPEX_KEYWORDS.some((keyword) => lower.includes(keyword))
}

function isUncategorized(category: string): boolean {
  const lower = category.toLowerCase()
  return !lower || lower.includes('uncategorized') || lower.includes('???') || lower.includes('needs review')
}

function buildTimeline(jobs: CategorizationJob[]): AdvisoryMetricPoint[] {
  const monthly = new Map<string, AdvisoryMetricPoint>()
  const sortedJobs = [...jobs].sort((a, b) => a.created_at.localeCompare(b.created_at))

  for (const job of sortedJobs) {
    const period = monthKey(job.created_at)
    const current = monthly.get(period) ?? {
      period,
      label: monthLabel(period),
      revenue: 0,
      expenses: 0,
      cogs: 0,
      operatingExpenses: 0,
      netCashFlow: 0,
      endingCash: 0,
      flaggedTransactions: 0,
      uncategorizedAmount: 0,
      totalTransactions: 0,
    }

    for (const transaction of job.transactions) {
      const category = getCategory(transaction)
      current.totalTransactions += 1
      if (transaction.status === 'flagged') current.flaggedTransactions += 1

      if (transaction.type === 'credit') {
        current.revenue += transaction.amount
      } else {
        current.expenses += transaction.amount
        if (isCogs(category)) current.cogs += transaction.amount
        else if (isOperatingExpense(category) || !isUncategorized(category)) current.operatingExpenses += transaction.amount
        if (isUncategorized(category)) current.uncategorizedAmount += transaction.amount
      }
    }

    current.netCashFlow = current.revenue - current.expenses
    monthly.set(period, current)
  }

  const timeline = Array.from(monthly.values()).sort((a, b) => a.period.localeCompare(b.period))
  let runningCash = 0
  return timeline.map((point) => {
    runningCash += point.netCashFlow
    return {
      ...point,
      revenue: roundCurrency(point.revenue),
      expenses: roundCurrency(point.expenses),
      cogs: roundCurrency(point.cogs),
      operatingExpenses: roundCurrency(point.operatingExpenses),
      netCashFlow: roundCurrency(point.netCashFlow),
      endingCash: roundCurrency(runningCash),
      uncategorizedAmount: roundCurrency(point.uncategorizedAmount),
    }
  })
}

function buildRecurringPatterns(timeline: AdvisoryMetricPoint[], jobs: CategorizationJob[]): RecurringPattern[] {
  const patternMap = new Map<string, { months: Set<string>; amounts: number[]; kind: 'revenue' | 'expense' }>()

  for (const job of jobs) {
    const period = monthKey(job.created_at)
    for (const transaction of job.transactions) {
      const normalized = normalizeDescription(transaction)
      if (!normalized || normalized.length < 4) continue
      const key = `${transaction.type}:${normalized}`
      const existing = patternMap.get(key) ?? {
        months: new Set<string>(),
        amounts: [],
        kind: transaction.type === 'credit' ? 'revenue' : 'expense',
      }
      existing.months.add(period)
      existing.amounts.push(transaction.amount)
      patternMap.set(key, existing)
    }
  }

  const monthsOfHistory = timeline.length || 1
  return Array.from(patternMap.entries())
    .map(([key, value]) => {
      const description = key.split(':')[1]
      const coverageMonths = value.months.size
      return {
        description: description.replace(/\b\w/g, (char) => char.toUpperCase()),
        cadence: coverageMonths >= Math.max(3, monthsOfHistory - 1) ? 'Monthly' : coverageMonths >= 3 ? 'Recurring' : 'Occasional',
        averageAmount: roundCurrency(average(value.amounts)),
        coverageMonths,
        kind: value.kind,
      }
    })
    .filter((pattern) => pattern.coverageMonths >= 3)
    .sort((a, b) => b.coverageMonths - a.coverageMonths || Math.abs(b.averageAmount) - Math.abs(a.averageAmount))
    .slice(0, 8)
}

function buildSeasonalityNotes(timeline: AdvisoryMetricPoint[]): string[] {
  if (timeline.length < 6) {
    return ['Add more monthly close history to unlock stronger seasonal forecasting.']
  }

  const revenueSorted = [...timeline].sort((a, b) => b.revenue - a.revenue)
  const expenseSorted = [...timeline].sort((a, b) => b.expenses - a.expenses)
  const notes = [
    `Highest revenue month in history: ${revenueSorted[0].label} at $${revenueSorted[0].revenue.toLocaleString()}.`,
    `Highest spend month in history: ${expenseSorted[0].label} at $${expenseSorted[0].expenses.toLocaleString()}.`,
  ]

  if (timeline.length >= 12) {
    const trailing12 = timeline.slice(-12)
    const strongest = [...trailing12].sort((a, b) => b.netCashFlow - a.netCashFlow)[0]
    const weakest = [...trailing12].sort((a, b) => a.netCashFlow - b.netCashFlow)[0]
    notes.push(`Cash flow swings from ${weakest.label} ($${weakest.netCashFlow.toLocaleString()}) to ${strongest.label} ($${strongest.netCashFlow.toLocaleString()}) across the last 12 closes.`)
  }

  return notes
}

export function createForecastSeries(
  model: AdvisoryForecastModel,
  revenueAdjustmentPct: number = 0,
  expenseAdjustmentPct: number = 0,
): ForecastSeriesPoint[] {
  const points: ForecastSeriesPoint[] = []
  let runningCash = model.startCash

  for (let index = 1; index <= 3; index++) {
    const period = addMonths(model.startPeriod, index)
    const trendRevenue = model.baseRevenue + model.revenueTrend * index
    const trendExpenses = model.baseExpenses + model.expenseTrend * index
    const projectedRevenue = Math.max(0, trendRevenue * (1 + revenueAdjustmentPct / 100))
    const projectedExpenses = Math.max(0, trendExpenses * (1 + expenseAdjustmentPct / 100))
    const expectedCash = runningCash + projectedRevenue - projectedExpenses
    const band = model.volatility * (0.65 + index * 0.35)

    points.push({
      label: monthLabel(period),
      period,
      expected: roundCurrency(expectedCash),
      optimistic: roundCurrency(expectedCash + band),
      pessimistic: roundCurrency(expectedCash - band),
    })

    runningCash = expectedCash
  }

  return points
}

function buildHealthScore(
  timeline: AdvisoryMetricPoint[],
  forecast: ForecastSeriesPoint[],
): ClientHealthScore {
  const latest = timeline[timeline.length - 1]
  if (!latest) {
    return {
      score: 0,
      label: 'At Risk',
      churnRisk: 'high',
      drivers: ['No completed close history yet.'],
    }
  }

  const previous = timeline[timeline.length - 2]
  const grossMargin = safePct(latest.revenue - latest.cogs, latest.revenue) ?? 0
  const netMargin = safePct(latest.netCashFlow, latest.revenue) ?? 0
  const revenueGrowth = previous ? pctChange(latest.revenue, previous.revenue) ?? 0 : 0
  const flaggedRatio = latest.totalTransactions ? latest.flaggedTransactions / latest.totalTransactions : 0
  const nearTermForecast = forecast[2]?.expected ?? latest.endingCash

  let score = 50
  score += Math.max(-18, Math.min(18, netMargin / 2))
  score += Math.max(-12, Math.min(12, grossMargin / 4))
  score += Math.max(-10, Math.min(10, revenueGrowth / 2))
  score += nearTermForecast > 0 ? 10 : -15
  score += flaggedRatio < 0.05 ? 8 : flaggedRatio > 0.15 ? -10 : 0

  const normalized = Math.max(0, Math.min(100, Math.round(score)))

  let label: ClientHealthScore['label'] = 'Stable'
  if (normalized >= 85) label = 'Excellent'
  else if (normalized >= 72) label = 'Strong'
  else if (normalized < 45) label = 'At Risk'
  else if (normalized < 60) label = 'Watchlist'

  let churnRisk: ClientHealthScore['churnRisk'] = 'low'
  if (normalized < 45 || revenueGrowth < -15 || nearTermForecast < 0) churnRisk = 'high'
  else if (normalized < 65 || revenueGrowth < -5) churnRisk = 'moderate'

  const drivers = [
    `${latest.label} net margin ${netMargin >= 0 ? '+' : ''}${roundMetric(netMargin) ?? 0}%`,
    previous ? `Revenue ${revenueGrowth >= 0 ? 'up' : 'down'} ${Math.abs(roundMetric(revenueGrowth) ?? 0)}% month over month` : 'More monthly history will improve trend confidence',
    flaggedRatio > 0 ? `${Math.round(flaggedRatio * 100)}% of latest transactions still needed extra review` : 'Latest close completed cleanly with no flagged transactions',
  ]

  return { score: normalized, label, churnRisk, drivers }
}

function buildAlerts(report: {
  clientName: string
  timeline: AdvisoryMetricPoint[]
  forecast: ForecastSeriesPoint[]
  minimumBalance: number
  health: ClientHealthScore
}): AdvisoryAlert[] {
  const alerts: AdvisoryAlert[] = []
  const latest = report.timeline[report.timeline.length - 1]
  const previous = report.timeline[report.timeline.length - 2]

  if (!latest) return alerts

  if (previous) {
    const revenueDrop = pctChange(latest.revenue, previous.revenue)
    if (revenueDrop !== null && revenueDrop <= -15) {
      alerts.push({
        id: `revenue-drop-${latest.period}`,
        severity: revenueDrop <= -25 ? 'critical' : 'warning',
        type: 'revenue_drop',
        title: `${report.clientName} revenue is down ${Math.abs(roundMetric(revenueDrop) ?? 0)}%`,
        description: `Revenue fell from $${previous.revenue.toLocaleString()} to $${latest.revenue.toLocaleString()} in the latest close.`,
        recommendation: 'Review lost customers, delayed billing, and AR follow-up before the next advisory call.',
      })
    }

    const expenseIncrease = pctChange(latest.expenses, previous.expenses)
    if (expenseIncrease !== null && expenseIncrease >= 20) {
      alerts.push({
        id: `expense-spike-${latest.period}`,
        severity: expenseIncrease >= 40 ? 'critical' : 'warning',
        type: 'expense_spike',
        title: `Expenses climbed ${roundMetric(expenseIncrease) ?? 0}% month over month`,
        description: `Latest-period spend reached $${latest.expenses.toLocaleString()} versus $${previous.expenses.toLocaleString()} previously.`,
        recommendation: 'Break down new spend by category and confirm whether the increase is intentional, seasonal, or a cleanup issue.',
      })
    }
  }

  if (latest.uncategorizedAmount >= 50000) {
    alerts.push({
      id: `uncategorized-${latest.period}`,
      severity: 'critical',
      type: 'uncategorized',
      title: '$50K+ remains uncategorized',
      description: `$${latest.uncategorizedAmount.toLocaleString()} in the latest close still sits in uncategorized or needs-review buckets.`,
      recommendation: 'Clear these items before presenting forecasts externally so advisory guidance is based on trusted numbers.',
    })
  } else if (latest.uncategorizedAmount > 0) {
    alerts.push({
      id: `uncategorized-light-${latest.period}`,
      severity: 'info',
      type: 'uncategorized',
      title: 'A few transactions still need coding',
      description: `$${latest.uncategorizedAmount.toLocaleString()} remains uncategorized in the latest period.`,
      recommendation: 'Resolve the remaining coding exceptions to tighten benchmark and memo accuracy.',
    })
  }

  const daysToMinimum = (() => {
    const below = report.forecast.findIndex((point) => point.expected <= report.minimumBalance)
    if (below === -1) return null
    return (below + 1) * 30
  })()

  if (daysToMinimum !== null) {
    alerts.push({
      id: `runway-${latest.period}`,
      severity: daysToMinimum <= 30 ? 'critical' : 'warning',
      type: 'runway',
      title: `Projected to breach the cash buffer in about ${daysToMinimum} days`,
      description: `Expected cash falls below the minimum target of $${report.minimumBalance.toLocaleString()} within the forecast horizon.`,
      recommendation: 'Discuss collections, spend controls, and short-term financing options now instead of after the cash dip occurs.',
    })
  }

  if (report.health.score < 60) {
    alerts.push({
      id: `health-${latest.period}`,
      severity: report.health.score < 45 ? 'critical' : 'warning',
      type: 'health',
      title: `Financial health score is ${report.health.score}/100`,
      description: `${report.clientName} is currently rated ${report.health.label} with ${report.health.churnRisk} churn risk.`,
      recommendation: 'Use the next client meeting to align on margin improvement, runway protection, and a short list of owner actions.',
    })
  }

  if (latest.netCashFlow > 0 && report.forecast[2] && report.forecast[2].expected > latest.endingCash * 1.1) {
    alerts.push({
      id: `growth-${latest.period}`,
      severity: 'info',
      type: 'growth',
      title: 'Advisory upsell signal: improving cash trajectory',
      description: `The forecast points to stronger cash in the next 90 days than the current close balance.`,
      recommendation: 'Package this improvement into a forward-looking advisory memo and discuss reinvestment or tax planning.',
    })
  }

  return alerts
}

export function buildClientAdvisoryReport(
  client: Client,
  jobs: CategorizationJob[],
): ClientAdvisoryReport {
  const timeline = buildTimeline(jobs)
  const latestMonth = timeline[timeline.length - 1] ?? null
  const latestJob = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const revenueHistory = timeline.map((point) => point.revenue).filter((value) => value > 0)
  const expenseHistory = timeline.map((point) => point.expenses).filter((value) => value > 0)
  const netHistory = timeline.map((point) => point.netCashFlow)
  const currentCash = latestMonth?.endingCash ?? 0
  const baseRevenue = average(revenueHistory.slice(-3)) || average(revenueHistory) || 0
  const baseExpenses = average(expenseHistory.slice(-3)) || average(expenseHistory) || 0
  const volatility = standardDeviation(netHistory.slice(-6)) || Math.max(2500, baseExpenses * 0.12)
  const minimumBalance = roundCurrency(Math.max(5000, baseExpenses * 0.15))
  const forecastModel: AdvisoryForecastModel = {
    baseRevenue,
    baseExpenses,
    revenueTrend: linearTrend(timeline.slice(-6).map((point) => point.revenue)),
    expenseTrend: linearTrend(timeline.slice(-6).map((point) => point.expenses)),
    volatility,
    minimumBalance,
    startCash: currentCash,
    startPeriod: latestMonth?.period ?? monthKey(new Date().toISOString()),
  }
  const forecast = createForecastSeries(forecastModel)
  const health = buildHealthScore(timeline, forecast)
  const benchmarkResults = latestJob ? calcBenchmarks(latestJob, client.industry) : []
  const latest = latestMonth
  const previousMonth = timeline[timeline.length - 2] ?? null
  const yearAgo = timeline.length >= 12 ? timeline[timeline.length - 12] : null
  const burnRate = Math.max(0, average(netHistory.slice(-3)) * -1)
  const runwayMonths = burnRate > 0 ? currentCash / burnRate : null

  const kpis: AdvisoryKpis = {
    grossMargin: latest ? roundMetric(safePct(latest.revenue - latest.cogs, latest.revenue)) : null,
    netMargin: latest ? roundMetric(safePct(latest.netCashFlow, latest.revenue)) : null,
    operatingMargin: latest ? roundMetric(safePct(latest.revenue - latest.cogs - latest.operatingExpenses, latest.revenue)) : null,
    revenueGrowthMoM: latest && previousMonth ? roundMetric(pctChange(latest.revenue, previousMonth.revenue)) : null,
    revenueGrowthYoY: latest && yearAgo ? roundMetric(pctChange(latest.revenue, yearAgo.revenue)) : null,
    currentRatio: null,
    quickRatio: null,
    dso: null,
    burnRate: roundCurrency(burnRate),
    runwayMonths: runwayMonths === null ? null : roundMetric(runwayMonths),
  }

  const assumptions = [
    `Forecast uses ${timeline.length} monthly close${timeline.length === 1 ? '' : 's'} of history and weights the last 3 months most heavily.`,
    `Base monthly revenue is modeled at $${roundCurrency(baseRevenue).toLocaleString()} and expenses at $${roundCurrency(baseExpenses).toLocaleString()}.`,
    `Volatility bands widen based on a trailing cash-flow standard deviation of $${roundCurrency(volatility).toLocaleString()}.`,
  ]

  const report: ClientAdvisoryReport = {
    clientId: client.id,
    clientName: client.business_name,
    industry: client.industry,
    monthsOfHistory: timeline.length,
    currentCash,
    minimumBalance,
    timeline,
    forecastModel,
    forecast,
    forecast30: forecast[0]?.expected ?? currentCash,
    forecast60: forecast[1]?.expected ?? currentCash,
    forecast90: forecast[2]?.expected ?? currentCash,
    assumptions,
    seasonalityNotes: buildSeasonalityNotes(timeline),
    recurringPatterns: buildRecurringPatterns(timeline, jobs),
    benchmarkResults,
    alerts: [],
    health,
    kpis,
    latestMonth,
  }

  report.alerts = buildAlerts({
    clientName: report.clientName,
    timeline: report.timeline,
    forecast: report.forecast,
    minimumBalance: report.minimumBalance,
    health: report.health,
  })

  return report
}

export function advisoryTemplateLabel(template: AdvisoryTemplate): string {
  const labels: Record<AdvisoryTemplate, string> = {
    quarterly_review: 'Quarterly review',
    cash_flow_advisory: 'Cash flow advisory',
    tax_planning: 'Tax planning',
    annual_planning: 'Annual planning',
  }
  return labels[template]
}

export function buildAdvisoryPromptContext(report: ClientAdvisoryReport): string {
  const benchmarkNote = report.benchmarkResults[0]
    ? `${report.benchmarkResults[0].label}: client ${report.benchmarkResults[0].clientPct}% vs benchmark median ${report.benchmarkResults[0].median}%.`
    : 'No benchmark comparison available yet.'

  const recurring = report.recurringPatterns
    .slice(0, 4)
    .map((pattern) => `${pattern.kind === 'revenue' ? 'Revenue' : 'Expense'}: ${pattern.description} (${pattern.cadence}, avg $${Math.abs(pattern.averageAmount).toLocaleString()})`)
    .join('\n')

  return [
    `Client: ${report.clientName}`,
    `Industry: ${report.industry}`,
    `Months of close history: ${report.monthsOfHistory}`,
    `Current cash estimate: $${report.currentCash.toLocaleString()}`,
    `30/60/90 day expected cash: $${report.forecast30.toLocaleString()} / $${report.forecast60.toLocaleString()} / $${report.forecast90.toLocaleString()}`,
    `Health score: ${report.health.score}/100 (${report.health.label}, churn risk ${report.health.churnRisk})`,
    `Gross margin: ${report.kpis.grossMargin ?? 'n/a'}%`,
    `Net margin: ${report.kpis.netMargin ?? 'n/a'}%`,
    `Revenue growth MoM: ${report.kpis.revenueGrowthMoM ?? 'n/a'}%`,
    `Runway months: ${report.kpis.runwayMonths ?? 'n/a'}`,
    `Benchmark highlight: ${benchmarkNote}`,
    `Key alerts:\n${report.alerts.map((alert) => `- ${alert.severity.toUpperCase()}: ${alert.title} — ${alert.description}`).join('\n') || '- None'}`,
    `Recurring patterns:\n${recurring || '- None identified yet.'}`,
    `Forecast assumptions:\n${report.assumptions.map((assumption) => `- ${assumption}`).join('\n')}`,
  ].join('\n')
}
