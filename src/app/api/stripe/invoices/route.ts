import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return NextResponse.json({ invoices: [] })
  }

  const user = await getUserFromRequest(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    return NextResponse.json({ invoices: [] })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('customer_email', user.email.toLowerCase())
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const customerId = sub?.stripe_customer_id as string | undefined
  if (!customerId || customerId === 'unknown') {
    return NextResponse.json({ invoices: [] })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' })

  try {
    const list = await stripe.invoices.list({ customer: customerId, limit: 24 })
    const invoices = list.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
    }))
    return NextResponse.json({ invoices })
  } catch (e) {
    console.error('[/api/stripe/invoices]', e)
    return NextResponse.json({ invoices: [] })
  }
}
