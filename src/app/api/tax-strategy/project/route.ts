import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STRATEGY_PROMPT = (
  clientName: string,
  entityType: string,
  revenue: number,
  currentTax: number,
  industry: string,
) => `You are a tax strategist creating a 5-year tax plan for a business client.

Client: ${clientName}
Entity type: ${entityType}
Annual revenue: $${revenue.toLocaleString()}
Current tax liability: $${currentTax.toLocaleString()}
Industry: ${industry}

Generate:
1. Current path projection (years 1-5, no changes) — cumulative tax paid each year
2. Basic strategies path (standard deductions, QBI) — cumulative with moderate optimization
3. Optimized path (all available strategies) — cumulative with full optimization

For each strategy provide detailed implementation guidance.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "scenarios": {
    "current": [
      { "year": 2024, "cumulativeTax": 0 },
      { "year": 2025, "cumulativeTax": 0 },
      { "year": 2026, "cumulativeTax": 0 },
      { "year": 2027, "cumulativeTax": 0 },
      { "year": 2028, "cumulativeTax": 0 }
    ],
    "basic": [
      { "year": 2024, "cumulativeTax": 0 },
      { "year": 2025, "cumulativeTax": 0 },
      { "year": 2026, "cumulativeTax": 0 },
      { "year": 2027, "cumulativeTax": 0 },
      { "year": 2028, "cumulativeTax": 0 }
    ],
    "optimized": [
      { "year": 2024, "cumulativeTax": 0 },
      { "year": 2025, "cumulativeTax": 0 },
      { "year": 2026, "cumulativeTax": 0 },
      { "year": 2027, "cumulativeTax": 0 },
      { "year": 2028, "cumulativeTax": 0 }
    ]
  },
  "strategies": [
    {
      "name": "string",
      "type": "Entity | Retirement | Depreciation | Credits | Timing",
      "year1Impact": -0,
      "fiveYearImpact": -0,
      "implementationSteps": ["step 1", "step 2", "step 3"],
      "confidence": "High | Medium | Low",
      "ircSection": "IRC §XXX",
      "implementationTimeline": "string"
    }
  ],
  "totalSavings": 0
}`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientName, entityType, revenue, currentTax, industry } = body as {
      clientName: string
      entityType: string
      revenue: number
      currentTax: number
      industry: string
    }

    if (!clientName || !entityType || !revenue || !currentTax || !industry) {
      return NextResponse.json(
        { error: 'clientName, entityType, revenue, currentTax, and industry are required' },
        { status: 400 }
      )
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: STRATEGY_PROMPT(clientName, entityType, revenue, currentTax, industry),
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip any accidental markdown
    const cleaned = rawText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Claude returned invalid JSON', raw: rawText },
        { status: 502 }
      )
    }

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
