/**
 * QuickBooks Online (Intuit) OAuth — env detection only.
 * Real OAuth requires INTUIT_CLIENT_ID, INTUIT_CLIENT_SECRET, and redirect URL in Intuit Developer portal.
 */

export function isQBOOAuthConfigured(): boolean {
  const id = process.env.INTUIT_CLIENT_ID
  const secret = process.env.INTUIT_CLIENT_SECRET
  return !!id && id.length > 5 && !!secret && secret.length > 5
}

/** Intuit OAuth base (production). Use sandbox URL for sandbox companies if needed. */
export function getIntuitAuthBase(): string {
  return (
    process.env.INTUIT_OAUTH_BASE?.replace(/\/$/, '') ??
    'https://appcenter.intuit.com/connect/oauth2'
  )
}

export function getIntuitTokenUrl(): string {
  return (
    process.env.INTUIT_TOKEN_URL?.replace(/\/$/, '') ??
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
  )
}

export function getQboRedirectUri(requestOrigin: string): string {
  const explicit = process.env.INTUIT_REDIRECT_URI?.trim()
  if (explicit) return explicit
  return `${requestOrigin.replace(/\/$/, '')}/api/integrations/quickbooks/callback`
}
