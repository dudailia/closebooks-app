import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

export const dynamic = 'force-dynamic'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export interface BillingStatusResponse {
  hasSubscription: boolean
  status?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  amountTotal?: number | null
  currency?: string | null
  updatedAt?: string
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({
      hasSubscription: false,
    } satisfies BillingStatusResponse)
  }

  const { data: row } = await supabase
    .from('subscriptions')
    .select('status, stripe_customer_id, stripe_subscription_id, amount_total, currency, updated_at')
    .eq('customer_email', user.email.toLowerCase())
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!row) {
    return NextResponse.json({ hasSubscription: false } satisfies BillingStatusResponse)
  }

  return NextResponse.json({
    hasSubscription: true,
    status: row.status as string,
    stripeCustomerId: row.stripe_customer_id as string,
    stripeSubscriptionId: row.stripe_subscription_id as string,
    amountTotal: row.amount_total as number | null,
    currency: row.currency as string | null,
    updatedAt: row.updated_at as string,
  } satisfies BillingStatusResponse)
}
