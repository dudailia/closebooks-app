import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { getFirmIdForUser } from '@/lib/supabase/firmScope'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function withFirm<T>(
  fn: (supabase: SupabaseClient, firmId: string) => Promise<T>
): Promise<T | null> {
  if (!supabaseConfigured) return null
  const supabase = createClient()
  if (!supabase) return null
  const firmId = await getFirmIdForUser()
  if (!firmId) return null
  return fn(supabase, firmId)
}

export async function getSupabaseAndFirm(): Promise<{ supabase: SupabaseClient; firmId: string } | null> {
  if (!supabaseConfigured) return null
  const supabase = createClient()
  if (!supabase) return null
  const firmId = await getFirmIdForUser()
  if (!firmId) return null
  return { supabase, firmId }
}
