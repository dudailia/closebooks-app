import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'
import { loadFirmSettings } from '@/lib/firmSettings'

const POSTMARK_API = 'https://api.postmarkapp.com/email'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    toEmail: string
    toName: string
    clientName: string
    requestedItems: string[]
    dueDate?: string
    portalToken: string
    requestId: string
  }

  const { toEmail, toName, clientName, requestedItems, dueDate, portalToken, requestId } = body
  if (!toEmail || !clientName || !requestedItems?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const serverToken = process.env.POSTMARK_SERVER_TOKEN
  const fromEmail   = process.env.POSTMARK_FROM_EMAIL ?? `docs@inbox.closebooks.app`

  if (!serverToken) {
    // Dev mode: pretend it worked
    console.log('[send-request] Postmark not configured — simulating send to', toEmail)
    return NextResponse.json({ ok: true, simulated: true })
  }

  const settings = loadFirmSettings()
  const firmName  = settings.firmName || 'Your Accountant'
  const firmSlug  = settings.inboxSlug || 'firm'
  const replyTo   = `docs+${firmSlug}@inbox.closebooks.app`
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://closebooks.app'}/portal/${portalToken}`
  const dueLine   = dueDate ? `\n\nPlease submit by: **${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}**` : ''

  const itemsList = requestedItems.map((item, i) => `${i + 1}. ${item}`).join('\n')

  const textBody = `Hi ${toName || clientName},

${firmName} is requesting the following documents for your account:

${itemsList}${dueLine}

To upload your documents securely, visit:
${portalUrl}

Or simply reply to this email with your documents attached — they'll be automatically matched to this request.

Thank you,
${firmName}`

  const htmlBody = `<p>Hi ${toName || clientName},</p>
<p>${firmName} is requesting the following documents for your account:</p>
<ol>${requestedItems.map(item => `<li>${item}</li>`).join('')}</ol>
${dueDate ? `<p><strong>Please submit by: ${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>` : ''}
<p>
  <a href="${portalUrl}" style="display:inline-block;padding:12px 24px;background:#2d5a27;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
    Upload Documents Securely →
  </a>
</p>
<p>Or simply reply to this email with your documents attached — they'll be automatically matched to this request.</p>
<p>Thank you,<br>${firmName}</p>`

  try {
    const res = await fetch(POSTMARK_API, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': serverToken,
      },
      body: JSON.stringify({
        From: `${firmName} <${fromEmail}>`,
        To: toEmail,
        ReplyTo: replyTo,
        Subject: `Documents needed: ${clientName}`,
        TextBody: textBody,
        HtmlBody: htmlBody,
        MessageStream: 'outbound',
        Metadata: { requestId, clientName },
        Headers: [{ Name: 'X-Request-ID', Value: requestId }],
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.Message ?? 'Postmark error')
    return NextResponse.json({ ok: true, messageId: data.MessageID })
  } catch (err) {
    console.error('[send-request] Postmark error:', err)
    return NextResponse.json({ error: 'Email send failed', detail: String(err) }, { status: 500 })
  }
}
