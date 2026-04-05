import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { firmName, primaryColor, accentColor, customDomain } = await request.json()

  const firmSlug = firmName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

  return NextResponse.json({
    success: true,
    firmSlug,
    portalUrl: `closebooks.app/portal/${firmSlug}`,
    customDomain: customDomain ?? null,
    provisionedAt: new Date().toISOString(),
    message: `Your branded portal is live at closebooks.app/portal/${firmSlug}`,
  })
}
