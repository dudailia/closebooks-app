import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { PLAN_LIMITS, parsePlanSlug } from '@/lib/plans'
import type { SubscriptionState } from '@/lib/subscriptionTypes'
import { EMPTY_SUBSCRIPTION } from '@/lib/subscriptionTypes'
import {
  computeSubscriptionAccess,
  isPastDueLocked,
  type SubscriptionRow,
} from '@/lib/subscriptionAccess'

export const dynamic = 'force-dynamic'

export const GRACE_DAYS = 7
const APP_TRIAL_DAYS = 14

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

function buildState(
  row: Record<string, unknown> | null,
  firmUsage: { trial_started_at?: string | null } | null
): SubscriptionState {
  const r = row as SubscriptionRow | null
  const { hasAccess: computedAccess, tier } = computeSubscriptionAccess(r, firmUsage)

  const status = r ? String(r.status ?? '').toLowerCase() : 'none'
  const planSlug = r?.plan_slug ? String(r.plan_slug) : null
  const trialEnd = r?.trial_end ? String(r.trial_end) : null
  const currentPeriodEnd = r?.current_period_end ? String(r.current_period_end) : null
  const gracePeriodEnd = r?.grace_period_end ? String(r.grace_period_end) : null
  const cancelAt = Boolean(r?.cancel_at_period_end)

  const billingInterval =
    r?.billing_interval === 'year' || r?.billing_interval === 'month'
      ? (r.billing_interval as 'month' | 'year')
      : null

  const hasSubId =
    r?.stripe_subscription_id &&
    String(r.stripe_subscription_id) !== 'unknown' &&
    String(r.stripe_subscription_id) !== 'pending'

  let appTrialEndIso: string | null = null
  if (firmUsage?.trial_started_at && !hasSubId) {
    const t = new Date(firmUsage.trial_started_at).getTime()
    appTrialEndIso = new Date(t + APP_TRIAL_DAYS * 86400000).toISOString()
  }
  const appTrialActive = appTrialEndIso ? new Date(appTrialEndIso).getTime() > Date.now() : false

  const isTrialingStripe = status === 'trialing'
  const isTrialing = isTrialingStripe || (!tier && appTrialActive)

  const isPaid = tier !== null && status === 'active'

  const isCanceled = status === 'canceled' || cancelAt
  const pastDueLocked = isPastDueLocked(r)

  let daysLeftInTrial: number | null = null
  if (isTrialingStripe && trialEnd) {
    daysLeftInTrial = daysUntil(trialEnd)
  } else if (!tier && appTrialEndIso) {
    daysLeftInTrial = daysUntil(appTrialEndIso)
  }

  const lim = tier ? PLAN_LIMITS[tier] : appTrialActive ? PLAN_LIMITS.starter : null

  return {
    tier,
    status: r ? status : 'none',
    planSlug,
    billingInterval,
    stripeCustomerId: r?.stripe_customer_id ? String(r.stripe_customer_id) : null,
    stripeSubscriptionId: r?.stripe_subscription_id ? String(r.stripe_subscription_id) : null,
    currentPeriodEnd,
    trialEnd,
    cancelAtPeriodEnd: cancelAt,
    paymentFailedAt: r?.payment_failed_at ? String(r.payment_failed_at) : null,
    gracePeriodEnd,
    hasAccess: computedAccess && !pastDueLocked,
    isTrialing,
    isPaid,
    isCanceled,
    isPastDueLocked: pastDueLocked,
    daysLeftInTrial,
    maxClients: lim?.maxClients ?? 0,
    maxUsers: lim?.maxUsers ?? 0,
    fullAi: lim?.fullAi ?? false,
    whiteLabel: lim?.whiteLabel ?? false,
    apiAccess: lim?.apiAccess ?? false,
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ subscription: { ...EMPTY_SUBSCRIPTION, hasAccess: true } })
  }

  const email = user.email.toLowerCase()

  const { data: row } = await supabase
    .from('subscriptions')
    .select(
      'status, plan_slug, stripe_customer_id, stripe_subscription_id, current_period_end, trial_end, cancel_at_period_end, payment_failed_at, grace_period_end, billing_interval'
    )
    .eq('customer_email', email)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: firm } = await supabase.from('firms').select('id').eq('owner_id', user.id).maybeSingle()

  let firmUsage: { trial_started_at?: string | null } | null = null
  if (firm?.id) {
    const { data: usage } = await supabase.from('firm_usage').select('trial_started_at').eq('firm_id', firm.id).maybeSingle()
    firmUsage = usage
  }

  const subscription = buildState((row as Record<string, unknown>) ?? null, firmUsage)

  return NextResponse.json({
    subscription,
    firmId: firm?.id ?? null,
  })
}
