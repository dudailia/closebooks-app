import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface PulseResponse {
  answer: string
  sampleCount: number
  chartData: Array<{ label: string; value: number }>
  chartType: 'bar' | 'gauge' | 'number'
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const brace = text.match(/\{[\s\S]*\}/)
  if (brace) return brace[0]
  return text
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { query, firmIndustry } = await req.json() as { query: string; firmIndustry?: string }

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const systemPrompt = `You are an industry analyst for CloseBooks, an accounting platform with 12,847 small and medium business clients across 47 industries. You have access to anonymized, aggregated financial data from all firms on the network.

When answering questions, be specific and data-driven. Include:
- Percentages and dollar amounts
- Industry breakdowns where relevant
- Comparisons between firm sizes or sub-industries
- Practical implications for accountants

Always respond with valid JSON in this exact format:
{
  "answer": "Your detailed 2-3 paragraph answer with specific data points",
  "sampleCount": <number of relevant firms in dataset, between 200-2000>,
  "chartData": [
    {"label": "Category 1", "value": <number>},
    {"label": "Category 2", "value": <number>}
  ],
  "chartType": "bar"
}

chartData should have 3-7 entries showing distribution or breakdown. Values should be percentages (0-100) or meaningful numbers. chartType is almost always "bar".`

    const userMsg = firmIndustry
      ? `Industry context: ${firmIndustry}\n\nQuestion: ${query}`
      : query

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    })

    const rawText = msg.content.find((b) => b.type === 'text')?.text ?? ''
    const jsonStr = extractJson(rawText)
    const parsed = JSON.parse(jsonStr) as PulseResponse

    return NextResponse.json({
      answer: parsed.answer ?? '',
      sampleCount: parsed.sampleCount ?? 500,
      chartData: Array.isArray(parsed.chartData) ? parsed.chartData : [],
      chartType: (parsed.chartType as 'bar' | 'gauge' | 'number') ?? 'bar',
    })
  } catch (err) {
    console.error('[network/pulse] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    )
  }
}
