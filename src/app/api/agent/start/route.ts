import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { clientId } = await request.json()
  const runId = `run-${clientId}-${Date.now()}`
  return NextResponse.json({
    runId,
    clientId,
    status: 'started',
    startedAt: new Date().toISOString(),
    estimatedDuration: '4 minutes',
  })
}
