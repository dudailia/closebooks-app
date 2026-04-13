import type { PlanTierId } from '@/lib/plans'

export interface SubscriptionState {
  /** Resolved tier from plan_slug (null if unknown / free) */
  tier: PlanTierId | null
  /** Raw Stripe subscription status */
  status: string
  planSlug: string | null
  billingInterval: 'month' | 'year' | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
  paymentFailedAt: string | null
  gracePeriodEnd: string | null
  /** True when user has usable access (paid active/trialing, or in grace) */
  hasAccess: boolean
  /** True when Stripe trial or checkout trial */
  isTrialing: boolean
  isPaid: boolean
  /** Canceled or subscription ended */
  isCanceled: boolean
  /** Payment failed and outside grace */
  isPastDueLocked: boolean
  daysLeftInTrial: number | null
  maxClients: number
  maxUsers: number
  fullAi: boolean
  whiteLabel: boolean
  apiAccess: boolean
}

export const EMPTY_SUBSCRIPTION: SubscriptionState = {
  tier: null,
  status: 'none',
  planSlug: null,
  billingInterval: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  trialEnd: null,
  cancelAtPeriodEnd: false,
  paymentFailedAt: null,
  gracePeriodEnd: null,
  hasAccess: false,
  isTrialing: false,
  isPaid: false,
  isCanceled: false,
  isPastDueLocked: false,
  daysLeftInTrial: null,
  maxClients: 0,
  maxUsers: 0,
  fullAi: false,
  whiteLabel: false,
  apiAccess: false,
}
