import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { shouldAllowDashboardAccess } from '@/lib/middlewareSubscription'
import { supabaseCookieOptions } from '@/lib/supabase/cookieOptions'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const IDLE_MS = 30 * 60 * 1000
const LAST_ACTIVE_COOKIE = 'cb_last_active'

const supabaseConfigured =
  !!SUPABASE_URL &&
  !SUPABASE_URL.startsWith('your_') &&
  !!SUPABASE_ANON &&
  !SUPABASE_ANON.startsWith('your_')

function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-RateLimit-Policy': 'global-edge',
  }
}

function applySecurityHeaders(res: NextResponse): void {
  const h = securityHeaders()
  Object.entries(h).forEach(([k, v]) => res.headers.set(k, v))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!supabaseConfigured) {
    const res = NextResponse.next()
    applySecurityHeaders(res)
    return res
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookieOptions: {
      ...supabaseCookieOptions,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: request.headers } })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            ...supabaseCookieOptions,
          })
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboard = pathname.startsWith('/dashboard')
  const subscriptionExempt =
    pathname === '/dashboard/subscription' || pathname.startsWith('/dashboard/subscription/')

  // 30-minute inactivity → require re-authentication (cookie tick)
  if (user && isDashboard) {
    const raw = request.cookies.get(LAST_ACTIVE_COOKIE)?.value
    const last = raw ? Number.parseInt(raw, 10) : NaN
    const now = Date.now()
    if (Number.isFinite(last) && now - last > IDLE_MS) {
      const login = new URL('/login', request.url)
      login.searchParams.set('next', pathname)
      login.searchParams.set('reason', 'idle')
      const redirectRes = NextResponse.redirect(login)
      redirectRes.cookies.delete(LAST_ACTIVE_COOKIE)
      applySecurityHeaders(redirectRes)
      return redirectRes
    }
    response.cookies.set(LAST_ACTIVE_COOKIE, String(now), {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    })
  }

  if (isDashboard && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    const redirectRes = NextResponse.redirect(loginUrl)
    applySecurityHeaders(redirectRes)
    return redirectRes
  }

  if (user?.email && isDashboard && !subscriptionExempt) {
    const allowed = await shouldAllowDashboardAccess(request, user.email, user.id)
    if (!allowed) {
      const pricingUrl = new URL('/pricing', request.url)
      pricingUrl.searchParams.set('required', '1')
      const redirectRes = NextResponse.redirect(pricingUrl)
      applySecurityHeaders(redirectRes)
      return redirectRes
    }
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const redirectRes = NextResponse.redirect(new URL('/dashboard', request.url))
    applySecurityHeaders(redirectRes)
    return redirectRes
  }

  applySecurityHeaders(response)
  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
