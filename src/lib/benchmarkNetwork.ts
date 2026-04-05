import type { CategorizationJob, ClientIndustry } from '@/types'
import { NETWORK_BENCHMARKS } from './benchmarkNetworkData'

export type { SpendRatio } from './benchmarkNetworkData'
import type { SpendRatio } from './benchmarkNetworkData'

// ─── BenchmarkResult ─────────────────────────────────────────────────────────

export interface BenchmarkResult {
  category: string
  clientPct: number
  networkMedian: number
  networkP25: number
  networkP75: number
  status: 'below' | 'on-track' | 'above'
  insight: string
  sampleSize: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Payroll & Wages':         ['payroll', 'wage', 'salary', 'salaries', 'compensation', 'labor', 'staff'],
  'Cost of Goods Sold':      ['cogs', 'cost of goods', 'inventory', 'materials', 'supplies', 'raw material', 'merchandise'],
  'Rent & Occupancy':        ['rent', 'lease', 'occupancy', 'property', 'real estate', 'facility'],
  'Utilities':               ['utility', 'utilities', 'electric', 'gas', 'water', 'internet', 'phone', 'telecom'],
  'Marketing & Advertising': ['marketing', 'advertising', 'ads', 'promotion', 'media', 'seo', 'social'],
  'Software & SaaS':         ['software', 'saas', 'subscription', 'license', 'cloud', 'app', 'tool', 'platform'],
  'Office Supplies':         ['office', 'supplies', 'stationery', 'paper', 'postage', 'printing'],
  'Travel & Entertainment':  ['travel', 'entertainment', 'meals', 'hotel', 'flight', 'conference', 'client entertainment'],
  'Insurance':               ['insurance', 'liability', 'coverage', 'premium', 'policy'],
  'Professional Services':   ['professional', 'consulting', 'legal', 'accounting', 'audit', 'advisory'],
}

function matchCategory(transactionCategory: string): string | null {
  const lower = transactionCategory.toLowerCase()
  for (const [benchmarkCat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return benchmarkCat
  }
  return null
}

// ─── buildLocalBenchmarks ────────────────────────────────────────────────────

/**
 * Reads all completed jobs stored under the given array, computes spend ratios
 * per industry/category, and returns them as SpendRatio records.
 * Falls back to NETWORK_BENCHMARKS when there is no local data for a bucket.
 */
export function buildLocalBenchmarks(jobs: CategorizationJob[]): SpendRatio[] {
  // Group jobs by industry using client_name as a proxy — we don't have the
  // industry on the job itself, so we return the seed data enriched with any
  // local signals we can derive.
  const completed = jobs.filter((j) => j.status === 'completed')
  if (completed.length === 0) return NETWORK_BENCHMARKS

  // Aggregate per job: compute total expenses and per-category expenses
  type Bucket = { values: number[] }
  const buckets = new Map<string, Bucket>() // key: `${industry}::${category}`

  // Since CategorizationJob doesn't carry an industry field, we can only build
  // cross-industry ratios here. We use industry='Other' as a local-firm bucket.
  for (const job of completed) {
    const totalExpense = job.transactions
      .filter((t) => t.type === 'debit' && (t.status === 'approved' || t.status === 'edited'))
      .reduce((s, t) => s + t.amount, 0)
    if (totalExpense === 0) continue

    const catTotals = new Map<string, number>()
    for (const txn of job.transactions) {
      if (txn.type !== 'debit') continue
      if (txn.status === 'pending' || txn.status === 'flagged') continue
      const cat = matchCategory(txn.final_category ?? txn.suggested_category ?? '')
      if (!cat) continue
      catTotals.set(cat, (catTotals.get(cat) ?? 0) + txn.amount)
    }

    Array.from(catTotals.entries()).forEach(([cat, total]) => {
      const pct = (total / totalExpense) * 100
      const key = `Other::${cat}`
      const bucket = buckets.get(key) ?? { values: [] }
      bucket.values.push(pct)
      buckets.set(key, bucket)
    })
  }

  // Build result: start from network seed, override 'Other' buckets where we
  // have local data
  const results: SpendRatio[] = [...NETWORK_BENCHMARKS]

  Array.from(buckets.entries()).forEach(([key, bucket]) => {
    const [, category] = key.split('::')
    const sorted = [...bucket.values].sort((a, b) => a - b)
    const n = sorted.length
    if (n === 0) return

    const p25 = sorted[Math.floor(n * 0.25)] ?? sorted[0]
    const median = sorted[Math.floor(n * 0.5)] ?? sorted[0]
    const p75 = sorted[Math.floor(n * 0.75)] ?? sorted[n - 1]

    const idx = results.findIndex((r) => r.industry === 'Other' && r.category === category)
    const entry: SpendRatio = {
      industry: 'Other',
      category,
      p25: Math.round(p25 * 10) / 10,
      median: Math.round(median * 10) / 10,
      p75: Math.round(p75 * 10) / 10,
      sampleSize: n,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }
    if (idx >= 0) results[idx] = entry
    else results.push(entry)
  })

  return results
}

// ─── getClientBenchmarks ─────────────────────────────────────────────────────

/**
 * For one job, compare each expense category against the network data for the
 * given industry.
 */
export function getClientBenchmarks(
  job: CategorizationJob,
  networkData: SpendRatio[],
  industry?: ClientIndustry,
): BenchmarkResult[] {
  const industryFilter = industry ?? 'Other'
  const industryBenchmarks = networkData.filter((r) => r.industry === industryFilter)
  if (industryBenchmarks.length === 0) return []

  const totalExpense = job.transactions
    .filter((t) => t.type === 'debit' && (t.status === 'approved' || t.status === 'edited'))
    .reduce((s, t) => s + t.amount, 0)

  if (totalExpense === 0) return []

  // Aggregate per benchmark category
  const catTotals = new Map<string, number>()
  for (const txn of job.transactions) {
    if (txn.type !== 'debit') continue
    if (txn.status === 'pending' || txn.status === 'flagged') continue
    const cat = matchCategory(txn.final_category ?? txn.suggested_category ?? '')
    if (!cat) continue
    catTotals.set(cat, (catTotals.get(cat) ?? 0) + txn.amount)
  }

  const results: BenchmarkResult[] = []

  for (const benchmark of industryBenchmarks) {
    const catTotal = catTotals.get(benchmark.category)
    if (catTotal === undefined) continue

    const clientPct = Math.round((catTotal / totalExpense) * 1000) / 10 // one decimal

    let status: BenchmarkResult['status']
    let insight: string

    if (clientPct < benchmark.p25) {
      status = 'below'
      insight = `Your ${benchmark.category} spend (${clientPct}%) is below the 25th percentile for ${industryFilter} firms. This is an efficiency advantage.`
    } else if (clientPct > benchmark.p75) {
      status = 'above'
      insight = `Your ${benchmark.category} spend (${clientPct}%) exceeds the 75th percentile. Typical range is ${benchmark.p25}–${benchmark.p75}% of expenses.`
    } else {
      status = 'on-track'
      insight = `Your ${benchmark.category} spend (${clientPct}%) is within the typical range (${benchmark.p25}–${benchmark.p75}%) for ${industryFilter} firms.`
    }

    results.push({
      category: benchmark.category,
      clientPct,
      networkMedian: benchmark.median,
      networkP25: benchmark.p25,
      networkP75: benchmark.p75,
      status,
      insight,
      sampleSize: benchmark.sampleSize,
    })
  }

  // Sort: above median first, then on-track, then below
  const order: Record<BenchmarkResult['status'], number> = { above: 0, 'on-track': 1, below: 2 }
  return results.sort((a, b) => order[a.status] - order[b.status])
}

// ─── submitBenchmarkContribution ─────────────────────────────────────────────

const CONTRIBUTION_KEY = 'cb_network_contribution'

export function submitBenchmarkContribution(
  job: CategorizationJob,
  industry: ClientIndustry,
): void {
  if (typeof window === 'undefined') return
  try {
    const existing: unknown[] = JSON.parse(localStorage.getItem(CONTRIBUTION_KEY) ?? '[]')
    const ratios: { category: string; pct: number }[] = []

    const totalExpense = job.transactions
      .filter((t) => t.type === 'debit' && (t.status === 'approved' || t.status === 'edited'))
      .reduce((s, t) => s + t.amount, 0)

    if (totalExpense > 0) {
      const catTotals = new Map<string, number>()
      for (const txn of job.transactions) {
        if (txn.type !== 'debit') continue
        if (txn.status === 'pending' || txn.status === 'flagged') continue
        const cat = matchCategory(txn.final_category ?? txn.suggested_category ?? '')
        if (!cat) continue
        catTotals.set(cat, (catTotals.get(cat) ?? 0) + txn.amount)
      }
      Array.from(catTotals.entries()).forEach(([cat, total]) => {
        ratios.push({ category: cat, pct: Math.round((total / totalExpense) * 1000) / 10 })
      })
    }

    existing.push({
      jobId: job.id,
      industry,
      ratios,
      contributedAt: new Date().toISOString(),
    })
    localStorage.setItem(CONTRIBUTION_KEY, JSON.stringify(existing))
  } catch {
    // Ignore storage errors
  }
}

// ─── getNetworkStats ─────────────────────────────────────────────────────────

export function getNetworkStats(): {
  firmCount: number
  transactionCount: number
  industriesCount: number
} {
  if (typeof window === 'undefined') {
    return { firmCount: 1247, transactionCount: 2300000, industriesCount: 13 }
  }

  try {
    const contributions: unknown[] = JSON.parse(
      localStorage.getItem(CONTRIBUTION_KEY) ?? '[]',
    )
    // Simulated base numbers + local contributions add a small realistic delta
    const localFirms = new Set(
      (contributions as Array<{ jobId?: string }>).map((c) => c.jobId ?? ''),
    ).size
    return {
      firmCount: 1247 + localFirms,
      transactionCount: 2_300_000 + localFirms * 847,
      industriesCount: 13,
    }
  } catch {
    return { firmCount: 1247, transactionCount: 2300000, industriesCount: 13 }
  }
}
