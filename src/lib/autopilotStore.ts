import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

let _prefs: Record<string, string> = {}

export async function hydrateAutopilot(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('autopilot_preferences').select('payload').eq('firm_id', firmId).maybeSingle()
  _prefs = { ...(data?.payload as Record<string, string>) }
}

export function getAutopilotPrefs(): Record<string, string> {
  return { ..._prefs }
}

export function getAutopilotPref(key: string, fallback: string): string {
  return _prefs[key] ?? fallback
}

export function setAutopilotPref(key: string, value: string): void {
  _prefs = { ..._prefs, [key]: value }
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (!ctx) return
    await ctx.supabase.from('autopilot_preferences').upsert(
      { firm_id: ctx.firmId, payload: _prefs },
      { onConflict: 'firm_id' }
    )
  })()
}
