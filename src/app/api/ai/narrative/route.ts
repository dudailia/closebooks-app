import { NextRequest } from 'next/server'
import { getAnthropic, AI_MODELS } from '@/lib/ai/anthropic'
import { narrativeSystemPrompt, type NarrativePromptContext } from '@/lib/ai/systemPrompts'
import { sseResponse } from '@/lib/ai/sse'

export const dynamic = 'force-dynamic'

interface Body {
  context: NarrativePromptContext
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const system = narrativeSystemPrompt(body.context)
  const anthropic = getAnthropic()

  return sseResponse(async (send) => {
    let acc = ''
    const stream = anthropic.messages.stream({
      model: AI_MODELS.sonnet,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: 'Generate the JSON narrative now.' }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        acc += event.delta.text
        send({ type: 'delta', text: event.delta.text })
      }
    }
    const final = await stream.finalMessage()

    const cleaned = acc.replace(/```json\s*|\s*```/g, '').trim()
    try {
      const parsed = JSON.parse(cleaned)
      send({
        type: 'complete',
        result: parsed,
        tokens: { input: final.usage.input_tokens, output: final.usage.output_tokens },
      })
    } catch (err) {
      send({
        type: 'error',
        message: 'Narrative JSON parse failed: ' + (err instanceof Error ? err.message : 'unknown'),
      })
    }
  })
}
