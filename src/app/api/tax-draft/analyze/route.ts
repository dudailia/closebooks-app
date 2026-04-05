import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { returnId, formType, taxYear, clientData } = body as {
      returnId: string
      formType: string
      taxYear: number
      clientData: object
    }

    if (!returnId || !formType || !taxYear || !clientData) {
      return NextResponse.json(
        { error: 'returnId, formType, taxYear, and clientData are required' },
        { status: 400 }
      )
    }

    const TAXDRAFT_PROMPT = `You are a CPA with 30 years of experience preparing ${formType} returns for tax year ${taxYear}.

Client financial summary:
${JSON.stringify(clientData, null, 2)}

Generate a complete ${formType} draft return with annotations.
For each significant line item provide:
1. value: the calculated amount
2. reasoning: 2-3 sentence plain English explanation
3. law_reference: IRC section (e.g. "IRC §199A")
4. confidence: "high" | "medium" | "low"
5. opportunity: if there's a tax saving on this line (optional)

Return ONLY valid JSON with no markdown. Format:
{
  "lineItems": [
    {
      "id": "L1a",
      "lineNumber": "1a",
      "description": "Gross receipts or sales",
      "value": 0,
      "reasoning": "...",
      "lawReference": "IRC §61",
      "confidence": "high",
      "opportunity": null
    }
  ],
  "opportunities": [
    {
      "id": "opp1",
      "title": "...",
      "description": "...",
      "estimatedSavings": 0,
      "confidence": "high",
      "actionRequired": "...",
      "lawReference": "IRC §..."
    }
  ]
}

Opportunities format: { title, description, estimatedSavings, confidence, actionRequired, lawReference }`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: TAXDRAFT_PROMPT,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let parsed
    try {
      parsed = JSON.parse(content.text)
    } catch {
      // If Claude wrapped it in markdown code blocks, strip them
      const cleaned = content.text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
      parsed = JSON.parse(cleaned)
    }

    return NextResponse.json({
      returnId,
      formType,
      taxYear,
      ...parsed,
    })
  } catch (err) {
    console.error('Tax draft analyze error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze return. Check API key and client data.' },
      { status: 500 }
    )
  }
}
