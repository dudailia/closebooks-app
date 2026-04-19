import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getIntuitTokenUrl, getQboRedirectUri, isQBOOAuthConfigured } from '@/lib/qboConfig'
import { getUserFromRequest } from '@/lib/supabase/routeAuth'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'cb_qbo_oauth_state'

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function exchangeCode(code: string, redirectUri: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const clientId = process.env.INTUIT_CLIENT_ID!
  const clientSecret = process.env.INTUIT_CLIENT_SECRET!
  const basic = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const res = await fetch(getIntuitTokenUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[QBO callback] token exchange failed:', res.status, text)
    throw new Error('Token exchange failed')
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

async function fetchCompanyName(realmId: string, accessToken: string): Promise<string> {
  try {
    const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}?minorversion=65`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return `Company ${realmId.slice(0, 8)}…`
    const data = (await res.json()) as {
      CompanyInfo?: { CompanyName?: string }
    }
    const name = data.CompanyInfo?.CompanyName
    return name && name.trim() ? name : `Company ${realmId.slice(0, 8)}…`
  } catch {
    return `Company ${realmId.slice(0, 8)}…`
  }
}

/**
 * Intuit redirects here with ?code=&state=&realmId=
 */
export async function GET(request: NextRequest) {
  const baseRedirect = new URL('/dashboard/integrations', request.url)

  if (!isQBOOAuthConfigured()) {
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', 'not_configured')
    return NextResponse.redirect(baseRedirect)
  }

  const user = await getUserFromRequest(request)
  if (!user) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(login)
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const realmId = request.nextUrl.searchParams.get('realmId')
  const err = request.nextUrl.searchParams.get('error')

  if (err) {
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', err)
    return NextResponse.redirect(baseRedirect)
  }

  const cookieState = request.cookies.get(STATE_COOKIE)?.value
  if (!code || !state || !realmId || !cookieState || state !== cookieState) {
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', 'invalid_state')
    const res = NextResponse.redirect(baseRedirect)
    res.cookies.delete(STATE_COOKIE)
    return res
  }

  const origin = request.nextUrl.origin
  const redirectUri = getQboRedirectUri(origin)

  let tokens: { access_token: string; refresh_token: string; expires_in: number }
  try {
    tokens = await exchangeCode(code, redirectUri)
  } catch {
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', 'token_exchange')
    const res = NextResponse.redirect(baseRedirect)
    res.cookies.delete(STATE_COOKIE)
    return res
  }

  const supabase = getSupabaseService()
  if (!supabase) {
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', 'no_service_role')
    const res = NextResponse.redirect(baseRedirect)
    res.cookies.delete(STATE_COOKIE)
    return res
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!firm?.id) {
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', 'no_firm')
    const res = NextResponse.redirect(baseRedirect)
    res.cookies.delete(STATE_COOKIE)
    return res
  }

  const companyName = await fetchCompanyName(realmId, tokens.access_token)
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const { error: upsertErr } = await supabase.from('qbo_connections').upsert(
    {
      firm_id: firm.id,
      user_id: user.id,
      realm_id: realmId,
      company_name: companyName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'firm_id' }
  )

  if (upsertErr) {
    console.error('[QBO callback] upsert failed:', upsertErr.message)
    baseRedirect.searchParams.set('qbo', 'error')
    baseRedirect.searchParams.set('msg', 'save_failed')
    const res = NextResponse.redirect(baseRedirect)
    res.cookies.delete(STATE_COOKIE)
    return res
  }

  baseRedirect.searchParams.set('qbo', 'connected')
  const res = NextResponse.redirect(baseRedirect)
  res.cookies.delete(STATE_COOKIE)
  return res
}
