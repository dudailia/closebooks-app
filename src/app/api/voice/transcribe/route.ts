import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  const { command } = await request.json()

  const intentMessage = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Parse this voice command from a CPA into a structured intent.
Command: "${command}"

Return JSON only:
{
  "intent": "close_books" | "get_metric" | "list_exceptions" | "schedule" | "get_status" | "unknown",
  "clientName": string | null,
  "metric": "cash" | "revenue" | "burn_rate" | "net_income" | "exceptions" | null,
  "period": "this_month" | "last_month" | "ytd" | null,
  "voiceResponse": string,
  "actionDescription": string
}

The voiceResponse should be 1-2 sentences, conversational, under 30 words.
The actionDescription is what CloseBooks would actually do.`
    }]
  })

  const content = intentMessage.content[0]
  let parsed = {
    intent: 'unknown',
    clientName: null,
    voiceResponse: "I'm not sure what you'd like me to do. Try saying 'close the books for [client name]' or 'what is [client]'s cash position?'",
    actionDescription: 'No action taken'
  }

  if (content.type === 'text') {
    try {
      const json = content.text.match(/\{[\s\S]*\}/)?.[0]
      if (json) parsed = { ...parsed, ...JSON.parse(json) }
    } catch { /* use defaults */ }
  }

  return NextResponse.json({
    command,
    ...parsed,
    processedAt: new Date().toISOString(),
  })
}
