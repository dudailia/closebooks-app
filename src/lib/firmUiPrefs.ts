import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

let _hourly: number | null = null

export async function hydrateFirmUiPrefs(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('firm_ui_preferences').select('hourly_rate').eq('firm_id', firmId).maybeSingle()
  _hourly = data?.hourly_rate != null ? Number(data.hourly_rate) : null
}

export function getHourlyRate(): number | null {
  return _hourly
}

export async function setHourlyRate(rate: number): Promise<void> {
  _hourly = rate
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('firm_ui_preferences').upsert(
    { firm_id: ctx.firmId, hourly_rate: rate },
    { onConflict: 'firm_id' }
  )
}
