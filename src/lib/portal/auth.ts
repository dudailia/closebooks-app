import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { PortalSession } from './types'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export const validateToken = cache(async (
  token: string,
  ip?: string,
  userAgent?: string,
): Promise<PortalSession | null> => {
  const sb = getServiceClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('portal_tokens')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null

  // Log access + update last_accessed_at (fire-and-forget)
  void Promise.all([
    sb.from('portal_tokens')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', data.id),
    ip
      ? sb.from('portal_access_log').insert({
          token_id: data.id,
          ip_address: ip,
          user_agent: userAgent ?? null,
        })
      : Promise.resolve(),
  ])

  // Load firm settings for branding
  const { data: firmData } = await sb
    .from('firm_settings')
    .select('payload')
    .eq('firm_id', data.firm_id)
    .maybeSingle()

  const fs = (firmData?.payload as Record<string, unknown>) ?? {}

  return {
    tokenId: data.id,
    token,
    firmId: data.firm_id,
    clientId: data.client_id,
    clientName: data.client_name || data.client_id,
    clientEmail: data.client_email ?? undefined,
    permissions: data.permissions ?? [],
    firmName: String(fs.firmName || data.firm_id),
    accentColor: String(fs.accentColor || '#b8734a'),
    expiresAt: data.expires_at,
  }
})

export function hasPermission(session: PortalSession, permission: string): boolean {
  return session.permissions.includes(permission)
}
