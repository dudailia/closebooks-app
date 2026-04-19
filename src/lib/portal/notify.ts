const RESEND_API_KEY = process.env.RESEND_API_KEY

function accentStyle(accentColor: string) {
  return `background-color:${accentColor};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;`
}

function emailHtml(opts: {
  firmName: string
  accentColor: string
  preheader: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
}): string {
  const { firmName, accentColor, preheader, body, ctaLabel, ctaUrl } = opts
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf8f4;font-family:system-ui,sans-serif;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:${accentColor};border-radius:12px 12px 0 0;padding:20px 28px;">
  <span style="font-size:20px;font-weight:700;color:#ffffff;">${firmName}</span>
</td></tr>
<tr><td style="background:#ffffff;padding:28px;border:1px solid #e8e0d4;border-top:none;">
  ${body}
  ${ctaLabel && ctaUrl ? `<p style="margin:24px 0 0;"><a href="${ctaUrl}" style="${accentStyle(accentColor)}">${ctaLabel}</a></p>` : ''}
</td></tr>
<tr><td style="padding:16px 28px;font-size:12px;color:#9ca3af;background:#f5f3ef;border-radius:0 0 12px 12px;">
  You're receiving this because your accountant uses ${firmName}'s client portal.
</td></tr>
</table></td></tr></table>
</body></html>`
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[portal/notify] RESEND_API_KEY not set — email skipped:', subject)
    return
  }
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)
    await resend.emails.send({
      from: 'portal@closebooks.app',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('[portal/notify] Resend error:', err)
  }
}

export async function notifyClientDocumentRequest(opts: {
  clientEmail: string
  firmName: string
  accentColor: string
  docName: string
  note?: string
  portalUrl: string
}): Promise<void> {
  const { clientEmail, firmName, accentColor, docName, note, portalUrl } = opts
  const html = emailHtml({
    firmName,
    accentColor,
    preheader: `${firmName} needs a document from you: ${docName}`,
    body: `<p style="font-size:16px;color:#1a1714;margin:0 0 12px;">Your accountant needs a document from you.</p>
<p style="font-size:22px;font-weight:700;color:#1a1714;margin:0 0 12px;">${docName}</p>
${note ? `<p style="font-size:14px;color:#6b6560;margin:0 0 16px;">${note}</p>` : ''}
<p style="font-size:14px;color:#6b6560;margin:0;">Log in to your portal to upload it.</p>`,
    ctaLabel: 'Upload Document',
    ctaUrl: `${portalUrl}/documents`,
  })
  await send(clientEmail, `${firmName}: Document needed — ${docName}`, html)
}

export async function notifyFirmDocumentUploaded(opts: {
  firmEmail: string
  firmName: string
  accentColor: string
  clientName: string
  docName: string
  dashboardUrl: string
}): Promise<void> {
  const { firmEmail, firmName, accentColor, clientName, docName, dashboardUrl } = opts
  const html = emailHtml({
    firmName,
    accentColor,
    preheader: `${clientName} uploaded: ${docName}`,
    body: `<p style="font-size:16px;color:#1a1714;margin:0 0 8px;"><strong>${clientName}</strong> uploaded a document.</p>
<p style="font-size:20px;font-weight:700;color:#1a1714;margin:0;">${docName}</p>`,
    ctaLabel: 'Review in Dashboard',
    ctaUrl: dashboardUrl,
  })
  await send(firmEmail, `${clientName} uploaded: ${docName}`, html)
}

export async function notifyFirmNewMessage(opts: {
  firmEmail: string
  firmName: string
  accentColor: string
  clientName: string
  messagePreview: string
  dashboardUrl: string
}): Promise<void> {
  const { firmEmail, firmName, accentColor, clientName, messagePreview, dashboardUrl } = opts
  const html = emailHtml({
    firmName,
    accentColor,
    preheader: `New message from ${clientName}`,
    body: `<p style="font-size:16px;color:#1a1714;margin:0 0 12px;">New message from <strong>${clientName}</strong>:</p>
<blockquote style="border-left:3px solid ${accentColor};margin:0;padding:10px 16px;background:#faf8f4;font-size:14px;color:#6b6560;">${messagePreview}</blockquote>`,
    ctaLabel: 'Reply in Dashboard',
    ctaUrl: dashboardUrl,
  })
  await send(firmEmail, `New message from ${clientName}`, html)
}

export async function notifyClientNewMessage(opts: {
  clientEmail: string
  firmName: string
  accentColor: string
  messagePreview: string
  portalUrl: string
}): Promise<void> {
  const { clientEmail, firmName, accentColor, messagePreview, portalUrl } = opts
  const html = emailHtml({
    firmName,
    accentColor,
    preheader: `Message from ${firmName}`,
    body: `<p style="font-size:16px;color:#1a1714;margin:0 0 12px;">Your accountant sent you a message:</p>
<blockquote style="border-left:3px solid ${accentColor};margin:0;padding:10px 16px;background:#faf8f4;font-size:14px;color:#6b6560;">${messagePreview}</blockquote>`,
    ctaLabel: 'View Message',
    ctaUrl: `${portalUrl}/messages`,
  })
  await send(clientEmail, `Message from ${firmName}`, html)
}

export async function notifyClientActionItem(opts: {
  clientEmail: string
  firmName: string
  accentColor: string
  title: string
  description?: string
  dueDate?: string
  portalUrl: string
}): Promise<void> {
  const { clientEmail, firmName, accentColor, title, description, dueDate, portalUrl } = opts
  const html = emailHtml({
    firmName,
    accentColor,
    preheader: `${firmName}: Action needed — ${title}`,
    body: `<p style="font-size:16px;color:#1a1714;margin:0 0 8px;">Your accountant added an action item for you:</p>
<p style="font-size:20px;font-weight:700;color:#1a1714;margin:0 0 8px;">${title}</p>
${description ? `<p style="font-size:14px;color:#6b6560;margin:0 0 8px;">${description}</p>` : ''}
${dueDate ? `<p style="font-size:13px;color:#b8734a;margin:0;">Due: ${dueDate}</p>` : ''}`,
    ctaLabel: 'View Action Items',
    ctaUrl: `${portalUrl}/actions`,
  })
  await send(clientEmail, `${firmName}: Action needed — ${title}`, html)
}

export async function notifyFirmActionCompleted(opts: {
  firmEmail: string
  firmName: string
  accentColor: string
  clientName: string
  title: string
  dashboardUrl: string
}): Promise<void> {
  const { firmEmail, firmName, accentColor, clientName, title, dashboardUrl } = opts
  const html = emailHtml({
    firmName,
    accentColor,
    preheader: `${clientName} completed: ${title}`,
    body: `<p style="font-size:16px;color:#1a1714;margin:0 0 8px;"><strong>${clientName}</strong> completed an action item:</p>
<p style="font-size:20px;font-weight:700;color:#2d5a27;margin:0;">✓ ${title}</p>`,
    ctaLabel: 'View in Dashboard',
    ctaUrl: dashboardUrl,
  })
  await send(firmEmail, `${clientName} completed: ${title}`, html)
}
