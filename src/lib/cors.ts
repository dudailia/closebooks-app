import type { NextRequest } from 'next/server'

function allowedOrigin(): string | null {
  const o = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
  if (!o) return null
  if (o.startsWith('http')) return o.replace(/\/$/, '')
  return `https://${o.replace(/\/$/, '')}`
}

/** If request Origin matches allowlist, return it; else null (same-origin only). */
export function corsAllowOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return allowedOrigin()
  const allow = allowedOrigin()
  if (allow && origin === allow) return origin
  if (process.env.NODE_ENV !== 'production') return origin
  return null
}

export function corsHeaders(request: NextRequest, allowMethods = 'GET, POST, OPTIONS'): Record<string, string> {
  const acao = corsAllowOrigin(request)
  if (!acao) return {}
  return {
    'Access-Control-Allow-Origin': acao,
    'Access-Control-Allow-Methods': allowMethods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}
