import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEMO_HIDE, isApiRouteVisible, PORTAL_ENABLED, VISIBLE_API_ROUTES } from '@/lib/features'

const API_DIR = join(__dirname, '../../app/api')

/** Every API route on disk, as its URL pattern (e.g. /api/portal/data/[clientToken]). */
function apiRoutes(dir = API_DIR): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return apiRoutes(full)
    return name === 'route.ts' ? [`/api/${relative(API_DIR, dir)}`] : []
  })
}

describe('API allowlist (demo build)', () => {
  it('is on, and the portal is off', () => {
    expect(DEMO_HIDE).toBe(true)
    expect(PORTAL_ENABLED).toBe(false)
  })

  it('every allowlisted route exists', () => {
    const routes = apiRoutes()
    for (const r of VISIBLE_API_ROUTES) expect(routes).toContain(r)
  })

  it('serves exactly the core routes and blocks every other route on disk', () => {
    const routes = apiRoutes()
    const allowed = routes.filter((r) => isApiRouteVisible(r)).sort()
    expect(allowed).toEqual([...VISIBLE_API_ROUTES].sort())
    expect(routes.length - allowed.length).toBeGreaterThan(80)
  })

  it('blocks the routes named in the RLS audit', () => {
    for (const p of ['/api/portal/ingest', '/api/portal/tokens', '/api/portal/documents', '/api/inbox/webhook',
      '/api/integrations/plaid/webhooks', '/api/integrations/quickbooks/push', '/api/firm/logo', '/api/clients/health']) {
      expect(isApiRouteVisible(p)).toBe(false)
    }
  })

  it('matches exactly: no prefix or trailing-segment tricks', () => {
    expect(isApiRouteVisible('/api/categorize')).toBe(true)
    expect(isApiRouteVisible('/api/categorize/')).toBe(true)
    expect(isApiRouteVisible('/api/categorize/extra')).toBe(false)
    expect(isApiRouteVisible('/api/categorizex')).toBe(false)
    expect(isApiRouteVisible('/api')).toBe(false)
    expect(isApiRouteVisible('/dashboard')).toBe(true)
  })
})
