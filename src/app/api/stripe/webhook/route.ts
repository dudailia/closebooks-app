import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

// Stripe requires the raw body for webhook signature verification.
// Next.js App Router gives us the raw request — we must NOT call .json() first.
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed.'
    console.error('[webhook] Signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log(`[webhook] Received event: ${event.type} (${event.id})`)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerEmail  = session.customer_email ?? session.customer_details?.email ?? 'unknown'
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? 'unknown'
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? 'unknown'

      console.log('[webhook] checkout.session.completed:', {
        sessionId:      session.id,
        customerEmail,
        customerId,
        subscriptionId,
        amountTotal:    session.amount_total,
        currency:       session.currency,
      })

      // TODO: persist to Supabase — store customer_id + subscription_id against the user record
      // const supabase = createClient()
      // await supabase.from('subscriptions').upsert({ email: customerEmail, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, status: 'active' })

      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      console.log('[webhook] subscription updated:', {
        subscriptionId: sub.id,
        status:         sub.status,
        customerId:     sub.customer,
      })
      // TODO: update subscription status in Supabase
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log('[webhook] subscription cancelled:', {
        subscriptionId: sub.id,
        customerId:     sub.customer,
      })
      // TODO: revoke access in Supabase
      break
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
