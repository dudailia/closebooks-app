import { describe, expect, it } from 'vitest'
import { SYSTEM_ACTOR, userActor } from '@/lib/auditActor'

describe('audit actor', () => {
  it('uses the signed-in email', () => {
    expect(userActor('jordan@example.com')).toBe('jordan@example.com')
    expect(userActor('  jordan@example.com ')).toBe('jordan@example.com')
  })

  it('never falls back to a role name', () => {
    expect(userActor(null)).toBe('unknown user (not signed in)')
    expect(userActor('')).toBe('unknown user (not signed in)')
    expect(userActor(undefined)).not.toBe('CPA')
  })

  it('automatic events are system', () => {
    expect(SYSTEM_ACTOR).toBe('system')
  })
})
