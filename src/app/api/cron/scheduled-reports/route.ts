import { NextRequest, NextResponse } from 'next/server'

/**
 * Placeholder for scheduled close summaries / firm digests.
 * Wire this to Supabase `jobs` + `clients.contact_email` and Resend when cloud jobs are the source of truth.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    message:
      'Scheduled report delivery is not fully wired to Supabase job completion yet. Use Send PDF from the review page or extend this cron with firm + client queries.',
  })
}
