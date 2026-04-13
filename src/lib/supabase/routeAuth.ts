/**
 * Supabase session for Route Handlers — reads auth cookies from the incoming request.
 */

import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseEnvConfigured(): boolean {
  return (
    !!SUPABASE_URL &&
    !SUPABASE_URL.startsWith('your_') &&
    !!SUPABASE_ANON &&
    !SUPABASE_ANON.startsWith('your_')
  )
}

/** Server client bound to the request cookies (App Router route handlers). */
export function createRouteHandlerClient(request: NextRequest) {
  if (!isSupabaseEnvConfigured()) return null

  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {
        /* Route handlers often cannot set cookies; session refresh handled elsewhere */
      },
    },
  })
}

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const supabase = createRouteHandlerClient(request)
  if (!supabase) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
