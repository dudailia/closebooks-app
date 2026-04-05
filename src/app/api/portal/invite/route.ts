import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { clientId, email, firmName, portalUrl } = await request.json()
  // In production: send email via Resend/SendGrid
  // For demo: just return success
  return NextResponse.json({
    success: true,
    message: `Invitation sent to ${email}`,
    portalUrl,
  })
}
