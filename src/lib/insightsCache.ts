import type { Insight } from '@/app/api/insights/route'

interface CacheEntry {
  insights: Insight[]
  generatedAt: string
}

const KEY = 'closebooks_insights'
// Cache is valid for 24 hours — after that, allow regeneration
const TTL_MS = 24 * 60 * 60 * 1000

function load(): Record<string, CacheEntry> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(data: Record<string, CacheEntry>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getCachedInsights(cacheKey: string): Insight[] | null {
  const all   = load()
  const entry = all[cacheKey]
  if (!entry) return null
  // Expire after TTL
  if (Date.now() - new Date(entry.generatedAt).getTime() > TTL_MS) return null
  return entry.insights
}

export function setCachedInsights(cacheKey: string, insights: Insight[]): void {
  const all = load()
  all[cacheKey] = { insights, generatedAt: new Date().toISOString() }
  save(all)
}

export function clearCachedInsights(cacheKey: string): void {
  const all = load()
  delete all[cacheKey]
  save(all)
}
