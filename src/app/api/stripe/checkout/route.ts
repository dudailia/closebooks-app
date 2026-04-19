import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

export const dynamic = 'force-dynamic'

interface RequestBody {
  priceId: string
  customerEmail?: string
  /** starter | professional | enterprise */
  planSlug?: string
  /** month | year */
  billingInterval?: 'month' | 'year'
}

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.priceId === 'string' &&
    b.priceId.trim().length > 0 &&
    (b.customerEmail === undefined || typeof b.customerEmail === 'string') &&
    (b.planSlug === undefined || typeof b.planSlug === 'string') &&
    (b.billingInterval === undefined || b.billingInterval === 'month' || b.billingInterval === 'year')
  )
}

export async function POST(request: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json({ error: 'Stripe not configured yet' }, { status: 503 })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: 'Request must include priceId (string).' }, { status: 422 })
  }

  const { priceId, customerEmail: bodyEmail, planSlug, billingInterval } = body
  const user = await getUserFromRequest(request)
  const email = (user?.email ?? bodyEmail ?? '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Sign in or provide an email for checkout.' }, { status: 400 })
  }

  let firmId: string | null = null
  const supabase = getSupabaseService()
  if (supabase && user?.id) {
    const { data: firm } = await supabase.from('firms').select('id').eq('owner_id', user.id).maybeSingle()
    firmId = firm?.id ?? null
  }

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'
  const meta = {
    plan_slug: planSlug ?? 'unknown',
    product: 'closebooks',
    firm_id: firmId ?? '',
    billing_interval: billingInterval ?? 'month',
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: meta,
      subscription_data: {
        metadata: meta,
        trial_period_days: 14,
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error.'
    console.error('[/api/stripe/checkout]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
