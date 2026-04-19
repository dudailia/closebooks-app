import { createClient } from '@supabase/supabase-js'
import type { PortalDocument, PortalMessage, PortalActionItem, PortalToken } from './types'

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Documents ──────────────────────────────────────────────────────────────

function rowToDoc(r: Record<string, unknown>): PortalDocument {
  return {
    id: String(r.id),
    firmId: String(r.firm_id),
    clientId: String(r.client_id),
    name: String(r.name),
    category: (r.category as PortalDocument['category']) ?? 'other',
    status: (r.status as PortalDocument['status']) ?? 'requested',
    storagePath: r.storage_path ? String(r.storage_path) : undefined,
    fileSize: r.file_size ? Number(r.file_size) : undefined,
    mimeType: r.mime_type ? String(r.mime_type) : undefined,
    requestedNote: r.requested_note ? String(r.requested_note) : undefined,
    uploadedAt: r.uploaded_at ? String(r.uploaded_at) : undefined,
    reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
    createdAt: String(r.created_at),
  }
}

export async function getDocuments(firmId: string, clientId: string): Promise<PortalDocument[]> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data } = await sb
    .from('portal_documents')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => rowToDoc(r as Record<string, unknown>))
}

export async function createDocumentRequest(
  firmId: string,
  clientId: string,
  name: string,
  category: PortalDocument['category'],
  requestedNote?: string,
): Promise<PortalDocument | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('portal_documents')
    .insert({ firm_id: firmId, client_id: clientId, name, category, requested_note: requestedNote ?? null, status: 'requested' })
    .select()
    .single()
  if (error) return null
  return rowToDoc(data as Record<string, unknown>)
}

export async function updateDocumentStatus(
  id: string,
  status: PortalDocument['status'],
  storagePath?: string,
  fileSize?: number,
  mimeType?: string,
): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  const updates: Record<string, unknown> = { status }
  if (storagePath) updates.storage_path = storagePath
  if (fileSize) updates.file_size = fileSize
  if (mimeType) updates.mime_type = mimeType
  if (status === 'uploaded') updates.uploaded_at = new Date().toISOString()
  if (status === 'reviewed') updates.reviewed_at = new Date().toISOString()
  await sb.from('portal_documents').update(updates).eq('id', id)
}

export async function getDocumentSignedUrl(storagePath: string): Promise<string | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data } = await sb.storage.from('portal-docs').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

// ── Messages ───────────────────────────────────────────────────────────────

function rowToMsg(r: Record<string, unknown>): PortalMessage {
  return {
    id: String(r.id),
    firmId: String(r.firm_id),
    clientId: String(r.client_id),
    sender: (r.sender as 'firm' | 'client'),
    content: String(r.content),
    attachmentPath: r.attachment_path ? String(r.attachment_path) : undefined,
    attachmentName: r.attachment_name ? String(r.attachment_name) : undefined,
    readAt: r.read_at ? String(r.read_at) : undefined,
    createdAt: String(r.created_at),
  }
}

export async function getMessages(firmId: string, clientId: string): Promise<PortalMessage[]> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data } = await sb
    .from('portal_messages')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  return (data ?? []).map(r => rowToMsg(r as Record<string, unknown>))
}

export async function getMessagesAfter(firmId: string, clientId: string, afterId: string): Promise<PortalMessage[]> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data: ref } = await sb.from('portal_messages').select('created_at').eq('id', afterId).maybeSingle()
  if (!ref) return []
  const { data } = await sb
    .from('portal_messages')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .gt('created_at', ref.created_at)
    .order('created_at', { ascending: true })
  return (data ?? []).map(r => rowToMsg(r as Record<string, unknown>))
}

export async function sendMessage(
  firmId: string,
  clientId: string,
  sender: 'firm' | 'client',
  content: string,
  attachmentPath?: string,
  attachmentName?: string,
): Promise<PortalMessage | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data, error } = await sb
    .from('portal_messages')
    .insert({ firm_id: firmId, client_id: clientId, sender, content, attachment_path: attachmentPath ?? null, attachment_name: attachmentName ?? null })
    .select()
    .single()
  if (error) return null
  return rowToMsg(data as Record<string, unknown>)
}

export async function markMessagesRead(firmId: string, clientId: string): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  await sb.from('portal_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('sender', 'firm')
    .is('read_at', null)
}

// ── Action Items ───────────────────────────────────────────────────────────

function rowToAction(r: Record<string, unknown>): PortalActionItem {
  return {
    id: String(r.id),
    firmId: String(r.firm_id),
    clientId: String(r.client_id),
    title: String(r.title),
    description: r.description ? String(r.description) : undefined,
    dueDate: r.due_date ? String(r.due_date) : undefined,
    completedAt: r.completed_at ? String(r.completed_at) : undefined,
    attachmentPath: r.attachment_path ? String(r.attachment_path) : undefined,
    createdAt: String(r.created_at),
  }
}

export async function getActionItems(firmId: string, clientId: string): Promise<PortalActionItem[]> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data } = await sb
    .from('portal_action_items')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('due_date', { ascending: true, nullsFirst: false })
  return (data ?? []).map(r => rowToAction(r as Record<string, unknown>))
}

export async function completeActionItem(id: string, attachmentPath?: string): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  const updates: Record<string, unknown> = { completed_at: new Date().toISOString() }
  if (attachmentPath) updates.attachment_path = attachmentPath
  await sb.from('portal_action_items').update(updates).eq('id', id)
}

export async function uncompleteActionItem(id: string): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  await sb.from('portal_action_items').update({ completed_at: null }).eq('id', id)
}

// ── Portal Tokens (for dashboard management) ───────────────────────────────

function rowToToken(r: Record<string, unknown>): PortalToken {
  return {
    id: String(r.id),
    token: String(r.token),
    firmId: String(r.firm_id),
    clientId: String(r.client_id),
    clientName: String(r.client_name || r.client_id),
    clientEmail: r.client_email ? String(r.client_email) : undefined,
    permissions: (r.permissions as string[]) ?? [],
    expiresAt: String(r.expires_at),
    lastAccessedAt: r.last_accessed_at ? String(r.last_accessed_at) : undefined,
    createdAt: String(r.created_at),
  }
}

export async function getTokensForFirm(firmId: string): Promise<PortalToken[]> {
  const sb = getServiceClient()
  if (!sb) return []
  const { data } = await sb
    .from('portal_tokens')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
  return (data ?? []).map(r => rowToToken(r as Record<string, unknown>))
}

export async function getTokenForClient(firmId: string, clientId: string): Promise<PortalToken | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const { data } = await sb
    .from('portal_tokens')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? rowToToken(data as Record<string, unknown>) : null
}

export async function createPortalToken(
  firmId: string,
  clientId: string,
  clientName: string,
  clientEmail: string | undefined,
  permissions: string[],
  expiresInDays: number,
  createdBy: string,
): Promise<PortalToken | null> {
  const sb = getServiceClient()
  if (!sb) return null
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await sb
    .from('portal_tokens')
    .insert({ firm_id: firmId, client_id: clientId, client_name: clientName, client_email: clientEmail ?? null, permissions, expires_at: expiresAt, created_by: createdBy })
    .select()
    .single()
  if (error) return null
  return rowToToken(data as Record<string, unknown>)
}

export async function revokeToken(id: string): Promise<void> {
  const sb = getServiceClient()
  if (!sb) return
  await sb.from('portal_tokens').update({ expires_at: new Date().toISOString() }).eq('id', id)
}
