// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inbox/receive-email
// Webhook endpoint for inbound emails (Postmark inbound format)
// Returns 200 immediately; processing happens asynchronously
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

// ─── Postmark inbound payload (partial) ───────────────────────────────────────

interface PostmarkAttachment {
  Name: string
  Content: string
  ContentType: string
  ContentLength: number
}

interface PostmarkInboundPayload {
  From?: string
  FromFull?: { Email: string; Name: string }
  To?: string
  Subject?: string
  TextBody?: string
  HtmlBody?: string
  Attachments?: PostmarkAttachment[]
  MessageID?: string
  Date?: string
}

// ─── Document type detection ─────────────────────────────────────────────────

type DocumentType = 'receipt' | 'invoice' | 'statement' | 'unknown'

function detectDocumentType(subject: string, body: string): DocumentType {
  const combined = `${subject} ${body}`.toLowerCase()
  if (combined.includes('receipt')) return 'receipt'
  if (combined.includes('invoice') || combined.includes('inv #') || combined.includes('bill')) return 'invoice'
  if (combined.includes('statement') || combined.includes('bank') || combined.includes('account summary')) return 'statement'
  return 'unknown'
}

// ─── Client routing ──────────────────────────────────────────────────────────

function routeToClient(fromEmail: string): string | null {
  // In production this would look up a routing table in the DB.
  // For now, strip sub-addressing: books+acme@yourfirm.closebooks.io → "acme"
  const match = fromEmail.match(/books\+([^@]+)@/)
  if (match) return match[1]
  return null
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as PostmarkInboundPayload

    const fromEmail = payload.FromFull?.Email ?? payload.From ?? 'unknown@unknown.com'
    const fromName = payload.FromFull?.Name ?? fromEmail
    const subject = payload.Subject ?? '(no subject)'
    const textBody = payload.TextBody ?? ''
    const messageId = payload.MessageID ?? crypto.randomUUID()
    const receivedAt = payload.Date ?? new Date().toISOString()

    const documentType = detectDocumentType(subject, textBody)
    const clientSlug = routeToClient(fromEmail)

    const attachments = (payload.Attachments ?? []).map((att) => ({
      name: att.Name,
      contentType: att.ContentType,
      sizeBytes: att.ContentLength,
      // att.Content is base64 — in production store to Supabase Storage
      hasContent: att.Content.length > 0,
    }))

    const parsed = {
      messageId,
      receivedAt,
      from: { email: fromEmail, name: fromName },
      subject,
      documentType,
      clientSlug,
      attachmentCount: attachments.length,
      attachments,
      bodyPreview: textBody.slice(0, 300),
    }

    // Log parsed envelope (production: enqueue for async processing)
    console.log('[receive-email] Parsed inbound email:', JSON.stringify(parsed, null, 2))

    // TODO (production):
    // 1. Store document record in Supabase with status="processing"
    // 2. Enqueue background job → call /api/inbox/process-document
    // 3. Update document record with extracted data + match candidates
    // 4. Push realtime update via Supabase realtime channel

    return NextResponse.json({ ok: true, messageId, documentType, clientSlug }, { status: 200 })
  } catch (err) {
    console.error('[receive-email] Error parsing payload:', err)
    // Always return 200 to prevent Postmark retries
    return NextResponse.json({ ok: false, error: 'parse error' }, { status: 200 })
  }
}
