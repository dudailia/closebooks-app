import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { latestFirmSubscription } from '@/lib/subscriptionLookup'

export const dynamic = 'force-dynamic'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** Optional: call after login to align client trial state with Stripe (caller applies activatePlan). */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ hasSubscription: false })
  }

  const { data: row } = await latestFirmSubscription(supabase, user.id, 'status, plan_slug')

  if (!row) {
    return NextResponse.json({ hasSubscription: false })
  }

  const status = String(row.status ?? '').toLowerCase()
  const planSlug = row.plan_slug as string | null

  return NextResponse.json({
    hasSubscription: ['active', 'trialing', 'past_due'].includes(status),
    status,
    planSlug: planSlug ?? undefined,
  })
}
