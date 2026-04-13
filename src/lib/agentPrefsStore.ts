import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

export type AgentClientPref = { enabled: boolean; lastRun?: string }

export type AgentPrefsState = Record<string, AgentClientPref>

let _prefs: AgentPrefsState = {}

export async function hydrateAgent(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('agent_preferences').select('payload').eq('firm_id', firmId).maybeSingle()
  _prefs = (data?.payload as AgentPrefsState) ?? {}
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('agent_preferences').upsert(
    { firm_id: ctx.firmId, payload: _prefs },
    { onConflict: 'firm_id' }
  )
}

export function getAgentPrefs(): AgentPrefsState {
  return { ..._prefs }
}

export function saveAgentPrefs(prefs: AgentPrefsState): void {
  _prefs = { ...prefs }
  void persist()
}
