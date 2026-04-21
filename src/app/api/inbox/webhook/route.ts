import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/serviceClient'
import { matchSenderToClient } from '@/lib/inbox/clientMatcher'
import { createInboxEmail, createInboxAttachment, getFirmIdBySlug } from '@/lib/inbox/inboxStore'
import { detectDocumentType, extractDocumentData, uploadAttachmentToStorage } from '@/lib/inbox/attachmentProcessor'
import type { PostmarkInboundPayload } from '@/lib/inbox/types'

// Always return 200 to prevent Postmark retries
const OK = () => NextResponse.json({ ok: true }, { status: 200 })

// Extract firm slug from To address
// Supports: docs@acmefirm.inbox.closebooks.app  →  'acmefirm'
//           acmefirm@inbox.closebooks.app         →  'acmefirm'
function extractFirmSlug(toAddresses: string[]): string | null {
  for (const addr of toAddresses) {
    // subdomain format: something@{slug}.inbox.closebooks.app
    const subdomainMatch = addr.match(/@([^.]+)\.inbox\.closebooks\.app/)
    if (subdomainMatch) return subdomainMatch[1].toLowerCase()
    // simple format: {slug}@inbox.closebooks.app
    const simpleMatch = addr.match(/^([^@+]+)@inbox\.closebooks\.app/)
    if (simpleMatch) return simpleMatch[1].toLowerCase()
  }
  return null
}

export async function POST(req: NextRequest) {
  // Validate webhook token
  const token = req.headers.get('x-postmark-token') ?? new URL(req.url).searchParams.get('token')
  const expected = process.env.POSTMARK_WEBHOOK_TOKEN
  if (expected && token !== expected) {
    console.warn('[webhook] invalid token')
    return OK() // still 200 to avoid Postmark retries exposing info
  }

  let payload: PostmarkInboundPayload
  try {
    payload = await req.json() as PostmarkInboundPayload
  } catch {
    return OK()
  }

  const supabase = createServiceClient()
  if (!supabase) {
    console.error('[webhook] Supabase service client not configured')
    return OK()
  }

  // Collect all To addresses
  const toAddresses = [
    payload.To ?? '',
    ...(payload.ToFull?.map(t => t.Email) ?? []),
  ].filter(Boolean)

  // Resolve firm from To address slug
  const firmSlug = extractFirmSlug(toAddresses)
  if (!firmSlug) {
    console.warn('[webhook] no firm slug in To address:', toAddresses)
    return OK()
  }

  const firmId = await getFirmIdBySlug(supabase, firmSlug)
  if (!firmId) {
    console.warn('[webhook] no firm found for slug:', firmSlug)
    return OK()
  }

  // Extract email fields
  const fromEmail  = payload.FromFull?.Email ?? payload.From ?? 'unknown@unknown.com'
  const fromName   = payload.FromFull?.Name ?? null
  const subject    = payload.Subject ?? null
  const bodyText   = payload.TextBody ?? null
  const bodyHtml   = payload.HtmlBody ?? null
  const messageId  = payload.MessageID ?? crypto.randomUUID()
  const receivedAt = payload.Date ?? new Date().toISOString()
  const toAddr     = toAddresses[0] ?? ''
  const attachments = payload.Attachments ?? []

  // Match sender to client
  const match = await matchSenderToClient(supabase, firmId, fromEmail, toAddr, subject ?? '')

  // Check if this is a reply to a document request (In-Reply-To header)
  let docRequestId: string | null = null
  const inReplyTo = payload.Headers?.find(h => h.Name === 'In-Reply-To')?.Value
  if (inReplyTo) {
    const { data: reqRow } = await supabase
      .from('vault_document_requests')
      .select('id')
      .eq('firm_id', firmId)
      .ilike('payload->id' as string, `%${inReplyTo.replace(/[<>]/g, '')}%`)
      .maybeSingle()
    docRequestId = reqRow?.id ?? null
  }

  // Create inbox email record
  const emailRecord = await createInboxEmail(supabase, {
    firmId,
    messageId,
    fromEmail,
    fromName,
    subject,
    bodyText,
    bodyHtml,
    receivedAt,
    clientId: match.clientId,
    clientName: match.clientName,
    matchMethod: match.matchMethod,
    attachmentCount: attachments.length,
    docRequestId,
  })

  if (!emailRecord) return OK()

  // Process attachments (fire-and-forget style — we await but don't block the response shape)
  for (const att of attachments) {
    if (!att.Content || att.ContentLength === 0) continue

    const docType = detectDocumentType(att.Name, att.ContentType)

    // Upload to Supabase Storage
    const storagePath = await uploadAttachmentToStorage(
      supabase,
      firmId,
      emailRecord.id,
      att.Name,
      att.Content,
      att.ContentType,
    )

    // Extract data via Claude (skip for very large files >5MB)
    let extractedData = null
    if (att.ContentLength < 5_000_000) {
      extractedData = await extractDocumentData(att.Content, att.ContentType, docType, att.Name)
    }

    await createInboxAttachment(supabase, {
      emailId: emailRecord.id,
      firmId,
      fileName: att.Name,
      mimeType: att.ContentType,
      sizeBytes: att.ContentLength,
      storagePath,
      documentType: docType,
      extractedData,
    })
  }

  // If this was a reply to a document request, update request status
  if (docRequestId && attachments.length > 0) {
    await supabase
      .from('vault_document_requests')
      .update({ payload: supabase.rpc })
      .eq('id', docRequestId)
    // Note: full doc request update handled by separate process
  }

  console.log(`[webhook] Processed email ${messageId} for firm ${firmId}, client: ${match.clientName ?? 'unassigned'}, ${attachments.length} attachments`)
  return OK()
}
