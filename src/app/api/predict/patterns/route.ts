import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  return NextResponse.json({
    clientId,
    patterns: [
      { id: 'p1', vendor: 'ADP Payroll Processing', amountRange: [12000, 12800], frequency: 'biweekly', category: 'Payroll Expense', reliability: 99.2, monthsData: 18, active: true },
      { id: 'p2', vendor: 'Wells Fargo Rent', amountRange: [4200, 4200], frequency: 'monthly_1st', category: 'Rent Expense', reliability: 100, monthsData: 18, active: true },
      { id: 'p3', vendor: 'Mesa Supplies Inc', amountRange: [2800, 4500], frequency: 'monthly_net30', category: 'COGS', reliability: 94.1, monthsData: 16, active: true },
    ],
    generatedAt: new Date().toISOString(),
  })
}

export async function PUT(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true, updated: body })
}
