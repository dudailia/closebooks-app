import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, getUserFromRequest } from '@/lib/supabase/routeAuth'
import { getFirmIdForUser } from '@/lib/supabase/firmScope'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = await getFirmIdForUser()
  if (!firmId) return NextResponse.json({ error: 'No firm' }, { status: 400 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })
  if (file.size > 512 * 1024) {
    return NextResponse.json({ error: 'File too large (512 KB max)' }, { status: 413 })
  }

  const ext = (file.name.match(/\.(\w+)$/)?.[1] ?? 'png').toLowerCase()
  const supabase = createRouteHandlerClient(req)
  if (!supabase) return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })

  const path = `${firmId}/logo-${Date.now()}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabase.storage
    .from('brand-assets')
    .upload(path, buf, { contentType: file.type, upsert: false })
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: pub } = supabase.storage.from('brand-assets').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl, path })
}
