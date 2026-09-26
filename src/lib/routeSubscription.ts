import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { getUserFromRequest, isSupabaseEnvConfigured } from '@/lib/supabase/routeAuth'
import {
  computeSubscriptionAccess,
  isPastDueLocked,
  type SubscriptionRow,
} from '@/lib/subscriptionAccess'
import { featureMinTier, tierAtLeast, type GatedFeature, type PlanTierId } from '@/lib/plans'

interface RouteAccessOptions {
  feature?: GatedFeature
}

export type RouteAccessResult =
  | { ok: true; user: User | null; tier: PlanTierId | null }
  | { ok: false; response: NextResponse }

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Mirrors isSupabaseEnvConfigured() so the log can name the offending variable.
function missingSupabaseEnvVars(): string[] {
  const vars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const
  return vars.filter((name) => {
    const value = process.env[name] ?? ''
    return !value || value.startsWith('your_')
  })
}

export async function requireRouteAccess(
  request: NextRequest,
  options: RouteAccessOptions = {}
): Promise<RouteAccessResult> {
  const user = await getUserFromRequest(request)

  if (!isSupabaseEnvConfigured()) {
    const demoMode = process.env.DEMO_MODE === 'true'
    const isProduction = process.env.VERCEL_ENV === 'production'

    // Open access only for an explicit, non-production demo deployment.
    if (demoMode && !isProduction) {
      return { ok: true, user, tier: null }
    }

    if (demoMode && isProduction) {
      console.warn('[requireRouteAccess] DEMO_MODE=true is ignored in production; failing closed.')
    }
    console.error(
      `[requireRouteAccess] Supabase auth not configured — missing or placeholder: ${missingSupabaseEnvVars().join(', ') || 'unknown'}`
    )
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Auth not configured', code: 'auth_not_configured' },
        { status: 503 }
      ),
    }
  }

  if (!user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 }),
    }
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Subscription service is not configured.', code: 'subscription_unavailable' },
        { status: 503 }
      ),
    }
  }

  const email = user.email.toLowerCase()
  const [{ data: row }, { data: firm }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select(
        'status, plan_slug, stripe_subscription_id, current_period_end, trial_end, cancel_at_period_end, grace_period_end, payment_failed_at'
      )
      .eq('customer_email', email)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('firms').select('id').eq('owner_id', user.id).maybeSingle(),
  ])

  let firmUsage: { trial_started_at?: string | null } | null = null
  if (firm?.id) {
    const { data: usage } = await supabase
      .from('firm_usage')
      .select('trial_started_at')
      .eq('firm_id', firm.id)
      .maybeSingle()
    firmUsage = usage
  }

  const subscription = row as SubscriptionRow | null
  if (isPastDueLocked(subscription)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Update billing to continue.', code: 'payment_required' },
        { status: 402 }
      ),
    }
  }

  const { hasAccess, tier } = computeSubscriptionAccess(subscription, firmUsage)
  if (!hasAccess) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Subscription required to continue.', code: 'subscription_required' },
        { status: 403 }
      ),
    }
  }

  if (options.feature) {
    const minTier = featureMinTier(options.feature)
    if (!tierAtLeast(tier, minTier)) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Upgrade required for this feature.',
            code: 'upgrade_required',
            feature: options.feature,
            minTier,
          },
          { status: 403 }
        ),
      }
    }
  }

  return { ok: true, user, tier }
}
