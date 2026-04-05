import { NextRequest, NextResponse } from 'next/server'
import { INDUSTRY_BENCHMARKS, METRIC_LABELS } from '@/lib/network/benchmarkData'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const industry = searchParams.get('industry') ?? ''
  const metric = searchParams.get('metric') ?? ''

  if (!industry || !metric) {
    return NextResponse.json(
      { error: 'industry and metric query params are required' },
      { status: 400 },
    )
  }

  const industryData = INDUSTRY_BENCHMARKS[industry]
  if (!industryData) {
    return NextResponse.json(
      { error: `Unknown industry: ${industry}. Available: ${Object.keys(INDUSTRY_BENCHMARKS).join(', ')}` },
      { status: 404 },
    )
  }

  const metricData = industryData[metric as keyof typeof industryData]
  if (!metricData) {
    return NextResponse.json(
      { error: `Unknown metric: ${metric}. Available: ${Object.keys(METRIC_LABELS).join(', ')}` },
      { status: 404 },
    )
  }

  const meta = METRIC_LABELS[metric]

  return NextResponse.json({
    industryName: industry,
    metric,
    label: meta?.label ?? metric,
    unit: meta?.unit ?? '',
    higherIsBetter: meta?.higherIsBetter ?? true,
    ...metricData,
  })
}
