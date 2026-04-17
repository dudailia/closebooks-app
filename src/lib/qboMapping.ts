/**
 * Resolve CloseBooks chart account codes → QuickBooks account IDs using per-client mapping.
 */

import type { ChartOfAccounts } from '@/types'

export type AccountMapping = Record<string, string>

function normalizeKey(code: string): string {
  return code.trim().toLowerCase()
}

export function suggestMapping(
  ourAccounts: ChartOfAccounts[],
  qboAccounts: Array<{ qbo_id: string; name: string }>
): AccountMapping {
  const out: AccountMapping = {}
  const qboByNorm = new Map<string, typeof qboAccounts>()
  for (const q of qboAccounts) {
    const k = normalizeKey(q.name)
    const list = qboByNorm.get(k) ?? []
    list.push(q)
    qboByNorm.set(k, list)
  }
  for (const a of ourAccounts) {
    const k = normalizeKey(a.name)
    const match = qboByNorm.get(k)?.[0]
    if (match) out[a.code] = match.qbo_id
  }
  return out
}

export function validateMappingForAccounts(
  accounts: ChartOfAccounts[],
  mapping: AccountMapping
): { ok: true } | { ok: false; missingCodes: string[] } {
  const missing: string[] = []
  for (const a of accounts) {
    const qboId = mapping[a.code]?.trim()
    if (!qboId) missing.push(a.code)
  }
  if (missing.length) return { ok: false, missingCodes: missing }
  return { ok: true }
}

export function resolveQboAccountForTx(
  tx: { final_account_code?: string; suggested_account_code: string },
  mapping: AccountMapping
): string | null {
  const code = (tx.final_account_code?.trim() || tx.suggested_account_code?.trim()) ?? ''
  if (!code) return null
  return mapping[code]?.trim() || null
}
