import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/portal/auth'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import {
  getDocuments,
  createDocumentRequest,
  updateDocumentStatus,
  getDocumentSignedUrl,
  getServiceClient,
} from '@/lib/portal/storage'
import {
  notifyFirmDocumentUploaded,
  notifyClientDocumentRequest,
} from '@/lib/portal/notify'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const id = searchParams.get('id')

  if (token) {
    const session = await validateToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const docs = await getDocuments(session.firmId, session.clientId)
    // Generate signed URLs for uploaded docs
    const withUrls = await Promise.all(docs.map(async (doc) => {
      if (doc.storagePath) {
        const url = await getDocumentSignedUrl(doc.storagePath)
        return { ...doc, signedUrl: url }
      }
      return doc
    }))
    return NextResponse.json({ documents: withUrls })
  }

  // Firm dashboard: get doc by id for signed URL
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const docs = await getDocuments(user.id, clientId)
  const withUrls = await Promise.all(docs.map(async (doc) => {
    if (doc.storagePath) {
      const url = await getDocumentSignedUrl(doc.storagePath)
      return { ...doc, signedUrl: url }
    }
    return doc
  }))
  return NextResponse.json({ documents: withUrls })
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')

  // Client uploading a document
  if (token) {
    const session = await validateToken(token)
    if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    if (!session.permissions.includes('upload_documents')) {
      return NextResponse.json({ error: 'No upload permission' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docId = formData.get('docId') as string | null

    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

    const sb = getServiceClient()
    if (!sb) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${session.firmId}/${session.clientId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await sb.storage.from('portal-docs').upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    if (docId) {
      await updateDocumentStatus(docId, 'uploaded', path, file.size, file.type)
    } else {
      await createDocumentRequest(session.firmId, session.clientId, file.name, 'other')
      const docs = await getDocuments(session.firmId, session.clientId)
      const newDoc = docs.find(d => d.storagePath === path)
      if (newDoc) await updateDocumentStatus(newDoc.id, 'uploaded', path, file.size, file.type)
    }

    // Notify firm
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    void notifyFirmDocumentUploaded({
      firmEmail: session.firmId + '@placeholder.com', // firm email from settings if available
      firmName: session.firmName,
      accentColor: session.accentColor,
      clientName: session.clientName,
      docName: file.name,
      dashboardUrl: `${appUrl}/dashboard/messages`,
    })

    return NextResponse.json({ ok: true, path })
  }

  // Firm creating a document request
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { clientId, clientName, clientEmail, name, category, requestedNote, portalToken } = body

  if (!clientId || !name) return NextResponse.json({ error: 'clientId and name required' }, { status: 400 })

  const doc = await createDocumentRequest(user.id, clientId, name, category ?? 'other', requestedNote)
  if (!doc) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  if (clientEmail && portalToken) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    void notifyClientDocumentRequest({
      clientEmail,
      firmName: clientName ?? 'Your Accountant',
      accentColor: '#b8734a',
      docName: name,
      note: requestedNote,
      portalUrl: `${appUrl}/portal/${portalToken}`,
    })
  }

  return NextResponse.json({ document: doc })
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  await updateDocumentStatus(id, status)
  return NextResponse.json({ ok: true })
}
