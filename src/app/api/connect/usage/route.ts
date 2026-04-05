import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// GET /api/connect/usage — mock usage data
// ---------------------------------------------------------------------------

function generateDailyCounts(): { date: string; calls: number }[] {
  const days: { date: string; calls: number }[] = []
  const today = new Date('2026-04-05')

  // Realistic wave pattern with weekday/weekend variation
  const base = [
    210, 185, 340, 390, 420, 310, 95,   // week 1
    280, 360, 410, 445, 380, 290, 88,   // week 2
    320, 410, 460, 500, 470, 340, 110,  // week 3
    380, 450, 510, 530, 490, 360, 120,  // week 4
    410, 480,                           // last 2 days
  ]

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push({
      date: d.toISOString().slice(0, 10),
      calls: base[29 - i] ?? 0,
    })
  }
  return days
}

const dailyCounts = generateDailyCounts()

const topEndpoints = [
  {
    endpoint: 'GET /v1/companies/{id}/financials',
    calls: 3241,
    avgLatencyMs: 142,
    errorRate: 0.12,
  },
  {
    endpoint: 'GET /v1/companies/{id}/transactions',
    calls: 2876,
    avgLatencyMs: 98,
    errorRate: 0.08,
  },
  {
    endpoint: 'GET /v1/companies/{id}/health-score',
    calls: 1490,
    avgLatencyMs: 234,
    errorRate: 0.31,
  },
  {
    endpoint: 'POST /v1/companies/{id}/transactions',
    calls: 618,
    avgLatencyMs: 187,
    errorRate: 0.48,
  },
  {
    endpoint: 'GET /v1/companies/{id}/accounts',
    calls: 207,
    avgLatencyMs: 76,
    errorRate: 0.0,
  },
]

export async function GET() {
  const totalThisMonth = dailyCounts.reduce((sum, d) => sum + d.calls, 0)

  return NextResponse.json({
    currentMonth: {
      total: totalThisMonth,
      limit: 10000,
      plan: 'growth',
    },
    daily: dailyCounts,
    topEndpoints,
    billing: {
      plan: 'Growth',
      amount: 499,
      currency: 'USD',
      renewsAt: '2026-05-01',
    },
    rateLimits: {
      free: 1000,
      growth: 10000,
      enterprise: null,
    },
  })
}
