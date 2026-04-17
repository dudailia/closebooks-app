/**
 * Resolve firm_id for API routes: prefer firm_members (any role), fall back to firms.owner_id.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export async function getFirmIdForUserServer(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: member } = await supabase
    .from('firm_members')
    .select('firm_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (member?.firm_id) return member.firm_id as string

  const { data: firm } = await supabase
    .from('firms')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  return (firm?.id as string | undefined) ?? null
}
