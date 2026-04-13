import type { Insight } from '@/app/api/insights/route'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

interface CacheEntry {
  insights: Insight[]
  generatedAt: string
}

const TTL_MS = 24 * 60 * 60 * 1000

let _cache: Record<string, CacheEntry> = {}

export async function hydrateInsights(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('insights_cache').select('payload').eq('firm_id', firmId).maybeSingle()
  _cache = (data?.payload as Record<string, CacheEntry>) ?? {}
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('insights_cache').upsert(
    { firm_id: ctx.firmId, payload: _cache },
    { onConflict: 'firm_id' }
  )
}

function load(): Record<string, CacheEntry> {
  return _cache
}

export function getCachedInsights(cacheKey: string): Insight[] | null {
  const all = load()
  const entry = all[cacheKey]
  if (!entry) return null
  if (Date.now() - new Date(entry.generatedAt).getTime() > TTL_MS) return null
  return entry.insights
}

export function setCachedInsights(cacheKey: string, insights: Insight[]): void {
  const all = { ...load() }
  all[cacheKey] = { insights, generatedAt: new Date().toISOString() }
  _cache = all
  void persist()
}

export function clearCachedInsights(cacheKey: string): void {
  const all = { ...load() }
  delete all[cacheKey]
  _cache = all
  void persist()
}
