import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/portal/auth'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import {
  getActionItems,
  completeActionItem,
  uncompleteActionItem,
  getServiceClient,
} from '@/lib/portal/storage'
import { notifyClientActionItem, notifyFirmActionCompleted } from '@/lib/portal/notify'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  if (token) {
    const session = await validateToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const items = await getActionItems(session.firmId, session.clientId)
    return NextResponse.json({ items })
  }

  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const items = await getActionItems(user.id, clientId)
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  // Firm creating an action item
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { clientId, title, description, dueDate, clientEmail, portalToken, firmName, accentColor } = body
  if (!clientId || !title) return NextResponse.json({ error: 'clientId and title required' }, { status: 400 })

  const sb = getServiceClient()
  if (!sb) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { data, error } = await sb
    .from('portal_action_items')
    .insert({
      firm_id: user.id,
      client_id: clientId,
      title,
      description: description ?? null,
      due_date: dueDate ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (clientEmail && portalToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    void notifyClientActionItem({
      clientEmail,
      firmName: firmName ?? 'Your Accountant',
      accentColor: accentColor ?? '#b8734a',
      title,
      description,
      dueDate,
      portalUrl: `${appUrl}/portal/${portalToken}`,
    })
  }

  return NextResponse.json({ item: data })
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  if (token) {
    // Client completing/uncompleting an action item
    const session = await validateToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (!session.permissions.includes('approve_items')) {
      return NextResponse.json({ error: 'No permission' }, { status: 403 })
    }

    const formData = await request.formData()
    const id = formData.get('id') as string
    const completed = formData.get('completed') === 'true'
    const file = formData.get('file') as File | null

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    let attachmentPath: string | undefined
    if (completed && file) {
      const sb = getServiceClient()
      if (sb) {
        const path = `${session.firmId}/${session.clientId}/actions/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const bytes = await file.arrayBuffer()
        await sb.storage.from('portal-docs').upload(path, bytes, { contentType: file.type, upsert: true })
        attachmentPath = path
      }
    }

    if (completed) {
      await completeActionItem(id, attachmentPath)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      // Get title for notification
      const sb = getServiceClient()
      if (sb) {
        const { data } = await sb.from('portal_action_items').select('title').eq('id', id).maybeSingle()
        if (data) {
          void notifyFirmActionCompleted({
            firmEmail: 'firm@placeholder.com',
            firmName: session.firmName,
            accentColor: session.accentColor,
            clientName: session.clientName,
            title: String(data.title),
            dashboardUrl: `${appUrl}/dashboard/messages`,
          })
        }
      }
    } else {
      await uncompleteActionItem(id)
    }

    return NextResponse.json({ ok: true })
  }

  // Firm updating action item status
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, completed } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (completed) {
    await completeActionItem(id)
  } else {
    await uncompleteActionItem(id)
  }
  return NextResponse.json({ ok: true })
}
