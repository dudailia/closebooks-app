import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getConnection, getDecryptedAccessToken } from '@/lib/plaid/storage'
import { syncTransactions } from '@/lib/plaid/sync'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = await request.json() as { clientId?: string }
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const rl = rateLimit(`plaid-sync:${user.id}:${clientId}`, 5, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const conn = await getConnection(user.id, clientId)
  if (!conn) return NextResponse.json({ error: 'No Plaid connection for this client' }, { status: 404 })

  const accessToken = await getDecryptedAccessToken(user.id, clientId)
  if (!accessToken) return NextResponse.json({ error: 'Cannot decrypt access token' }, { status: 500 })

  try {
    const result = await syncTransactions(user.id, clientId, accessToken, conn.cursor)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
