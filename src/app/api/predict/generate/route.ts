import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const DEMO_HISTORY = {
  'smith-2024': {
    clientName: 'Smith Construction LLC',
    entityType: '1120S',
    industry: 'Construction',
    monthsOfHistory: 18,
    topVendors: [
      { name: 'ADP Payroll', avgAmount: 12400, frequency: 'biweekly', confidence: 0.992 },
      { name: 'Wells Fargo Rent', avgAmount: 4200, frequency: 'monthly_1st', confidence: 1.0 },
      { name: 'Mesa Supplies', avgAmount: 3400, frequency: 'monthly_net30', confidence: 0.941 },
    ],
  },
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  let clientId: string
  let targetMonth: string

  try {
    const body = await request.json()
    clientId = body?.clientId
    targetMonth = body?.targetMonth
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required.' }, { status: 400 })
  }

  const history = DEMO_HISTORY[clientId as keyof typeof DEMO_HISTORY]
  if (!history) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const defaults = {
    totalPredicted: 284,
    highConfidence: 268,
    needsReview: 16,
    uncertainties: ['1 large unusual payment', '2 new vendors'],
    seasonalNote: 'December typically 15% higher for construction',
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ clientId, targetMonth, ...defaults, generatedAt: new Date().toISOString() })
  }

  try {
    const anthropic = new Anthropic()
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert accountant analyzing transaction patterns for ${history.clientName}.

Based on ${history.monthsOfHistory} months of history, generate prediction metadata for ${targetMonth}.
Top recurring vendors: ${JSON.stringify(history.topVendors)}

Return JSON only — no markdown, no explanation:
{
  "totalPredicted": number,
  "highConfidence": number,
  "needsReview": number,
  "uncertainties": string[],
  "seasonalNote": string
}`,
      }],
    })

    const content = message.content[0]
    let analysis = { ...defaults }

    if (content.type === 'text') {
      const obj = extractJsonObject(content.text)
      if (obj) analysis = { ...analysis, ...obj } as typeof defaults
    }

    return NextResponse.json({ clientId, targetMonth, ...analysis, generatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[predict/generate] error:', err)
    return NextResponse.json({ clientId, targetMonth, ...defaults, generatedAt: new Date().toISOString() })
  }
}
