import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseCookieOptions } from '@/lib/supabase/cookieOptions'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured =
  !!SUPABASE_URL && !SUPABASE_URL.startsWith('your_') &&
  !!SUPABASE_ANON && !SUPABASE_ANON.startsWith('your_')

/**
 * Returns a Supabase server client, or null if env vars aren't set.
 * Async since Next 15: `cookies()` returns a Promise.
 */
export async function createClient() {
  if (!supabaseConfigured) return null

  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — cookies can only be mutated
          // in middleware or Server Actions, so we silently ignore.
        }
      },
    },
  })
}
