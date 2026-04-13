/**
 * Client-side firm ID for the signed-in user (RLS uses same scope server-side).
 */

import { createClient, supabaseConfigured } from '@/lib/supabase/client'

export async function getFirmIdForUser(): Promise<string | null> {
  if (!supabaseConfigured) return null
  try {
    const supabase = createClient()
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    return data?.id ?? null
  } catch {
    return null
  }
}
