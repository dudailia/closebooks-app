import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages'
import { getUserFromRequest, createRouteHandlerClient } from '@/lib/supabase/routeAuth'
import { rateLimit } from '@/lib/rateLimit'
import { buildSystemPrompt } from '@/lib/copilot/context'
import { TOOL_DEFS, TOOL_LABELS, WRITE_TOOLS, executeTool, buildActionCard } from '@/lib/copilot/tools'
import type { SSEEvent } from '@/lib/copilot/types'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()
const MAX_ROUNDS = 5
const ENCODER = new TextEncoder()

function sse(event: SSEEvent): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify(event)}\n\n`)
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const rl = rateLimit(`copilot-chat:${user.id}`, 20, 60_000)
  if (!rl.ok) return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })

  let body: { messages: { role: string; content: string }[]; clientId: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { messages: rawMessages, clientId } = body
  if (!clientId) return new Response(JSON.stringify({ error: 'clientId required' }), { status: 400 })

  const supabase = createRouteHandlerClient(request)
  if (!supabase) return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 503 })

  const systemPrompt = await buildSystemPrompt(clientId, supabase)

  const messages: MessageParam[] = rawMessages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(sse(event))

      try {
        let rounds = 0
        const currentMessages = [...messages]

        while (rounds < MAX_ROUNDS) {
          rounds++

          const response = await anthropic.messages.create({
            model:      'claude-sonnet-4-6',
            max_tokens: 4096,
            system:     systemPrompt,
            tools:      TOOL_DEFS,
            messages:   currentMessages,
          })

          for (const block of response.content) {
            if (block.type === 'text' && block.text) {
              const chunks = block.text.match(/.{1,20}/gs) ?? []
              for (const chunk of chunks) send({ type: 'text', delta: chunk })
            }
          }

          if (response.stop_reason === 'end_turn') break

          if (response.stop_reason === 'tool_use') {
            const toolBlocks = response.content.filter(b => b.type === 'tool_use')
            const toolResults: ToolResultBlockParam[] = []

            currentMessages.push({ role: 'assistant', content: response.content })

            for (const block of toolBlocks) {
              if (block.type !== 'tool_use') continue

              send({ type: 'tool_start', name: block.name, label: TOOL_LABELS[block.name] ?? `Running ${block.name}…` })

              const input = block.input as Record<string, unknown>

              if (WRITE_TOOLS.has(block.name)) {
                const card = buildActionCard(block.name, input)
                send({ type: 'action_card', card })
                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'Action card presented to user for approval.' })
              } else {
                try {
                  const result = await executeTool(block.name, input, clientId, supabase)
                  const rowCount = Array.isArray(result)
                    ? result.length
                    : result && typeof result === 'object' && 'groups' in result
                      ? (result as { groups: unknown[] }).groups.length
                      : result && typeof result === 'object' && 'anomalies' in result
                        ? (result as { anomalies: unknown[] }).anomalies.length
                        : undefined
                  send({ type: 'tool_done', name: block.name, rowCount })
                  toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result).slice(0, 50_000) })
                } catch (err) {
                  toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error: ${err instanceof Error ? err.message : String(err)}`, is_error: true })
                }
              }
            }

            currentMessages.push({ role: 'user', content: toolResults })
          } else {
            break
          }
        }

        send({ type: 'done' })
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
