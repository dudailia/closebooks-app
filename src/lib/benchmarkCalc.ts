import { BENCHMARKS } from './benchmarkData'
import type { CategorizationJob } from '@/types'
import type { ClientIndustry } from '@/types'

export interface BenchmarkResult {
  category: string
  label: string
  clientPct: number
  p25: number
  median: number
  p75: number
  delta: number                               // clientPct - median
  position: 'excellent' | 'normal' | 'high'  // relative to P75/P25
  insight: string
}

export function calcBenchmarks(
  job: CategorizationJob,
  industry: ClientIndustry,
): BenchmarkResult[] {
  const benchmarks = BENCHMARKS[industry]
  if (!benchmarks) return []

  // Total revenue (credits)
  const totalRevenue = job.transactions
    .filter((t) => t.type === 'credit' && (t.status === 'approved' || t.status === 'edited'))
    .reduce((s, t) => s + t.amount, 0)

  if (totalRevenue === 0) return []   // can't compute ratios without revenue baseline

  const results: BenchmarkResult[] = []

  for (const [catKey, metric] of Object.entries(benchmarks.metrics)) {
    // Fuzzy category match — check if any transaction category contains this key
    const catTotal = job.transactions
      .filter((t) => {
        if (t.type !== 'debit') return false
        if (t.status === 'pending' || t.status === 'flagged') return false
        const cat = (t.final_category ?? t.suggested_category ?? '').toLowerCase()
        return cat.includes(catKey.toLowerCase()) || catKey.toLowerCase().includes(cat.split(' ')[0].toLowerCase())
      })
      .reduce((s, t) => s + t.amount, 0)

    if (catTotal === 0) continue   // skip categories with no data

    const clientPct = Math.round((catTotal / totalRevenue) * 100)
    const delta     = clientPct - metric.median

    let position: BenchmarkResult['position']
    let insight: string
    if (clientPct > metric.p75) {
      position = 'high'
      insight  = metric.insight.above
    } else if (clientPct < metric.p25) {
      position = 'excellent'
      insight  = metric.insight.below
    } else {
      position = 'normal'
      insight  = `${metric.label} is in the normal range for ${industry} businesses.`
    }

    results.push({
      category: catKey,
      label:    metric.label,
      clientPct,
      p25:      metric.p25,
      median:   metric.median,
      p75:      metric.p75,
      delta,
      position,
      insight,
    })
  }

  // Sort: high (needs attention) first, then by abs delta
  return results.sort((a, b) => {
    const order = { high: 0, normal: 1, excellent: 2 }
    if (order[a.position] !== order[b.position]) return order[a.position] - order[b.position]
    return Math.abs(b.delta) - Math.abs(a.delta)
  })
}
