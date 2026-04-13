import { NextRequest, NextResponse } from 'next/server'

interface RequestBody {
  priceId: string
  customerEmail?: string
  /** Matches CloseBooks plan for webhook + in-app unlock (starter | growth). */
  planSlug?: 'starter' | 'growth'
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  const planOk =
    b.planSlug === undefined ||
    b.planSlug === 'starter' ||
    b.planSlug === 'growth'
  return (
    typeof b.priceId === 'string' &&
    b.priceId.trim().length > 0 &&
    (b.customerEmail === undefined || typeof b.customerEmail === 'string') &&
    planOk
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
    return NextResponse.json(
      { error: 'Request must include priceId (string).' },
      { status: 422 }
    )
  }

  const { priceId, customerEmail, planSlug } = body
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'
  const meta = { plan_slug: planSlug ?? 'unknown', product: 'closebooks' }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: meta,
      subscription_data: {
        metadata: meta,
        // Billing trial is optional; app also offers first 5 closes free in-product.
        trial_period_days: 14,
      },
      success_url: `${origin}/dashboard/subscription?payment=success`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
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
