import { NextRequest, NextResponse } from 'next/server'
import { NETWORK_BENCHMARKS } from '@/lib/benchmarkNetworkData'
import type { SpendRatio } from '@/lib/benchmarkNetworkData'
import type { ClientIndustry } from '@/types'

// ─── GET /api/benchmark-sync ─────────────────────────────────────────────────
// Returns the full seed benchmark dataset.

export async function GET() {
  return NextResponse.json(
    { success: true, data: NETWORK_BENCHMARKS },
    { status: 200 },
  )
}

// ─── POST /api/benchmark-sync ────────────────────────────────────────────────
// Accepts a contribution payload and returns enriched network stats.
// For demo purposes this does not write to a database.

interface ContributionBody {
  industry: ClientIndustry
  ratios: { category: string; pct: number }[]
  firmId: string
}

export async function POST(req: NextRequest) {
  let body: ContributionBody
  try {
    body = (await req.json()) as ContributionBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.industry || !Array.isArray(body.ratios)) {
    return NextResponse.json(
      { error: 'Missing required fields: industry, ratios' },
      { status: 400 },
    )
  }

  // Filter to the relevant industry benchmarks
  const industryBenchmarks: SpendRatio[] = NETWORK_BENCHMARKS.filter(
    (r) => r.industry === body.industry,
  )

  // Simulate a small adjustment: nudge medians slightly toward contributed values
  // (purely for demo realism — no real persistence).
  const avgByCategory: SpendRatio[] = industryBenchmarks.map((benchmark) => {
    const match = body.ratios.find((r) => r.category === benchmark.category)
    if (!match) return benchmark
    // Blend 95% network, 5% contributed value
    const blendedMedian = Math.round((benchmark.median * 0.95 + match.pct * 0.05) * 10) / 10
    return { ...benchmark, median: blendedMedian, sampleSize: benchmark.sampleSize + 1 }
  })

  // Simulated network stats
  const networkStats = {
    firmCount: 1247 + 1, // one more firm contributed
    avgByCategory,
  }

  return NextResponse.json(
    { success: true, networkStats },
    { status: 200 },
  )
}
