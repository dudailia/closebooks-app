import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Portal data endpoint — looks up a client by their secure share token.
// Falls back to demo data when Supabase is not configured (development mode).
// ---------------------------------------------------------------------------

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || (!serviceKey && !anonKey)) return null
  return createClient(url, serviceKey ?? anonKey!)
}

const DEMO_TOKEN = 'demo'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientToken: string } }
) {
  const { clientToken } = params

  if (!clientToken) {
    return NextResponse.json({ error: 'Missing client token.' }, { status: 400 })
  }

  const supabase = getSupabase()

  if (supabase && clientToken !== DEMO_TOKEN) {
    const { data, error } = await supabase
      .from('portal_tokens')
      .select(`
        client_name,
        firm_name,
        cash_position,
        cash_change,
        burn_rate,
        runway_months,
        monthly_revenue,
        revenue_change,
        upcoming_obligations,
        updated_at
      `)
      .eq('token', clientToken)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[portal/data] Supabase error:', error.message)
      return NextResponse.json({ error: 'Failed to retrieve portal data.' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Invalid or expired portal link.' }, { status: 404 })
    }

    return NextResponse.json({
      clientName:           data.client_name,
      firmName:             data.firm_name,
      cashPosition:         data.cash_position,
      cashChange:           data.cash_change,
      burnRate:             data.burn_rate,
      runwayMonths:         data.runway_months,
      monthlyRevenue:       data.monthly_revenue,
      revenueChange:        data.revenue_change,
      upcomingObligations:  data.upcoming_obligations,
      lastUpdated:          data.updated_at ?? new Date().toISOString(),
    })
  }

  // Demo / development fallback
  return NextResponse.json({
    clientName:          'Smith Construction LLC',
    firmName:            'Miller CPA',
    cashPosition:        847293,
    cashChange:          12400,
    burnRate:            43200,
    runwayMonths:        19.6,
    monthlyRevenue:      127400,
    revenueChange:       12,
    upcomingObligations: 38500,
    lastUpdated:         new Date().toISOString(),
  })
}
