import { NextRequest, NextResponse } from 'next/server'
import type { CategorizationJob } from '@/types'

// ─── Linear regression (y = a + b*x) ─────────────────────────────────────────

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length
  if (n === 0) return { slope: 0, intercept: 0 }
  const xs = values.map((_, i) => i)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * values[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { jobs: CategorizationJob[]; clientName: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { jobs } = body

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return NextResponse.json({
      nextMonthForecast: { totalExpenses: 0, topCategories: [] },
      cashTrend: 'stable',
      runwayNote: null,
    })
  }

  // Sort by created_at ascending, take last 3
  const sorted = [...jobs]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-3)

  // Monthly expense totals
  const expenseTotals = sorted.map((j) =>
    j.transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
  )

  const creditTotals = sorted.map((j) =>
    j.transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
  )

  // Linear regression to forecast next month's expenses
  const { slope, intercept } = linearRegression(expenseTotals)
  const nextMonthExpenses = Math.max(0, intercept + slope * sorted.length)

  // Top categories for the most recent job (as forecast proxy)
  const latestJob = sorted[sorted.length - 1]
  const categoryMap: Record<string, number> = {}
  for (const t of latestJob.transactions.filter((tx) => tx.type === 'debit')) {
    const cat = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    categoryMap[cat] = (categoryMap[cat] ?? 0) + t.amount
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }))

  // Cash trend detection
  let cashTrend: 'improving' | 'stable' | 'declining' = 'stable'

  if (expenseTotals.length >= 2) {
    const last = expenseTotals.length
    const pct1 =
      expenseTotals[last - 2] > 0
        ? (expenseTotals[last - 1] - expenseTotals[last - 2]) / expenseTotals[last - 2]
        : 0

    if (expenseTotals.length >= 3) {
      const pct0 =
        expenseTotals[last - 3] > 0
          ? (expenseTotals[last - 2] - expenseTotals[last - 3]) / expenseTotals[last - 3]
          : 0

      // Both months increasing >10%: declining
      if (pct0 > 0.1 && pct1 > 0.1) {
        cashTrend = 'declining'
      } else if (pct0 < 0 && pct1 < 0) {
        cashTrend = 'improving'
      }
    } else {
      if (pct1 > 0.1) cashTrend = 'declining'
      else if (pct1 < 0) cashTrend = 'improving'
    }
  }

  // Runway note: count trailing consecutive deficit months (expenses > income)
  let runwayNote: string | null = null
  let consecutiveDeficits = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (creditTotals[i] < expenseTotals[i]) {
      consecutiveDeficits++
    } else {
      break
    }
  }

  if (consecutiveDeficits >= 2) {
    const deficitSlice = sorted.slice(sorted.length - consecutiveDeficits)
    const avgDeficit =
      deficitSlice.reduce((s, _, i) => {
        const idx = sorted.length - consecutiveDeficits + i
        return s + (expenseTotals[idx] - creditTotals[idx])
      }, 0) / consecutiveDeficits
    runwayNote = `Expenses have exceeded income for ${consecutiveDeficits} consecutive month${consecutiveDeficits !== 1 ? 's' : ''}. Average monthly shortfall: $${avgDeficit.toFixed(2)}. Review cash reserves and consider reducing discretionary spending.`
  }

  return NextResponse.json({
    nextMonthForecast: {
      totalExpenses: Math.round(nextMonthExpenses * 100) / 100,
      topCategories,
    },
    cashTrend,
    runwayNote,
  })
}
