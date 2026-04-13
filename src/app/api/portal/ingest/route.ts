import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function slugToFirmName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function POST(req: Request) {
  const supabase = serviceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
  }

  let body: { firmSlug?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = body.firmSlug?.trim()
  if (!slug || !body.payload) {
    return NextResponse.json({ error: 'firmSlug and payload required' }, { status: 400 })
  }

  let firmId: string | null = null
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRe.test(slug)) {
    const { data } = await supabase.from('firms').select('id').eq('id', slug).maybeSingle()
    firmId = data?.id ?? null
  }
  if (!firmId) {
    const nameGuess = slugToFirmName(slug)
    const { data } = await supabase.from('firms').select('id').ilike('name', nameGuess).maybeSingle()
    firmId = data?.id ?? null
  }
  if (!firmId) {
    const { data } = await supabase.from('firms').select('id').ilike('name', `%${slug.replace(/-/g, ' ')}%`).limit(1).maybeSingle()
    firmId = data?.id ?? null
  }

  if (!firmId) {
    return NextResponse.json({ error: 'Firm not found' }, { status: 404 })
  }

  const { error } = await supabase.from('portal_inbound_uploads').insert({
    firm_id: firmId,
    payload: body.payload,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
