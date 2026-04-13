/**
 * Pure access checks — used by API route and middleware.
 */

import { PLAN_LIMITS, parsePlanSlug, type PlanTierId } from '@/lib/plans'

const APP_TRIAL_DAYS = 14

export interface SubscriptionRow {
  status: string | null
  plan_slug: string | null
  stripe_subscription_id?: string | null
  current_period_end?: string | null
  trial_end?: string | null
  cancel_at_period_end?: boolean | null
  grace_period_end?: string | null
  payment_failed_at?: string | null
}

export interface FirmUsageRow {
  trial_started_at?: string | null
}

export function computeSubscriptionAccess(
  row: SubscriptionRow | null,
  firmUsage: FirmUsageRow | null
): { hasAccess: boolean; tier: PlanTierId | null } {
  const status = row?.status ? String(row.status).toLowerCase() : 'none'
  const planSlug = row?.plan_slug ? String(row.plan_slug) : null
  const tier = parsePlanSlug(planSlug)

  const now = Date.now()
  const hasSubId =
    row?.stripe_subscription_id &&
    String(row.stripe_subscription_id) !== 'unknown' &&
    String(row.stripe_subscription_id) !== 'pending'

  const currentPeriodEnd = row?.current_period_end
  const gracePeriodEnd = row?.grace_period_end
  const cancelAt = Boolean(row?.cancel_at_period_end)

  const stripeActive =
    status === 'active' ||
    status === 'trialing' ||
    (status === 'past_due' && gracePeriodEnd && new Date(gracePeriodEnd).getTime() > now) ||
    (status === 'canceled' && cancelAt && currentPeriodEnd && new Date(currentPeriodEnd).getTime() > now) ||
    (status === 'canceled' && gracePeriodEnd && new Date(gracePeriodEnd).getTime() > now)

  let appTrialActive = false
  if (firmUsage?.trial_started_at && !hasSubId) {
    const end = new Date(firmUsage.trial_started_at).getTime() + APP_TRIAL_DAYS * 86400000
    appTrialActive = now < end
  }

  const hasAccess = (hasSubId && stripeActive) || (!hasSubId && appTrialActive)

  return { hasAccess, tier }
}

export function isPastDueLocked(row: SubscriptionRow | null): boolean {
  if (!row) return false
  const status = String(row.status ?? '').toLowerCase()
  const grace = row.grace_period_end
  return status === 'past_due' && (!grace || new Date(grace).getTime() <= Date.now())
}

export { PLAN_LIMITS, parsePlanSlug }
