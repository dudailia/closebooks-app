import { NextResponse } from 'next/server'

export async function GET() {
  const monthly = [1200, 1500, 1800, 2000, 2100, 2200, 2400, 2600, 2800, 3000, 3100, 3200]
  const totalGross = monthly.reduce((s, v) => s + v, 0)

  return NextResponse.json({
    totalGross,
    firmEarnings: Math.round(totalGross * 0.7),
    platformFee: Math.round(totalGross * 0.3),
    activePortals: 24,
    avgPerClient: 177,
    monthlyHistory: monthly.map((amount, i) => ({
      month: new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      gross: amount,
      firmCut: Math.round(amount * 0.7),
    })),
    nextPayout: {
      amount: 2240,
      date: '2025-12-01',
      bankLast4: '4821',
    },
    clients: [
      { name: 'Smith Construction LLC', plan: 'professional', monthly: 150, firmCut: 105, since: '2024-03-01' },
      { name: 'Bella Vista Restaurant', plan: 'starter', monthly: 75, firmCut: 52.50, since: '2024-06-01' },
      { name: 'Chen Medical Practice', plan: 'professional', monthly: 150, firmCut: 105, since: '2024-07-01' },
    ]
  })
}
