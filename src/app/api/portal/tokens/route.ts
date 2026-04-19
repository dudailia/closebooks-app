import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { createPortalToken, getTokensForFirm, getTokenForClient, revokeToken } from '@/lib/portal/storage'

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const clientId = searchParams.get('clientId')
  const firmId = user.id

  if (clientId) {
    const token = await getTokenForClient(firmId, clientId)
    return NextResponse.json({ token })
  }

  const tokens = await getTokensForFirm(firmId)
  return NextResponse.json({ tokens })
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { clientId, clientName, clientEmail, permissions, expiresInDays } = body

  if (!clientId || !clientName) {
    return NextResponse.json({ error: 'clientId and clientName required' }, { status: 400 })
  }

  const perms = permissions ?? ['view_reports', 'upload_documents', 'send_messages', 'view_transactions', 'approve_items']
  const days = expiresInDays ?? 90

  const token = await createPortalToken(user.id, clientId, clientName, clientEmail, perms, days, user.id)
  if (!token) return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })

  return NextResponse.json({ token })
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await revokeToken(id)
  return NextResponse.json({ ok: true })
}
