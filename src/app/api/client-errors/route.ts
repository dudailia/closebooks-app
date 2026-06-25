import { NextRequest, NextResponse } from 'next/server'

// TEMPORARY diagnostic — logs client-side errors to the server (Vercel logs).
// Remove once the /dashboard/clients crash is confirmed fixed in production.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    console.error('[CloseBooks][client-error]', JSON.stringify({
      source: b?.source ?? null,
      message: b?.message ?? null,
      stack: b?.stack ?? null,
      digest: b?.digest ?? null,
      url: b?.url ?? null,
      ts: new Date().toISOString(),
    }))
  } catch {
    console.error('[CloseBooks][client-error] failed to parse payload')
  }
  return NextResponse.json({ ok: true })
}
