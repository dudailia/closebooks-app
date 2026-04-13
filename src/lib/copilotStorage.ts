import type { CopilotRun, CopilotConfig } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'

const MAX_RUNS = 50

export const DEFAULT_CONFIG: CopilotConfig = {
  confidenceThreshold: 0.85,
  maxAutoAmount: 5000,
  autoFlagThreshold: 0.6,
}

let _config: CopilotConfig = { ...DEFAULT_CONFIG }
let _runs: CopilotRun[] = []

export async function hydrateCopilot(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('copilot_config').select('payload').eq('firm_id', firmId).maybeSingle()
  _config = data?.payload ? { ...DEFAULT_CONFIG, ...(data.payload as CopilotConfig) } : { ...DEFAULT_CONFIG }
  _runs = await loadPayloadRows<CopilotRun>(supabase, 'copilot_runs', firmId)
}

async function persistConfig(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('copilot_config').upsert(
    { firm_id: ctx.firmId, payload: _config },
    { onConflict: 'firm_id' }
  )
}

async function persistRuns(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const r of _runs) {
    await upsertPayloadRow(ctx.supabase, 'copilot_runs', ctx.firmId, r.id, r as unknown as Record<string, unknown>)
  }
}

export function loadCopilotConfig(): CopilotConfig {
  return { ..._config }
}

export function saveCopilotConfig(config: CopilotConfig): void {
  _config = { ...config }
  void persistConfig()
}

export function getCopilotRuns(): CopilotRun[] {
  return _runs
}

export function saveCopilotRun(run: CopilotRun): void {
  _runs = _runs.filter((r) => r.id !== run.id)
  _runs.unshift(run)
  _runs = _runs.slice(0, MAX_RUNS)
  void persistRuns()
}

export function getRunsForJob(jobId: string): CopilotRun[] {
  return _runs.filter((r) => r.jobId === jobId)
}
