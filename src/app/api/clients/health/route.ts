import { NextRequest, NextResponse } from 'next/server'
import { scoreClient, type HealthBreakdown, type HealthInputs } from '@/lib/health/scoreClient'
import type { CategorizationJob } from '@/types'
import { detectAnomalies } from '@/lib/anomalyDetection'

export const dynamic = 'force-dynamic'

interface ClientInput {
  clientName: string
  jobs: CategorizationJob[]
  documents?: { requested: number; uploaded: number; reviewed: number }
  reconciliation?: { matched: number; unmatched: number } | null
}

interface Body {
  clients: ClientInput[]
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const out: Record<string, HealthBreakdown> = {}
  for (const c of body.clients) {
    const sorted = [...c.jobs].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const latest = sorted[0] ?? null
    const prior = sorted.find((j) => j.id !== latest?.id) ?? null
    const anomalies = latest ? detectAnomalies(latest.transactions, prior?.transactions ?? null) : []

    const inputs: HealthInputs = {
      jobs: c.jobs,
      anomalies,
      documents: c.documents ?? { requested: 0, uploaded: 0, reviewed: 0 },
      reconciliation: c.reconciliation ?? null,
    }
    out[c.clientName] = scoreClient(inputs)
  }

  return NextResponse.json({ scores: out })
}
