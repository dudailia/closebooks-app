import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let clientId: string
  try {
    const body = await request.json()
    clientId = body?.clientId
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required.' }, { status: 400 })
  }

  const runId = `run-${clientId}-${Date.now()}`
  return NextResponse.json({
    runId,
    clientId,
    status: 'started',
    startedAt: new Date().toISOString(),
    estimatedDuration: '4 minutes',
  })
}
