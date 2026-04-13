import { activatePlan } from '@/lib/freeTrial'

/** Align in-app plan with Stripe-backed subscription after login. */
export async function syncSubscriptionFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/subscription', { cache: 'no-store' })
    if (!res.ok) return false
    const data = (await res.json()) as { subscription?: { tier?: string | null; hasAccess?: boolean } }
    const tier = data.subscription?.tier
    if (!tier) return false
    if (tier === 'starter') activatePlan('starter')
    else if (tier === 'professional') activatePlan('growth')
    else if (tier === 'enterprise') activatePlan('scale')
    return true
  } catch {
    return false
  }
}
