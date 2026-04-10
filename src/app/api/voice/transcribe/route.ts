import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

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
  let command: string
  try {
    const body = await request.json()
    command = body?.command
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!command?.trim()) {
    return NextResponse.json({ error: 'command is required.' }, { status: 400 })
  }

  const defaults = {
    intent: 'unknown',
    clientName: null,
    metric: null,
    period: null,
    voiceResponse: "I'm not sure what you'd like me to do. Try saying 'close the books for [client name]' or 'what is [client]'s cash position?'",
    actionDescription: 'No action taken',
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ command, ...defaults, processedAt: new Date().toISOString() })
  }

  try {
    const intentMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Parse this voice command from a CPA into a structured intent.
Command: "${command}"

Return JSON only — no markdown, no explanation:
{
  "intent": "close_books" | "get_metric" | "list_exceptions" | "schedule" | "get_status" | "unknown",
  "clientName": string | null,
  "metric": "cash" | "revenue" | "burn_rate" | "net_income" | "exceptions" | null,
  "period": "this_month" | "last_month" | "ytd" | null,
  "voiceResponse": string,
  "actionDescription": string
}

The voiceResponse should be 1-2 sentences, conversational, under 30 words.
The actionDescription is what CloseBooks would actually do.`,
      }],
    })

    const content = intentMessage.content[0]
    let parsed = { ...defaults }

    if (content.type === 'text') {
      const obj = extractJsonObject(content.text)
      if (obj) parsed = { ...parsed, ...obj } as typeof defaults
    }

    return NextResponse.json({ command, ...parsed, processedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[voice/transcribe] error:', err)
    return NextResponse.json({ command, ...defaults, processedAt: new Date().toISOString() })
  }
}
