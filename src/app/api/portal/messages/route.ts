import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/portal/auth'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import {
  getMessages,
  getMessagesAfter,
  sendMessage,
  markMessagesRead,
} from '@/lib/portal/storage'
import { notifyFirmNewMessage, notifyClientNewMessage } from '@/lib/portal/notify'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const afterId = searchParams.get('after')

  if (token) {
    const session = await validateToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const messages = afterId
      ? await getMessagesAfter(session.firmId, session.clientId, afterId)
      : await getMessages(session.firmId, session.clientId)

    // Mark firm messages as read
    void markMessagesRead(session.firmId, session.clientId)

    return NextResponse.json({ messages })
  }

  // Firm dashboard
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const messages = await getMessages(user.id, clientId)
  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  if (token) {
    // Client sending a message
    const session = await validateToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (!session.permissions.includes('send_messages')) {
      return NextResponse.json({ error: 'No messaging permission' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

    const message = await sendMessage(session.firmId, session.clientId, 'client', content.trim())
    if (!message) return NextResponse.json({ error: 'Failed' }, { status: 500 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    // Fire-and-forget email (firm email via firm_settings if available)
    void notifyFirmNewMessage({
      firmEmail: 'firm@placeholder.com',
      firmName: session.firmName,
      accentColor: session.accentColor,
      clientName: session.clientName,
      messagePreview: content.trim().slice(0, 200),
      dashboardUrl: `${appUrl}/dashboard/messages`,
    })

    return NextResponse.json({ message })
  }

  // Firm sending a message from dashboard
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { clientId, content, clientEmail, portalToken, firmName, accentColor } = body
  if (!clientId || !content?.trim()) {
    return NextResponse.json({ error: 'clientId and content required' }, { status: 400 })
  }

  const message = await sendMessage(user.id, clientId, 'firm', content.trim())
  if (!message) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  if (clientEmail && portalToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    void notifyClientNewMessage({
      clientEmail,
      firmName: firmName ?? 'Your Accountant',
      accentColor: accentColor ?? '#b8734a',
      messagePreview: content.trim().slice(0, 200),
      portalUrl: `${appUrl}/portal/${portalToken}`,
    })
  }

  return NextResponse.json({ message })
}
