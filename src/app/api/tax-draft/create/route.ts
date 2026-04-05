import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, taxYear, formType, priorYearData } = body as {
      clientId: string
      taxYear: number
      formType: string
      priorYearData?: object
    }

    if (!clientId || !taxYear || !formType) {
      return NextResponse.json(
        { error: 'clientId, taxYear, and formType are required' },
        { status: 400 }
      )
    }

    const returnId = randomUUID()

    // In a real implementation, this would persist the record to Supabase
    // For demo: return the generated ID
    return NextResponse.json({
      returnId,
      clientId,
      taxYear,
      formType,
      status: 'draft',
      createdAt: new Date().toISOString(),
      hasPriorYear: !!priorYearData,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create return' }, { status: 500 })
  }
}
