import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface TaxOpportunityResponse {
  id: string
  title: string
  description: string
  estimatedSavings: number
  confidence: 'high' | 'medium' | 'low'
  actionRequired: string
  lawReference: string
  affectedLines: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { returnId, lineItems } = body as {
      returnId: string
      lineItems: object[]
    }

    if (!returnId || !lineItems) {
      return NextResponse.json(
        { error: 'returnId and lineItems are required' },
        { status: 400 }
      )
    }

    const prompt = `You are a tax optimization specialist. Review these tax return line items and identify ALL available tax-saving opportunities.

Line items:
${JSON.stringify(lineItems, null, 2)}

For each opportunity found, provide:
- id: unique string identifier
- title: short name (e.g. "Section 179 Election")
- description: 2-3 sentences explaining the opportunity and the numbers
- estimatedSavings: dollar amount of estimated tax savings (use 0 if can't quantify)
- confidence: "high" | "medium" | "low"
- actionRequired: specific steps the CPA must take
- lawReference: primary IRC section (e.g. "IRC §179")
- affectedLines: array of line IDs from the input this applies to

Focus on: Section 179, bonus depreciation, R&D credits, QBI optimization, retirement plan contributions, cost segregation, loss harvesting, accounting method changes, and entity structure optimization.

Return ONLY valid JSON with no markdown:
{
  "opportunities": [...]
}`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let parsed
    try {
      parsed = JSON.parse(content.text)
    } catch {
      const cleaned = content.text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      parsed = JSON.parse(cleaned)
    }

    return NextResponse.json({
      returnId,
      opportunities: (parsed.opportunities || []) as TaxOpportunityResponse[],
    })
  } catch (err) {
    console.error('Opportunities scan error:', err)
    return NextResponse.json(
      { error: 'Failed to scan for opportunities' },
      { status: 500 }
    )
  }
}
