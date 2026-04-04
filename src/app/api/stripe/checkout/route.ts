import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

interface RequestBody {
  priceId: string
  customerEmail?: string
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.priceId === 'string' &&
    b.priceId.trim().length > 0 &&
    (b.customerEmail === undefined || typeof b.customerEmail === 'string')
  )
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 })
  }

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

  const { priceId, customerEmail } = body

  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url:  `${origin}/pricing?payment=cancelled`,
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
