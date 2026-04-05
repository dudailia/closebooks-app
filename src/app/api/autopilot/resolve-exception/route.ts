import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      exceptionId: string
      resolution: string
      category?: string
    }

    const { exceptionId, resolution, category } = body

    if (!exceptionId || !resolution) {
      return NextResponse.json({ error: 'Missing exceptionId or resolution' }, { status: 400 })
    }

    const updatedException = {
      id: exceptionId,
      status: 'resolved' as const,
      resolution,
      resolvedAt: new Date().toISOString(),
      ...(category ? { category } : {}),
    }

    return NextResponse.json({ success: true, updatedException })
  } catch (err) {
    console.error('[resolve-exception] error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
