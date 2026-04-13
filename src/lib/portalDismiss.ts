/** Session dismiss state for portal tips (in-memory, not persisted). */

const dismissed = new Map<string, Set<string>>()

export function isPortalTipDismissed(clientToken: string, tipId: string): boolean {
  return dismissed.get(clientToken)?.has(tipId) ?? false
}

export function dismissPortalTip(clientToken: string, tipId: string): void {
  const set = dismissed.get(clientToken) ?? new Set()
  set.add(tipId)
  dismissed.set(clientToken, set)
}
