export type SseEvent = Record<string, unknown> & { type: string }

const ENCODER = new TextEncoder()

export function encodeSse(event: SseEvent): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify(event)}\n\n`)
}

export function sseHeaders(): HeadersInit {
  return {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no',
  }
}

export function sseResponse(run: (send: (e: SseEvent) => void) => Promise<void>): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: SseEvent) => controller.enqueue(encodeSse(e))
      try {
        await run(send)
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: sseHeaders() })
}
