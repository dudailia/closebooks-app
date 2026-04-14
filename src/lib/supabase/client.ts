import { createBrowserClient } from '@supabase/ssr'
import { supabaseCookieOptions } from '@/lib/supabase/cookieOptions'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured =
  !!SUPABASE_URL && !SUPABASE_URL.startsWith('your_') &&
  !!SUPABASE_ANON && !SUPABASE_ANON.startsWith('your_')

/** Returns a Supabase browser client, or null if env vars aren't set. */
export function createClient() {
  if (!supabaseConfigured) return null
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON, {
    cookieOptions: supabaseCookieOptions,
  })
}
