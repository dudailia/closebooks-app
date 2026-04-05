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

export async function POST(request: Request) {
  const { clientId, targetMonth } = await request.json()

  const history = DEMO_HISTORY[clientId as keyof typeof DEMO_HISTORY]
  if (!history) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const anthropic = new Anthropic()

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are an expert accountant analyzing transaction patterns for ${history.clientName}.

Based on ${history.monthsOfHistory} months of history, generate prediction metadata for ${targetMonth}.
Top recurring vendors: ${JSON.stringify(history.topVendors)}

Return JSON:
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
  let analysis = {
    totalPredicted: 284,
    highConfidence: 268,
    needsReview: 16,
    uncertainties: ['1 large unusual payment', '2 new vendors'],
    seasonalNote: 'December typically 15% higher for construction',
  }

  if (content.type === 'text') {
    try {
      const json = content.text.match(/\{[\s\S]*\}/)?.[0]
      if (json) analysis = JSON.parse(json)
    } catch { /* use defaults */ }
  }

  return NextResponse.json({
    clientId,
    targetMonth,
    ...analysis,
    generatedAt: new Date().toISOString(),
  })
}
