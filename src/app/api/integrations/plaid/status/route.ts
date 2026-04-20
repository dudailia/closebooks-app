import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getConnection } from '@/lib/plaid/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const conn = await getConnection(user.id, clientId)
  if (!conn) return NextResponse.json({ connected: false })

  return NextResponse.json({
    connected: true,
    status: conn.status,
    institutionName: conn.institutionName,
    accounts: conn.accounts,
    lastSyncedAt: conn.lastSyncedAt,
    errorCode: conn.errorCode,
  })
}
