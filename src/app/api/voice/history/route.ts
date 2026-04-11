import { NextRequest, NextResponse } from 'next/server'

// ─── In-process voice history store ──────────────────────────────────────────
// Populated when POST /api/voice/transcribe is called with a command.
// In production this would be a Supabase table per user.

interface VoiceCall {
  id: string
  timestamp: string
  command: string
  intent: string
  response: string
  status: 'complete' | 'answered' | 'failed'
  durationSeconds: number
}

const historyStore: VoiceCall[] = []

export function addToHistory(call: Omit<VoiceCall, 'id'>) {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = 'c' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  historyStore.unshift({ id, ...call })
  // Keep last 50 entries
  if (historyStore.length > 50) historyStore.pop()
}

export async function GET(req: NextRequest) {
  // Optionally filter by userId in future
  return NextResponse.json({ calls: historyStore })
}

// POST lets the voice UI push completed commands into history
export async function POST(req: NextRequest) {
  let body: Omit<VoiceCall, 'id'>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  addToHistory(body)
  return NextResponse.json({ ok: true })
}
