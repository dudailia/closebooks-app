import type { ChartOfAccounts, Transaction } from '@/types'
import type { LearnedRuleLine } from '@/lib/categorization/prompts'

function normVendor(desc: string): string {
  return desc
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

/** Match learned rules first (exact vendor_key or substring). */
export function applyLearnedRules(
  tx: Transaction,
  rules: LearnedRuleLine[],
  coa: ChartOfAccounts[]
): { code: string; name: string; source: 'learned' } | null {
  const v = normVendor(tx.description)
  if (!v || rules.length === 0) return null

  for (const r of rules) {
    const key = r.vendor_key.toUpperCase()
    if (!key) continue
    if (v.includes(key) || key.length >= 4 && v.split(' ').some((w) => w.startsWith(key.slice(0, 6)))) {
      const acc = coa.find((a) => a.code === r.correct_account_code)
      if (acc) {
        return { code: r.correct_account_code, name: r.correct_account_name || acc.name, source: 'learned' }
      }
    }
  }
  return null
}
