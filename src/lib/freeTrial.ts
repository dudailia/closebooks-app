/**
 * Free trial / plan — stored in firm_usage (Postgres) when authenticated.
 */

import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const FREE_CLOSES = 5

interface TrialState {
  closesUsed: number
  startedAt: string
  plan: 'free' | 'starter' | 'growth' | 'scale' | 'enterprise'
  trialActivatedAt?: string
}

let _cache: TrialState = {
  closesUsed: 0,
  startedAt: new Date().toISOString(),
  plan: 'free',
}

export async function hydrateFirmUsage(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('firm_usage').select('*').eq('firm_id', firmId).maybeSingle()
  if (data) {
    _cache = {
      closesUsed: Number(data.closes_used ?? 0),
      startedAt: data.trial_started_at ?? new Date().toISOString(),
      plan: (data.plan_status as TrialState['plan']) ?? 'free',
      trialActivatedAt: data.trial_activated_at ?? undefined,
    }
  } else {
    _cache = { closesUsed: 0, startedAt: new Date().toISOString(), plan: 'free' }
  }
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('firm_usage').upsert(
    {
      firm_id: ctx.firmId,
      closes_used: _cache.closesUsed,
      trial_started_at: _cache.startedAt,
      plan_status: _cache.plan,
      trial_activated_at: _cache.trialActivatedAt ?? null,
    },
    { onConflict: 'firm_id' }
  )
}

const TRIAL_EVENT = 'closebooks_trial_updated'

function emitTrialUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TRIAL_EVENT))
  }
}

export function recordCloseUsed(): void {
  _cache.closesUsed++
  void persist()
  emitTrialUpdate()
}

export function getClosesUsed(): number {
  return _cache.closesUsed
}

export function getFreeClosesRemaining(): number {
  if (_cache.plan !== 'free') return Infinity
  return Math.max(0, FREE_CLOSES - _cache.closesUsed)
}

export function canStartClose(): boolean {
  if (_cache.plan !== 'free') return true
  return _cache.closesUsed < FREE_CLOSES
}

export function getCurrentPlan(): TrialState['plan'] {
  return _cache.plan
}

export function activatePlan(plan: TrialState['plan']): void {
  _cache.plan = plan
  _cache.trialActivatedAt = new Date().toISOString()
  void persist()
  emitTrialUpdate()
}

export { TRIAL_EVENT }

export function getTrialStatus(): {
  plan: TrialState['plan']
  closesUsed: number
  closesRemaining: number
  isOnFreeTier: boolean
  hasExhaustedTrial: boolean
  percentUsed: number
} {
  const isOnFreeTier = _cache.plan === 'free'
  const closesRemaining = isOnFreeTier ? Math.max(0, FREE_CLOSES - _cache.closesUsed) : Infinity
  const hasExhaustedTrial = isOnFreeTier && _cache.closesUsed >= FREE_CLOSES
  return {
    plan: _cache.plan,
    closesUsed: _cache.closesUsed,
    closesRemaining,
    isOnFreeTier,
    hasExhaustedTrial,
    percentUsed: isOnFreeTier ? Math.min(100, Math.round((_cache.closesUsed / FREE_CLOSES) * 100)) : 0,
  }
}

export { FREE_CLOSES }
