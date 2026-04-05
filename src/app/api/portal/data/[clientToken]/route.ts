import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { clientToken: string } }) {
  // Demo data - in production would look up client by token
  return NextResponse.json({
    clientName: 'Smith Construction LLC',
    firmName: 'Miller CPA',
    cashPosition: 847293,
    cashChange: 12400,
    burnRate: 43200,
    runwayMonths: 19.6,
    monthlyRevenue: 127400,
    revenueChange: 12,
    upcomingObligations: 38500,
    lastUpdated: new Date().toISOString(),
  })
}
