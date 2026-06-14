import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, isSupabaseEnvConfigured } from '@/lib/supabase/routeAuth'

// ---------------------------------------------------------------------------
// In-memory store (demo — replace with Supabase in production)
// ---------------------------------------------------------------------------

interface ApiKey {
  id: string
  name: string
  prefix: string
  maskedKey: string
  fullKey?: string
  scopes: string[]
  createdAt: string
  lastUsed: string | null
  status: 'live' | 'test'
}

const DEMO_KEYS: ApiKey[] = [
  {
    id: 'key_01',
    name: 'Production',
    prefix: 'sk_live',
    maskedKey: 'sk_live_4xT9...mK2p',
    scopes: ['read:transactions', 'read:financials', 'read:clients'],
    createdAt: '2025-11-14T10:22:00Z',
    lastUsed: '2026-04-04T18:45:00Z',
    status: 'live',
  },
  {
    id: 'key_02',
    name: 'Test Environment',
    prefix: 'sk_test',
    maskedKey: 'sk_test_7rQ1...nW8v',
    scopes: ['read:transactions', 'write:transactions', 'read:financials'],
    createdAt: '2025-12-03T14:05:00Z',
    lastUsed: '2026-04-03T09:12:00Z',
    status: 'test',
  },
]

// Runtime store (starts with demo keys, persists for lifetime of server process)
const keyStore: ApiKey[] = [...DEMO_KEYS]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireUser(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (isSupabaseEnvConfigured() && !user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { user, response: null }
}

function generateSecureKey(type: 'live' | 'test'): { full: string; masked: string; prefix: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const rand = (len: number) => {
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => chars[b % chars.length]).join('')
  }

  const prefix = type === 'live' ? 'sk_live' : 'sk_test'
  const body = rand(32)
  const full = `${prefix}_${body}`
  const masked = `${prefix}_${body.slice(0, 4)}...${body.slice(-4)}`
  return { full, masked, prefix }
}

function generateId(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return `key_${Date.now().toString(36)}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

// ---------------------------------------------------------------------------
// GET /api/connect/keys — list masked keys
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response

  const masked = keyStore.map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    maskedKey: key.maskedKey,
    scopes: key.scopes,
    createdAt: key.createdAt,
    lastUsed: key.lastUsed,
    status: key.status,
  }))
  return NextResponse.json({ keys: masked })
}

// ---------------------------------------------------------------------------
// POST /api/connect/keys — create new key (returns full key ONCE)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response

  let body: { name?: string; scopes?: string[]; type?: 'live' | 'test' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Key name is required.' }, { status: 400 })

  const scopes = Array.isArray(body.scopes) && body.scopes.length > 0
    ? body.scopes
    : ['read:transactions']

  const type = body.type === 'test' ? 'test' : 'live'
  const { full, masked, prefix } = generateSecureKey(type)

  const newKey: ApiKey = {
    id: generateId(),
    name,
    prefix,
    maskedKey: masked,
    fullKey: full,
    scopes,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    status: type,
  }

  keyStore.push(newKey)

  // Return full key only on creation
  return NextResponse.json({
    key: {
      id: newKey.id,
      name: newKey.name,
      fullKey: full,
      maskedKey: masked,
      prefix,
      scopes,
      createdAt: newKey.createdAt,
      lastUsed: null,
      status: type,
    },
    warning: "Store this key securely — we won't show it again.",
  }, { status: 201 })
}

// ---------------------------------------------------------------------------
// DELETE /api/connect/keys — revoke a key
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if (auth.response) return auth.response

  let body: { id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const idx = keyStore.findIndex((k) => k.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Key not found.' }, { status: 404 })

  keyStore.splice(idx, 1)
  return NextResponse.json({ success: true, message: 'API key revoked.' })
}
