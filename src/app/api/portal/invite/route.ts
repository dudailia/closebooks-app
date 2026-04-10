import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: { clientId?: string; email?: string; firmName?: string; portalUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { email, portalUrl } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required.' }, { status: 400 })
  }

  // In production: send email via Resend/SendGrid using email, firmName, portalUrl
  return NextResponse.json({
    success: true,
    message: `Invitation sent to ${email}`,
    portalUrl,
  })
}
