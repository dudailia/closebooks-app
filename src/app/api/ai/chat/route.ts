import { NextRequest } from 'next/server'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { getAnthropic, AI_MODELS } from '@/lib/ai/anthropic'
import { AI_TOOLS } from '@/lib/ai/tools'
import { chatSystemPrompt, type ChatPromptContext } from '@/lib/ai/systemPrompts'
import { sseResponse } from '@/lib/ai/sse'

export const dynamic = 'force-dynamic'
const MAX_ROUNDS = 4

interface Body {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  context: ChatPromptContext
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { messages: raw, context } = body
  const system = chatSystemPrompt(context)
  const anthropic = getAnthropic()

  return sseResponse(async (send) => {
    const conv: MessageParam[] = raw
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    let rounds = 0
    while (rounds < MAX_ROUNDS) {
      rounds++
      const resp = await anthropic.messages.create({
        model: AI_MODELS.sonnet,
        max_tokens: 2048,
        system,
        tools: AI_TOOLS,
        messages: conv,
      })

      for (const block of resp.content) {
        if (block.type === 'text' && block.text) {
          const chunks = block.text.match(/.{1,30}/gs) ?? []
          for (const c of chunks) send({ type: 'text', delta: c })
        }
      }

      if (resp.stop_reason !== 'tool_use') {
        send({ type: 'usage', input: resp.usage.input_tokens, output: resp.usage.output_tokens })
        send({ type: 'done' })
        return
      }

      // Tool use — forward to client for local execution.
      const toolUses = resp.content.filter(
        (b): b is Extract<typeof resp.content[number], { type: 'tool_use' }> => b.type === 'tool_use'
      )

      conv.push({ role: 'assistant', content: resp.content })

      for (const tu of toolUses) {
        send({ type: 'tool_call', toolUseId: tu.id, name: tu.name, input: tu.input })
      }

      send({ type: 'needs_tool_results' })
      return
    }
    send({ type: 'done' })
  })
}
