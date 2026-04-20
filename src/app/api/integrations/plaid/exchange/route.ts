import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getPlaidClient } from '@/lib/plaid/client'
import { encrypt } from '@/lib/plaid/crypto'
import { upsertConnection } from '@/lib/plaid/storage'
import { syncTransactions } from '@/lib/plaid/sync'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plaid = getPlaidClient()
  if (!plaid) return NextResponse.json({ error: 'Plaid not configured' }, { status: 503 })

  const body = await request.json()
  const { publicToken, clientId, institutionId, institutionName } = body as {
    publicToken?: string
    clientId?: string
    institutionId?: string
    institutionName?: string
  }

  if (!publicToken || !clientId) {
    return NextResponse.json({ error: 'publicToken and clientId required' }, { status: 400 })
  }

  try {
    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token: publicToken })
    const accessToken = exchangeRes.data.access_token
    const itemId = exchangeRes.data.item_id

    const accountsRes = await plaid.accountsGet({ access_token: accessToken })
    const accounts = accountsRes.data.accounts.map(a => ({
      account_id: a.account_id,
      name: a.name,
      official_name: a.official_name ?? null,
      type: String(a.type),
      subtype: a.subtype ? String(a.subtype) : null,
      mask: a.mask ?? null,
      current_balance: a.balances.current ?? null,
      available_balance: a.balances.available ?? null,
      currency: a.balances.iso_currency_code ?? 'USD',
    }))

    const encryptedToken = encrypt(accessToken)

    const conn = await upsertConnection({
      firmId: user.id,
      clientId,
      accessTokenEncrypted: encryptedToken,
      itemId,
      institutionId: institutionId ?? null,
      institutionName: institutionName ?? null,
      accounts,
    })

    if (!conn) {
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
    }

    // Fire-and-forget initial sync
    void syncTransactions(user.id, clientId, accessToken, null).catch(e =>
      console.error('[plaid initial sync]', e)
    )

    return NextResponse.json({ ok: true, connection: conn })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Plaid error'
    console.error('[plaid exchange]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
