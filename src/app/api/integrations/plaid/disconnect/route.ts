import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getPlaidClient } from '@/lib/plaid/client'
import { getDecryptedAccessToken, deleteConnection } from '@/lib/plaid/storage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = await request.json() as { clientId?: string }
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const accessToken = await getDecryptedAccessToken(user.id, clientId)

  if (accessToken) {
    const plaid = getPlaidClient()
    if (plaid) {
      await plaid.itemRemove({ access_token: accessToken }).catch(e =>
        console.warn('[plaid disconnect] itemRemove failed:', e instanceof Error ? e.message : e)
      )
    }
  }

  await deleteConnection(user.id, clientId)
  return NextResponse.json({ ok: true })
}
