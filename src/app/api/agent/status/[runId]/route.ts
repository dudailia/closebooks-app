import { NextResponse } from 'next/server'

// Simulate realistic progress based on how much time has elapsed since the run started.
// The runId encodes a timestamp: `run-{clientId}-{timestamp}`.
function simulateProgress(runId: string): {
  status: 'running' | 'complete' | 'failed'
  progress: number
  steps: { step: string; label: string; status: 'pending' | 'running' | 'complete'; duration?: string }[]
  transactionsProcessed: number
  autoCategorized: number
  exceptions: number
  durationMs: number
} {
  const STEPS = [
    { step: 'fetch',      label: 'Fetch transactions',   thresholdMs:  5_000, durationLabel: '4s'  },
    { step: 'categorize', label: 'Categorize transactions', thresholdMs: 90_000, durationLabel: '84s' },
    { step: 'reconcile',  label: 'Bank reconciliation',  thresholdMs: 110_000, durationLabel: '16s' },
    { step: 'report',     label: 'Generate reports',     thresholdMs: 125_000, durationLabel: '11s' },
    { step: 'email',      label: 'Send client email',    thresholdMs: 130_000, durationLabel: '4s'  },
  ]

  const parts = runId.split('-')
  const ts = parseInt(parts[parts.length - 1], 10)
  const elapsed = isNaN(ts) ? 130_000 : Date.now() - ts

  const completedSteps = STEPS.filter((s) => elapsed >= s.thresholdMs)
  const currentStep = STEPS.find((s) => elapsed < s.thresholdMs)

  const isComplete = elapsed >= 130_000
  const progress = Math.min(100, Math.round((elapsed / 130_000) * 100))

  const steps = STEPS.map((s) => {
    const isDone = elapsed >= s.thresholdMs
    const isActive = s === currentStep
    return {
      step: s.step,
      label: s.label,
      status: isDone ? 'complete' as const : isActive ? 'running' as const : 'pending' as const,
      ...(isDone ? { duration: s.durationLabel } : {}),
    }
  })

  return {
    status: isComplete ? 'complete' : 'running',
    progress,
    steps,
    transactionsProcessed: isComplete ? 284 : Math.round((completedSteps.length / STEPS.length) * 284),
    autoCategorized: isComplete ? 281 : Math.round((completedSteps.length / STEPS.length) * 281),
    exceptions: isComplete ? 3 : 0,
    durationMs: Math.min(elapsed, 245_000),
  }
}

export async function GET(request: Request, { params }: { params: { runId: string } }) {
  const { runId } = params

  if (!runId) {
    return NextResponse.json({ error: 'runId is required.' }, { status: 400 })
  }

  const result = simulateProgress(runId)

  return NextResponse.json({ runId, ...result })
}
