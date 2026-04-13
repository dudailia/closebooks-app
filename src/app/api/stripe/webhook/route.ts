import type Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase helper — uses service-role key when available, falls back to anon.
// Webhook handlers are not user-scoped, so we need elevated access.
// ---------------------------------------------------------------------------

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || (!serviceKey && !anonKey)) return null
  return createSupabaseClient(url, serviceKey ?? anonKey!)
}

export async function POST(request: NextRequest) {
  const key    = process.env.STRIPE_SECRET_KEY
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!key || !secret) {
    console.error('[webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Stripe not configured yet' }, { status: 503 })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' })

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed.'
    console.error('[webhook] Signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log(`[webhook] Received event: ${event.type} (${event.id})`)

  const supabase = getSupabase()

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

      const planSlug =
        typeof session.metadata?.plan_slug === 'string' ? session.metadata.plan_slug : null

      if (supabase) {
        const { error } = await supabase.from('subscriptions').upsert({
          stripe_customer_id:    customerId,
          stripe_subscription_id: subscriptionId,
          customer_email:        customerEmail,
          status:                'active',
          amount_total:          session.amount_total,
          currency:              session.currency,
          checkout_session_id:   session.id,
          plan_slug:             planSlug,
          created_at:            new Date().toISOString(),
          updated_at:            new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        if (error) console.error('[webhook] Supabase upsert (checkout) failed:', error.message)
        else console.log('[webhook] Subscription persisted to Supabase:', subscriptionId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      console.log('[webhook] subscription updated:', {
        subscriptionId: sub.id,
        status:         sub.status,
        customerId:     sub.customer,
      })

      const planSlug =
        typeof sub.metadata?.plan_slug === 'string' ? sub.metadata.plan_slug : undefined

      if (supabase) {
        const { error } = await supabase.from('subscriptions').upsert({
          stripe_subscription_id: sub.id,
          stripe_customer_id:    typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          status:                sub.status,
          ...(planSlug ? { plan_slug: planSlug } : {}),
          updated_at:            new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        if (error) console.error('[webhook] Supabase upsert (sub updated) failed:', error.message)
        else console.log('[webhook] Subscription status updated in Supabase:', sub.id, sub.status)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log('[webhook] subscription cancelled:', {
        subscriptionId: sub.id,
        customerId:     sub.customer,
      })

      if (supabase) {
        const { error } = await supabase.from('subscriptions').upsert({
          stripe_subscription_id: sub.id,
          stripe_customer_id:    typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          status:                'canceled',
          updated_at:            new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' })

        if (error) console.error('[webhook] Supabase upsert (sub deleted) failed:', error.message)
        else console.log('[webhook] Subscription marked canceled in Supabase:', sub.id)
      }
      break
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
