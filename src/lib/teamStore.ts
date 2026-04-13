import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'

export type TeamRole = 'Owner' | 'Reviewer' | 'Staff'

export interface TeamMemberRecord {
  id: string
  name: string
  email: string
  role: TeamRole
  assignedClients: string[]
  addedAt: string
  initials: string
  color: string
}

let _members: TeamMemberRecord[] = []

export async function hydrateTeam(supabase: SupabaseClient, firmId: string): Promise<void> {
  _members = await loadPayloadRows<TeamMemberRecord>(supabase, 'team_members', firmId)
}

export function getTeamMembers(): TeamMemberRecord[] {
  return _members
}

export function saveTeamMembers(members: TeamMemberRecord[]): void {
  _members = members
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (!ctx) return
    await ctx.supabase.from('team_members').delete().eq('firm_id', ctx.firmId)
    for (const m of members) {
      await upsertPayloadRow(ctx.supabase, 'team_members', ctx.firmId, m.id, m as unknown as Record<string, unknown>)
    }
  })()
}
