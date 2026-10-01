import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, getUserFromRequest } from '@/lib/supabase/routeAuth'

export const dynamic = 'force-dynamic'

// Must match the brand-assets bucket's allowed types
// (supabase/migrations/20261001300000_brand_assets_firm_folder.sql). No SVG:
// the bucket is public and an SVG can carry script.
const ALLOWED_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createRouteHandlerClient(req)
  if (!supabase) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })

  // The firm where this user is owner or admin (the roles that edit branding),
  // looked up with the request's session. getFirmIdForUser() uses the browser
  // client and returns null on the server (docs/engine/rls-audit.md, F9).
  const { data: membership } = await supabase
    .from('firm_members')
    .select('firm_id, role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const firmId = membership?.firm_id as string | undefined
  if (!firmId) return NextResponse.json({ error: 'No firm where you can edit branding' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })
  if (file.size > 512 * 1024) {
    return NextResponse.json({ error: 'File too large (512 KB max)' }, { status: 413 })
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) return NextResponse.json({ error: 'Logo must be PNG, JPEG or WebP' }, { status: 415 })

  const path = `${firmId}/logo-${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabase.storage
    .from('brand-assets')
    .upload(path, buf, { contentType: file.type, upsert: false })
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: pub } = supabase.storage.from('brand-assets').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl, path })
}
