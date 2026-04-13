import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

export interface ReferralStats {
  clicks: number
  signups: number
}

let _stats: ReferralStats = { clicks: 0, signups: 0 }

export async function hydrateReferrals(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('referral_stats').select('payload').eq('firm_id', firmId).maybeSingle()
  const p = data?.payload as ReferralStats | undefined
  _stats = p && typeof p.clicks === 'number' ? p : { clicks: 0, signups: 0 }
}

export function getReferralStats(): ReferralStats {
  return { ..._stats }
}

export function setReferralStats(stats: ReferralStats): void {
  _stats = { ...stats }
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (!ctx) return
    await ctx.supabase.from('referral_stats').upsert(
      { firm_id: ctx.firmId, payload: _stats },
      { onConflict: 'firm_id' }
    )
  })()
}
