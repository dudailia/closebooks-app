import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeSubscriptionAccess, type SubscriptionRow } from '@/lib/subscriptionAccess'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function isCheckoutSuccess(url: URL): boolean {
  return url.searchParams.get('checkout') === 'success'
}

/**
 * Returns true if request should proceed to dashboard route.
 * false → redirect to /pricing
 */
export async function shouldAllowDashboardAccess(
  request: NextRequest,
  userEmail: string,
  userId: string
): Promise<boolean> {
  const { pathname } = request.nextUrl
  if (pathname === '/dashboard' && isCheckoutSuccess(request.nextUrl)) {
    return true
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return true
  }

  const email = userEmail.toLowerCase()

  const { data: firm } = await supabase.from('firms').select('id').eq('owner_id', userId).maybeSingle()

  let firmUsage: { trial_started_at?: string | null } | null = null
  if (firm?.id) {
    const { data: usage } = await supabase.from('firm_usage').select('trial_started_at').eq('firm_id', firm.id).maybeSingle()
    firmUsage = usage
  }

  const { data: row } = await supabase
    .from('subscriptions')
    .select(
      'status, plan_slug, stripe_subscription_id, current_period_end, trial_end, cancel_at_period_end, grace_period_end, payment_failed_at'
    )
    .eq('customer_email', email)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { hasAccess } = computeSubscriptionAccess(row as SubscriptionRow | null, firmUsage)

  return hasAccess
}
