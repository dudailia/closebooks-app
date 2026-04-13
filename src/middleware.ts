import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { shouldAllowDashboardAccess } from '@/lib/middlewareSubscription'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const supabaseConfigured =
  !!SUPABASE_URL && !SUPABASE_URL.startsWith('your_') &&
  !!SUPABASE_ANON && !SUPABASE_ANON.startsWith('your_')

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If Supabase is not configured, allow all routes through.
  // The app can run without auth; API routes still enforce secrets where needed.
  if (!supabaseConfigured) {
    return NextResponse.next()
  }

  // Build a response we can mutate to set cookies
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: request.headers } })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh the session so it doesn't expire mid-use
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isDashboard = pathname.startsWith('/dashboard')
  const subscriptionExempt =
    pathname === '/dashboard/subscription' || pathname.startsWith('/dashboard/subscription/')

  // Redirect unauthenticated users away from the dashboard
  if (isDashboard && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Paid access: no active sub / trial → pricing (except subscription page & checkout success)
  if (user?.email && isDashboard && !subscriptionExempt) {
    const allowed = await shouldAllowDashboardAccess(request, user.email, user.id)
    if (!allowed) {
      const pricingUrl = new URL('/pricing', request.url)
      pricingUrl.searchParams.set('required', '1')
      return NextResponse.redirect(pricingUrl)
    }
  }

  // Redirect authenticated users away from login/signup pages
  // But NOT from forgot-password or reset-password (they might need to reset even when logged in)
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    // '/forgot-password' intentionally NOT here — always accessible
  ],
}
