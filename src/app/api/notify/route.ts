import { NextResponse } from 'next/server'

const FORMSPREE_URL = 'https://formspree.io/f/xdapwdpn'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.event) {
    return NextResponse.json({ error: 'Missing event' }, { status: 400 })
  }

  const { event, details = {} } = body as { event: string; details: Record<string, unknown> }

  // Format a readable message for the email
  const detailLines = Object.entries(details)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  const message = [
    `Event: ${event}`,
    `Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET`,
    detailLines ? `\nDetails:\n${detailLines}` : '',
  ].filter(Boolean).join('\n')

  // Fire to Formspree — best-effort, never block the caller
  try {
    await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ subject: `CloseBooks: ${event}`, message }),
    })
  } catch {
    // Swallow — notification failure shouldn't break the app
  }

  return NextResponse.json({ ok: true })
}
