import type { Transaction } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ClientMetrics {
  cashBalance: number
  monthlyBurn: number
  arDays: number
  runwayDays: number
  status: 'green' | 'yellow' | 'red'
}

export interface ForecastPoint {
  date: string
  balance: number
  low: number
  high: number
}

export interface HistoricalPoint {
  date: string
  balance: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Returns transactions within the last N months (approximate via days). */
function recentTransactions(transactions: Transaction[], months: number): Transaction[] {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const cutoffStr = formatDate(cutoff)
  return transactions.filter((t) => t.date >= cutoffStr)
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateMonthlyBurn
// Average monthly net outflow over the last 3 months.
// ─────────────────────────────────────────────────────────────────────────────

export function calculateMonthlyBurn(transactions: Transaction[]): number {
  const recent = recentTransactions(transactions, 3)
  if (recent.length === 0) return 0

  const totalDebits = recent
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalCredits = recent
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBurn = totalDebits - totalCredits
  return Math.max(0, netBurn / 3)
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateCashRunway
// ─────────────────────────────────────────────────────────────────────────────

export function calculateCashRunway(cashBalance: number, monthlyBurn: number): number {
  if (monthlyBurn <= 0) return 365 // No burn → essentially infinite (cap at 365)
  return Math.round((cashBalance / monthlyBurn) * 30)
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateArDays
// Estimates average receivables days from credit transactions.
// ─────────────────────────────────────────────────────────────────────────────

export function calculateArDays(transactions: Transaction[]): number {
  const recent = recentTransactions(transactions, 3)
  if (recent.length === 0) return 0

  const credits = recent.filter((t) => t.type === 'credit')
  if (credits.length === 0) return 0

  const avgDailyRevenue =
    credits.reduce((sum, t) => sum + t.amount, 0) / 90

  if (avgDailyRevenue <= 0) return 0

  // Use outstanding-ish estimate: average credit amount / daily rate
  const avgCreditAmount =
    credits.reduce((sum, t) => sum + t.amount, 0) / credits.length

  return Math.round(avgCreditAmount / avgDailyRevenue)
}

// ─────────────────────────────────────────────────────────────────────────────
// generateSparkline
// Returns monthly net cash balance for the last N months.
// ─────────────────────────────────────────────────────────────────────────────

export function generateSparkline(
  transactions: Transaction[],
  months: number = 6
): number[] {
  const result: number[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const startStr = formatDate(start)
    const endStr = formatDate(end)

    const monthTx = transactions.filter(
      (t) => t.date >= startStr && t.date <= endStr
    )
    const credits = monthTx
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    const debits = monthTx
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    result.push(credits - debits)
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// detectStatus
// ─────────────────────────────────────────────────────────────────────────────

export function detectStatus(metrics: ClientMetrics): 'green' | 'yellow' | 'red' {
  const { runwayDays, arDays, cashBalance } = metrics

  if (cashBalance <= 0 || runwayDays < 30) return 'red'
  if (runwayDays < 90 || arDays > 60) return 'yellow'
  return 'green'
}

// ─────────────────────────────────────────────────────────────────────────────
// generateForecastData
// Projects 90 days forward based on recent burn rate with noise.
// ─────────────────────────────────────────────────────────────────────────────

export function generateForecastData(
  transactions: Transaction[],
  currentBalance: number
): ForecastPoint[] {
  const monthlyBurn = calculateMonthlyBurn(transactions)
  const dailyBurn = monthlyBurn / 30
  const today = new Date()

  // Estimate daily volatility based on transaction variance
  const recent = recentTransactions(transactions, 3)
  const amounts = recent.map((t) =>
    t.type === 'debit' ? -t.amount : t.amount
  )
  const mean =
    amounts.length > 0
      ? amounts.reduce((a, b) => a + b, 0) / amounts.length
      : 0
  const variance =
    amounts.length > 1
      ? amounts.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        amounts.length
      : 1000
  const stdDev = Math.sqrt(variance)
  const dailyStdDev = stdDev / 30

  const points: ForecastPoint[] = []
  let balance = currentBalance

  for (let d = 1; d <= 90; d++) {
    const date = formatDate(addDays(today, d))
    balance -= dailyBurn
    const band = dailyStdDev * Math.sqrt(d)
    points.push({
      date,
      balance: Math.max(0, balance),
      low: Math.max(0, balance - band * 1.96),
      high: balance + band * 1.96,
    })
  }

  return points
}

// ─────────────────────────────────────────────────────────────────────────────
// generateHistoricalData
// Returns last 60 days of rolling balance.
// ─────────────────────────────────────────────────────────────────────────────

export function generateHistoricalData(
  transactions: Transaction[],
  currentBalance: number
): HistoricalPoint[] {
  const today = new Date()
  const points: HistoricalPoint[] = []

  // Sort transactions descending
  const sorted = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  let runningBalance = currentBalance

  for (let d = 0; d <= 60; d++) {
    const date = formatDate(addDays(today, -d))
    const dayTx = sorted.filter((t) => t.date === date)
    // Walk backward: undo the day's transactions
    for (const tx of dayTx) {
      if (tx.type === 'credit') runningBalance -= tx.amount
      else runningBalance += tx.amount
    }
    points.unshift({ date, balance: Math.max(0, runningBalance) })
  }

  return points
}

// ─────────────────────────────────────────────────────────────────────────────
// estimateCashBalance
// Sum of all credits minus all debits — rough cash position.
// ─────────────────────────────────────────────────────────────────────────────

export function estimateCashBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => {
    return t.type === 'credit' ? sum + t.amount : sum - t.amount
  }, 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// Synthetic data generator for demo purposes
// ─────────────────────────────────────────────────────────────────────────────

export interface SyntheticClientData {
  cashBalance: number
  monthlyBurn: number
  arDays: number
  runwayDays: number
  status: 'green' | 'yellow' | 'red'
  sparkline: number[]
  riskFlags: string[]
  transactions: Transaction[]
}

export function generateSyntheticClientData(
  clientName: string,
  seed: number = 0
): SyntheticClientData {
  // Deterministic pseudo-random from seed
  const rng = (offset: number = 0): number => {
    const x = Math.sin(seed + offset + clientName.length * 7) * 10000
    return x - Math.floor(x)
  }

  const statusRoll = rng(1)
  const status: 'green' | 'yellow' | 'red' =
    statusRoll < 0.3 ? 'red' : statusRoll < 0.55 ? 'yellow' : 'green'

  const cashBalance =
    status === 'red'
      ? 5000 + rng(2) * 15000
      : status === 'yellow'
      ? 20000 + rng(2) * 40000
      : 80000 + rng(2) * 120000

  const monthlyBurn =
    status === 'red'
      ? 15000 + rng(3) * 20000
      : status === 'yellow'
      ? 8000 + rng(3) * 12000
      : 5000 + rng(3) * 8000

  const arDays =
    status === 'red'
      ? 60 + Math.round(rng(4) * 30)
      : status === 'yellow'
      ? 35 + Math.round(rng(4) * 25)
      : 15 + Math.round(rng(4) * 20)

  const runwayDays = calculateCashRunway(cashBalance, monthlyBurn)

  // Generate 6-month sparkline
  const baseBalance = cashBalance * (0.8 + rng(5) * 0.4)
  const sparkline = Array.from({ length: 6 }, (_, i) => {
    const trend = status === 'red' ? -1 : status === 'yellow' ? -0.3 : 0.2
    return (
      baseBalance +
      trend * baseBalance * (i / 5) +
      (rng(6 + i) - 0.5) * baseBalance * 0.15
    )
  })

  const riskFlags: string[] = []
  if (runwayDays < 30) riskFlags.push('Cash runway below 30 days — urgent action needed')
  if (runwayDays < 90) riskFlags.push(`Only ${runwayDays} days of runway at current burn rate`)
  if (arDays > 60) riskFlags.push(`AR Days at ${arDays} — collections significantly overdue`)
  if (arDays > 45) riskFlags.push('Outstanding receivables slowing cash cycle')
  if (monthlyBurn > cashBalance * 0.2) riskFlags.push('Monthly burn exceeds 20% of cash balance')
  if (status === 'red') riskFlags.push('Immediate financial review recommended')
  if (riskFlags.length === 0) riskFlags.push('No significant risk flags detected')

  // Generate synthetic transactions
  const today = new Date()
  const transactions: Transaction[] = []
  const categories = [
    'Payroll', 'Rent', 'Software Subscriptions', 'Marketing', 'Office Supplies',
    'Client Revenue', 'Consulting Income', 'Refunds', 'Utilities', 'Insurance',
  ]

  for (let i = 0; i < 60; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - Math.round(rng(10 + i) * 180))
    const isCredit = rng(11 + i) > 0.45
    const catIdx = Math.floor(rng(12 + i) * categories.length)
    const amount =
      isCredit
        ? 500 + rng(13 + i) * 15000
        : 200 + rng(13 + i) * 8000

    transactions.push({
      id: `synth-${clientName}-${i}`,
      date: date.toISOString().slice(0, 10),
      description: `${categories[catIdx]} - ${clientName}`,
      amount: Math.round(amount * 100) / 100,
      type: isCredit ? 'credit' : 'debit',
      original_description: categories[catIdx],
      suggested_category: categories[catIdx],
      suggested_account_code: isCredit ? '4000' : '6000',
      confidence: 0.85 + rng(14 + i) * 0.1,
      status: 'approved',
      final_category: categories[catIdx],
    })
  }

  return {
    cashBalance: Math.round(cashBalance),
    monthlyBurn: Math.round(monthlyBurn),
    arDays,
    runwayDays,
    status,
    sparkline,
    riskFlags,
    transactions,
  }
}
