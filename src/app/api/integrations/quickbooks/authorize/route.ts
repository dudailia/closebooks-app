import { NextRequest, NextResponse } from 'next/server'
import { getIntuitAuthBase, getQboRedirectUri, isQBOOAuthConfigured } from '@/lib/qboConfig'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

const STATE_COOKIE = 'cb_qbo_oauth_state'
const STATE_MAX_AGE = 600

function randomState(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Starts Intuit OAuth. Requires INTUIT_CLIENT_ID, INTUIT_CLIENT_SECRET, and Supabase auth.
 */
export async function GET(request: NextRequest) {
  if (!isQBOOAuthConfigured()) {
    return NextResponse.json(
      {
        error: 'QuickBooks OAuth is not configured. Set INTUIT_CLIENT_ID and INTUIT_CLIENT_SECRET.',
      },
      { status: 503 }
    )
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', '/dashboard/integrations')
    return NextResponse.redirect(login)
  }

  const clientId = process.env.INTUIT_CLIENT_ID!
  const origin = request.nextUrl.origin
  const redirectUri = getQboRedirectUri(origin)
  const state = randomState()

  const url = new URL(getIntuitAuthBase())
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'com.intuit.quickbooks.accounting openid profile email')
  url.searchParams.set('state', state)

  const res = NextResponse.redirect(url.toString())
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_MAX_AGE,
  })

  return res
}
