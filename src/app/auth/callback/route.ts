import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only allow same-origin paths. Rejects "//evil.com", "/\evil.com", and
// values like "@evil.com" that would turn `${origin}${next}` into another host.
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/dashboard'
  }
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = createClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
