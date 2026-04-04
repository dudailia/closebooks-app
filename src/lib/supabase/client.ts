import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabaseConfigured =
  !!SUPABASE_URL && !SUPABASE_URL.startsWith('your_') &&
  !!SUPABASE_ANON && !SUPABASE_ANON.startsWith('your_')

export function createClient() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.')
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}
