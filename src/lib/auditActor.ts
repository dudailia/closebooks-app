/** Actor for automatic events (upload, rules, job creation). */
export const SYSTEM_ACTOR = 'system'

/**
 * Actor for an event a person caused: the signed-in user's email. In demo mode
 * (no Supabase) or before the session loads there is no email, and the event
 * says so instead of naming a role.
 */
export function userActor(email: string | null | undefined): string {
  const e = email?.trim()
  return e ? e : 'unknown user (not signed in)'
}
