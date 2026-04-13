import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const user = await getUserFromRequest(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'Sign in to manage billing.' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ error: 'Billing lookup requires Supabase.' }, { status: 503 })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, status')
    .eq('customer_email', user.email.toLowerCase())
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const customerId = sub?.stripe_customer_id as string | undefined
  if (!customerId || customerId === 'unknown') {
    return NextResponse.json(
      { error: 'No active subscription found. Subscribe from Pricing first.' },
      { status: 404 }
    )
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' })
  const origin = request.headers.get('origin') ?? request.nextUrl.origin

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/subscription`,
    })
    if (!portal.url) {
      return NextResponse.json({ error: 'Could not create portal session.' }, { status: 500 })
    }
    return NextResponse.json({ url: portal.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error.'
    console.error('[/api/stripe/portal]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
