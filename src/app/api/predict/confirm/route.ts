import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { predictionId, clientId, action, category } = await request.json()
  // action: 'confirm' | 'reject' | 'override'
  return NextResponse.json({
    success: true,
    predictionId,
    clientId,
    action,
    category: category ?? null,
    confirmedAt: new Date().toISOString(),
  })
}
