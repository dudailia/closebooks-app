import { activatePlan } from '@/lib/freeTrial'

/** Pull Stripe subscription (via Supabase) and unlock in-app plan after login. */
export async function syncSubscriptionFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/subscription')
    if (!res.ok) return false
    const data = (await res.json()) as {
      hasSubscription?: boolean
      planSlug?: string
    }
    if (!data.hasSubscription) return false
    const slug = (data.planSlug ?? '').toLowerCase()
    if (slug === 'starter') activatePlan('starter')
    else activatePlan('growth')
    return true
  } catch {
    return false
  }
}
