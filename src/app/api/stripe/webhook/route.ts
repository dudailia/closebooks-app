import type Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { parsePlanSlug } from '@/lib/plans'

export const dynamic = 'force-dynamic'

const GRACE_MS = 7 * 86400000

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createSupabaseClient(url, serviceKey)
}

function tierFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null
  const pairs: [string | undefined, string][] = [
    [process.env.STRIPE_PRICE_STARTER_MONTH, 'starter'],
    [process.env.STRIPE_PRICE_STARTER_YEAR, 'starter'],
    [process.env.STRIPE_PRICE_PRO_MONTH, 'professional'],
    [process.env.STRIPE_PRICE_PRO_YEAR, 'professional'],
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTH, 'enterprise'],
    [process.env.STRIPE_PRICE_ENTERPRISE_YEAR, 'enterprise'],
  ]
  for (const [envId, tier] of pairs) {
    if (envId && envId === priceId) return tier
  }
  return null
}

async function upsertFromStripeSubscription(
  stripe: Stripe,
  supabase: ReturnType<typeof createSupabaseClient>,
  sub: Stripe.Subscription
) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const item = sub.items.data[0]
  const priceId = item?.price?.id
  const interval = item?.price?.recurring?.interval === 'year' ? 'year' : 'month'

  let planSlug =
    typeof sub.metadata?.plan_slug === 'string' && sub.metadata.plan_slug && sub.metadata.plan_slug !== 'unknown'
      ? sub.metadata.plan_slug
      : null
  const fromPrice = tierFromPriceId(priceId)
  if (fromPrice) planSlug = fromPrice
  const parsed = parsePlanSlug(planSlug ?? '')
  const finalSlug = parsed ?? planSlug ?? 'unknown'

  const cust = await stripe.customers.retrieve(customerId)
  const email =
    typeof cust !== 'string' && !cust.deleted && 'email' in cust && cust.email
      ? String(cust.email).toLowerCase()
      : null

  let firmId: string | null =
    typeof sub.metadata?.firm_id === 'string' && sub.metadata.firm_id.length > 0
      ? sub.metadata.firm_id
      : null

  const status = sub.status
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
  const currentPeriodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null

  let paymentFailedAt: string | null = null
  let gracePeriodEnd: string | null = null
  if (status === 'past_due' || status === 'unpaid') {
    paymentFailedAt = new Date().toISOString()
    gracePeriodEnd = new Date(Date.now() + GRACE_MS).toISOString()
  }
  if (status === 'active' || status === 'trialing') {
    paymentFailedAt = null
    gracePeriodEnd = null
  }

  const row = {
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    customer_email: email ?? 'unknown',
    status,
    plan_slug: finalSlug,
    stripe_price_id: priceId ?? null,
    billing_interval: interval,
    current_period_end: currentPeriodEnd,
    trial_end: trialEnd,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    payment_failed_at: paymentFailedAt,
    grace_period_end: gracePeriodEnd,
    firm_id: firmId,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('subscriptions').upsert(row, {
    onConflict: 'stripe_subscription_id',
  })
  if (error) console.error('[webhook] upsert subscription failed:', error.message)
  else console.log('[webhook] subscription row saved:', sub.id, status)
}

export async function POST(request: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
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
    console.error('[webhook] verify failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ received: true, warning: 'no supabase' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertFromStripeSubscription(stripe, supabase, sub)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        await upsertFromStripeSubscription(stripe, supabase, sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const graceEnd = new Date(Date.now() + GRACE_MS).toISOString()
        await supabase.from('subscriptions').upsert(
          {
            stripe_subscription_id: sub.id,
            stripe_customer_id:
              typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            status: 'canceled',
            grace_period_end: graceEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' }
        )
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id
        if (subId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              payment_failed_at: new Date().toISOString(),
              grace_period_end: new Date(Date.now() + GRACE_MS).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subId)
        }
        break
      }

      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice
        const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id
        if (subId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              payment_failed_at: null,
              grace_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subId)
        }
        break
      }

      default:
        console.log(`[webhook] unhandled: ${event.type}`)
    }
  } catch (e) {
    console.error('[webhook] error', e)
  }

  return NextResponse.json({ received: true })
}
