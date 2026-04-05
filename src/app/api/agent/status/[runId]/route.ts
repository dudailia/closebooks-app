import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { runId: string } }) {
  const { runId } = params
  return NextResponse.json({
    runId,
    status: 'complete',
    progress: 100,
    steps: [
      { step: 'fetch', label: 'Fetch transactions', status: 'complete', duration: '4s' },
      { step: 'categorize', label: 'Categorize transactions', status: 'complete', duration: '84s' },
      { step: 'reconcile', label: 'Bank reconciliation', status: 'complete', duration: '16s' },
      { step: 'report', label: 'Generate reports', status: 'complete', duration: '11s' },
      { step: 'email', label: 'Send client email', status: 'complete', duration: '4s' },
    ],
    transactionsProcessed: 284,
    autoCategorizied: 281,
    exceptions: 3,
    durationMs: 245000,
  })
}
