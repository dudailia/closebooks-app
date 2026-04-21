import type { SupabaseClient } from '@supabase/supabase-js'
import type { InboxEmail, InboxAttachment, InboxStatus, DocumentType, ExtractedDocumentData, MatchMethod } from './types'

// ── Row mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEmail(r: any): InboxEmail {
  return {
    id: r.id,
    firmId: r.firm_id,
    messageId: r.message_id,
    fromEmail: r.from_email,
    fromName: r.from_name,
    subject: r.subject,
    bodyText: r.body_text,
    bodyHtml: r.body_html,
    receivedAt: r.received_at,
    clientId: r.client_id,
    clientName: r.client_name,
    matchMethod: r.match_method as MatchMethod | null,
    status: r.status as InboxStatus,
    attachmentCount: r.attachment_count ?? 0,
    docRequestId: r.doc_request_id,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAttachment(r: any): InboxAttachment {
  return {
    id: r.id,
    emailId: r.email_id,
    firmId: r.firm_id,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: r.size_bytes,
    storagePath: r.storage_path,
    documentType: r.document_type as DocumentType,
    extractedData: r.extracted_data as ExtractedDocumentData | null,
    vaultDocId: r.vault_doc_id,
    processedAt: r.processed_at,
    createdAt: r.created_at,
  }
}

// ── Firm lookup by inbox slug ──────────────────────────────────────────────

export async function getFirmIdBySlug(supabase: SupabaseClient, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from('firm_settings')
    .select('firm_id')
    .eq(`payload->>'inboxSlug'` as string, slug)
    .maybeSingle()

  if (data?.firm_id) return data.firm_id as string

  // Fallback: search payload column
  const { data: rows } = await supabase
    .from('firm_settings')
    .select('firm_id, payload')

  const match = (rows ?? []).find((r: { payload: { inboxSlug?: string } }) =>
    (r.payload as { inboxSlug?: string })?.inboxSlug?.toLowerCase() === slug.toLowerCase()
  )
  return match?.firm_id ?? null
}

// ── Create email record ────────────────────────────────────────────────────

export async function createInboxEmail(supabase: SupabaseClient, data: {
  firmId: string
  messageId: string
  fromEmail: string
  fromName: string | null
  subject: string | null
  bodyText: string | null
  bodyHtml: string | null
  receivedAt: string
  clientId: string | null
  clientName: string | null
  matchMethod: MatchMethod
  attachmentCount: number
  docRequestId?: string | null
}): Promise<InboxEmail | null> {
  const { data: row, error } = await supabase
    .from('inbox_emails')
    .insert({
      firm_id: data.firmId,
      message_id: data.messageId,
      from_email: data.fromEmail,
      from_name: data.fromName,
      subject: data.subject,
      body_text: data.bodyText,
      body_html: data.bodyHtml,
      received_at: data.receivedAt,
      client_id: data.clientId,
      client_name: data.clientName,
      match_method: data.matchMethod,
      attachment_count: data.attachmentCount,
      doc_request_id: data.docRequestId ?? null,
      status: 'unread',
    })
    .select()
    .single()

  if (error) { console.error('[inboxStore] createInboxEmail error:', error); return null }
  return rowToEmail(row)
}

// ── Create attachment record ───────────────────────────────────────────────

export async function createInboxAttachment(supabase: SupabaseClient, data: {
  emailId: string
  firmId: string
  fileName: string
  mimeType: string | null
  sizeBytes: number | null
  storagePath: string | null
  documentType: DocumentType
  extractedData?: ExtractedDocumentData | null
}): Promise<InboxAttachment | null> {
  const { data: row, error } = await supabase
    .from('inbox_attachments')
    .insert({
      email_id: data.emailId,
      firm_id: data.firmId,
      file_name: data.fileName,
      mime_type: data.mimeType,
      size_bytes: data.sizeBytes,
      storage_path: data.storagePath,
      document_type: data.documentType,
      extracted_data: data.extractedData ?? null,
      processed_at: data.extractedData ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) { console.error('[inboxStore] createInboxAttachment error:', error); return null }
  return rowToAttachment(row)
}

// ── List emails for firm ───────────────────────────────────────────────────

export async function listInboxEmails(supabase: SupabaseClient, firmId: string, opts?: {
  status?: InboxStatus
  clientId?: string
  limit?: number
  offset?: number
}): Promise<InboxEmail[]> {
  let q = supabase
    .from('inbox_emails')
    .select('*')
    .eq('firm_id', firmId)
    .order('received_at', { ascending: false })
    .limit(opts?.limit ?? 50)

  if (opts?.status) q = q.eq('status', opts.status)
  if (opts?.clientId) q = q.eq('client_id', opts.clientId)
  if (opts?.offset) q = q.range(opts.offset, opts.offset + (opts?.limit ?? 50) - 1)

  const { data, error } = await q
  if (error) { console.error('[inboxStore] listInboxEmails error:', error); return [] }
  return (data ?? []).map(rowToEmail)
}

// ── Get single email with attachments ─────────────────────────────────────

export async function getInboxEmailById(supabase: SupabaseClient, id: string): Promise<InboxEmail | null> {
  const [emailRes, attRes] = await Promise.all([
    supabase.from('inbox_emails').select('*').eq('id', id).single(),
    supabase.from('inbox_attachments').select('*').eq('email_id', id).order('created_at'),
  ])

  if (emailRes.error || !emailRes.data) return null
  const email = rowToEmail(emailRes.data)
  email.attachments = (attRes.data ?? []).map(rowToAttachment)
  return email
}

// ── Update email status ────────────────────────────────────────────────────

export async function updateEmailStatus(supabase: SupabaseClient, id: string, status: InboxStatus): Promise<void> {
  await supabase.from('inbox_emails').update({ status }).eq('id', id)
}

// ── Assign email to client ─────────────────────────────────────────────────

export async function assignEmailToClient(supabase: SupabaseClient, emailId: string, clientId: string, clientName: string): Promise<void> {
  await supabase.from('inbox_emails').update({
    client_id: clientId,
    client_name: clientName,
    match_method: 'email_exact',
  }).eq('id', emailId)
}

// ── Update attachment extracted data ──────────────────────────────────────

export async function updateAttachmentExtracted(supabase: SupabaseClient, attachmentId: string, data: {
  extractedData: ExtractedDocumentData
  vaultDocId?: string
}): Promise<void> {
  await supabase.from('inbox_attachments').update({
    extracted_data: data.extractedData,
    vault_doc_id: data.vaultDocId ?? null,
    processed_at: new Date().toISOString(),
  }).eq('id', attachmentId)
}
