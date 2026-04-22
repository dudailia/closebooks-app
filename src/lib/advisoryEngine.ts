import type { CategorizationJob, Client, Transaction } from '@/types'

export type ForecastPoint = {
  date: string
  historical: number | null
  expected: number | null
  optimistic: number | null
  pessimistic: number | null
}

export type AdvisoryAlertSeverity = 'info' | 'warning' | 'critical'

export type AdvisoryAlert = {
  id: string
  title: string
  description: string
  severity: AdvisoryAlertSeverity
  recommendation: string
}

export type KpiSnapshot = {
  grossMargin: number
  netMargin: number
  operatingMargin: number
  revenueGrowthMoM: number
  revenueGrowthYoY: number
  dso: number
  burnRate: number
  runwayMonths: number
  currentRatio: number
  quickRatio: number
}

export type ClientScore = {
  overall: number
  profitability: number
  liquidity: number
  growth: number
  compliance: number
  churnRisk: 'low' | 'medium' | 'high'
}

export const MEMO_TEMPLATES = {
  quarterly: 'Quarterly review',
  annual: 'Annual planning',
  cashflow: 'Cash flow advisory',
  tax: 'Tax planning',
} as const

function normalizeCategory(tx: Transaction): string {
  return (tx.final_category || tx.suggested_category || '').toLowerCase()
}

function isRevenue(tx: Transaction): boolean {
  const c = normalizeCategory(tx)
  return tx.amount > 0 || c.includes('revenue') || c.includes('sales') || c.includes('income')
}

function isCogs(tx: Transaction): boolean {
  const c = normalizeCategory(tx)
  return c.includes('cogs') || c.includes('cost of goods') || c.includes('materials')
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function toMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function addMonths(isoMonth: string, delta: number): string {
  const [y, m] = isoMonth.split('-').map(Number)
  const next = new Date(y, m - 1 + delta, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}

export function flattenClientTransactions(jobs: CategorizationJob[]): Transaction[] {
  return jobs.flatMap((j) => j.transactions).sort((a, b) => a.date.localeCompare(b.date))
}

export function buildCashFlowForecast(transactions: Transaction[], scenarioRevenueImpact = 0): {
  points: ForecastPoint[]
  assumptions: string[]
  recurringRevenue: number
  recurringExpenses: number
  minBalanceAmount: number
  minBalanceEtaDays: number
} {
  const monthly = new Map<string, { revenue: number; expenses: number; net: number }>()
  for (const tx of transactions) {
    const key = monthKey(tx.date)
    const bucket = monthly.get(key) ?? { revenue: 0, expenses: 0, net: 0 }
    const amount = tx.amount
    if (isRevenue(tx)) bucket.revenue += Math.abs(amount)
    else bucket.expenses += Math.abs(amount)
    bucket.net += amount
    monthly.set(key, bucket)
  }

  const keys = Array.from(monthly.keys()).sort()
  const last12 = keys.slice(-12)
  const revAvg = last12.reduce((s, k) => s + (monthly.get(k)?.revenue ?? 0), 0) / Math.max(last12.length, 1)
  const expAvg = last12.reduce((s, k) => s + (monthly.get(k)?.expenses ?? 0), 0) / Math.max(last12.length, 1)
  const seasonality = last12.map((k) => (monthly.get(k)?.net ?? 0) - (revAvg - expAvg))
  const seasonalAvg = seasonality.length ? seasonality.reduce((a, b) => a + b, 0) / seasonality.length : 0

  const revenueAdjusted = revAvg * (1 + scenarioRevenueImpact)
  const netBase = revenueAdjusted - expAvg
  let runningBalance = Math.max(15000, expAvg * 1.2)

  const points: ForecastPoint[] = []
  for (const k of last12) {
    runningBalance += monthly.get(k)?.net ?? 0
    points.push({
      date: toMonthLabel(k),
      historical: runningBalance,
      expected: null,
      optimistic: null,
      pessimistic: null,
    })
  }

  let minBalance = Number.POSITIVE_INFINITY
  let minIdx = 0
  for (let i = 1; i <= 3; i++) {
    const month = addMonths(keys[keys.length - 1] ?? monthKey(new Date().toISOString()), i)
    const expectedNet = netBase + seasonalAvg * (i / 3)
    const optimisticNet = expectedNet + expAvg * 0.08
    const pessimisticNet = expectedNet - expAvg * 0.12
    runningBalance += expectedNet
    if (runningBalance < minBalance) {
      minBalance = runningBalance
      minIdx = i
    }
    points.push({
      date: toMonthLabel(month),
      historical: null,
      expected: runningBalance,
      optimistic: runningBalance + optimisticNet,
      pessimistic: runningBalance + pessimisticNet,
    })
  }

  return {
    points,
    assumptions: [
      `Forecast uses ${last12.length} months of transaction history`,
      `Recurring revenue baseline: $${Math.round(revAvg).toLocaleString()}/month`,
      `Recurring expense baseline: $${Math.round(expAvg).toLocaleString()}/month`,
      `Scenario revenue impact: ${(scenarioRevenueImpact * 100).toFixed(0)}%`,
    ],
    recurringRevenue: revAvg,
    recurringExpenses: expAvg,
    minBalanceAmount: Math.max(0, minBalance),
    minBalanceEtaDays: minIdx * 30,
  }
}

export function calculateKpis(transactions: Transaction[]): KpiSnapshot {
  const now = new Date()
  const currMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevMonth = addMonths(currMonth, -1)
  const prevYearMonth = addMonths(currMonth, -12)

  const byMonth = new Map<string, { revenue: number; expenses: number; cogs: number; ar: number }>()
  for (const tx of transactions) {
    const k = monthKey(tx.date)
    const b = byMonth.get(k) ?? { revenue: 0, expenses: 0, cogs: 0, ar: 0 }
    if (isRevenue(tx)) {
      b.revenue += Math.abs(tx.amount)
      b.ar += Math.abs(tx.amount) * 0.35
    } else {
      b.expenses += Math.abs(tx.amount)
      if (isCogs(tx)) b.cogs += Math.abs(tx.amount)
    }
    byMonth.set(k, b)
  }

  const curr = byMonth.get(currMonth) ?? { revenue: 1, expenses: 0, cogs: 0, ar: 0 }
  const prev = byMonth.get(prevMonth) ?? curr
  const yoy = byMonth.get(prevYearMonth) ?? prev

  const grossProfit = curr.revenue - curr.cogs
  const netProfit = curr.revenue - curr.expenses
  const operatingProfit = curr.revenue - (curr.expenses - curr.cogs * 0.5)
  const avgDailyRev = curr.revenue / 30

  return {
    grossMargin: grossProfit / Math.max(curr.revenue, 1),
    netMargin: netProfit / Math.max(curr.revenue, 1),
    operatingMargin: operatingProfit / Math.max(curr.revenue, 1),
    revenueGrowthMoM: (curr.revenue - prev.revenue) / Math.max(prev.revenue, 1),
    revenueGrowthYoY: (curr.revenue - yoy.revenue) / Math.max(yoy.revenue, 1),
    dso: curr.ar / Math.max(avgDailyRev, 1),
    burnRate: Math.max(0, curr.expenses - curr.revenue),
    runwayMonths: Math.max(0, (curr.revenue * 2.4) / Math.max(curr.expenses - curr.revenue, 1)),
    currentRatio: (curr.revenue * 0.55) / Math.max(curr.expenses * 0.35, 1),
    quickRatio: (curr.revenue * 0.35) / Math.max(curr.expenses * 0.35, 1),
  }
}

export function generateProactiveAlerts(client: Client, kpi: KpiSnapshot, uncategorizedAmount: number): AdvisoryAlert[] {
  const alerts: AdvisoryAlert[] = []
  if (kpi.revenueGrowthMoM < -0.15) alerts.push({
    id: `${client.id}-rev-drop`,
    title: `${client.business_name} revenue down ${Math.round(Math.abs(kpi.revenueGrowthMoM) * 100)}% MoM`,
    description: 'Downward trend has persisted through recent closes.',
    severity: 'warning',
    recommendation: 'Schedule a 30-minute advisory call and review sales pipeline assumptions.',
  })
  if (kpi.burnRate > 0) alerts.push({
    id: `${client.id}-burn`,
    title: `${client.business_name} is burning ~$${Math.round(kpi.burnRate).toLocaleString()}/mo`,
    description: `Projected runway is ${kpi.runwayMonths.toFixed(1)} months.`,
    severity: kpi.runwayMonths < 6 ? 'critical' : 'warning',
    recommendation: 'Prepare cash preservation plan and price optimization recommendations.',
  })
  if (uncategorizedAmount > 50000) alerts.push({
    id: `${client.id}-uncat`,
    title: `${client.business_name} has $${Math.round(uncategorizedAmount).toLocaleString()} uncategorized`,
    description: 'Large uncategorized balance is limiting KPI reliability.',
    severity: 'critical',
    recommendation: 'Prioritize coding cleanup before sending quarterly advisory memo.',
  })
  if (kpi.quickRatio < 1) alerts.push({
    id: `${client.id}-liq`,
    title: `${client.business_name} quick ratio below 1.0`,
    description: 'Short-term liabilities are outpacing liquid assets.',
    severity: 'info',
    recommendation: 'Review payment timing and recommend AR acceleration tactics.',
  })
  return alerts
}

export function scoreClientHealth(kpi: KpiSnapshot): ClientScore {
  const profitability = Math.max(0, Math.min(100, 50 + kpi.netMargin * 100))
  const liquidity = Math.max(0, Math.min(100, kpi.quickRatio * 50))
  const growth = Math.max(0, Math.min(100, 50 + kpi.revenueGrowthYoY * 100))
  const compliance = kpi.dso < 45 ? 88 : kpi.dso < 60 ? 72 : 55
  const overall = Math.round((profitability * 0.3) + (liquidity * 0.25) + (growth * 0.25) + (compliance * 0.2))
  const churnRisk: ClientScore['churnRisk'] = overall < 55 ? 'high' : overall < 75 ? 'medium' : 'low'

  return { overall, profitability, liquidity, growth, compliance, churnRisk }
}

export function buildAdvisoryMemoPrompt(input: {
  clientName: string
  industry: string
  kpi: KpiSnapshot
  forecastSummary: string
  template: keyof typeof MEMO_TEMPLATES
}): string {
  return `You are a senior CPA advisory lead. Produce a firm-branded memo using the "${MEMO_TEMPLATES[input.template]}" template.

Client: ${input.clientName}
Industry: ${input.industry}
KPI summary:
- Gross margin: ${(input.kpi.grossMargin * 100).toFixed(1)}%
- Net margin: ${(input.kpi.netMargin * 100).toFixed(1)}%
- Revenue growth MoM: ${(input.kpi.revenueGrowthMoM * 100).toFixed(1)}%
- Revenue growth YoY: ${(input.kpi.revenueGrowthYoY * 100).toFixed(1)}%
- DSO: ${input.kpi.dso.toFixed(1)} days
- Burn rate: $${Math.round(input.kpi.burnRate).toLocaleString()}/month

Cash forecast summary: ${input.forecastSummary}

Required sections:
1) Executive Summary
2) Key trends and concerns
3) 2-3 specific recommendations with timeline
4) Tax planning opportunities based on current trajectory
Tone: concise, confident, partner-level.`
}
