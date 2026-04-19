import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getPlaidClient } from '@/lib/plaid/client'
import { getDecryptedAccessToken } from '@/lib/plaid/storage'
import { rateLimit } from '@/lib/rateLimit'
import { CountryCode, Products, type LinkTokenCreateRequest } from 'plaid'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`plaid-link:${user.id}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const plaid = getPlaidClient()
  if (!plaid) return NextResponse.json({ error: 'Plaid not configured' }, { status: 503 })

  const body = await request.json()
  const { clientId, updateMode } = body as { clientId?: string; updateMode?: boolean }
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const firmId = user.id

  const params: LinkTokenCreateRequest = {
    user: { client_user_id: `${user.id}:${clientId}` },
    client_name: 'CloseBooks',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  }

  if (updateMode) {
    const accessToken = await getDecryptedAccessToken(firmId, clientId)
    if (!accessToken) return NextResponse.json({ error: 'No connection found' }, { status: 404 })
    const { products: _p, ...rest } = params
    const updateParams = { ...rest, access_token: accessToken }
    try {
      const res = await plaid.linkTokenCreate(updateParams)
      return NextResponse.json({ link_token: res.data.link_token })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Plaid error'
      console.error('[plaid link-token]', msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  try {
    const res = await plaid.linkTokenCreate(params)
    return NextResponse.json({ link_token: res.data.link_token })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Plaid error'
    console.error('[plaid link-token]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
