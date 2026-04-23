import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction } from '@/types'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'
import { normalizeVendor, vendorPatternMatches } from './vendor'

export interface CategoryRule {
  id: string
  vendorPattern: string
  accountCode: string
  categoryName: string
  createdBy: string
  createdAt: string
  timesApplied: number
  lastAppliedAt?: string
  active: boolean
}

let _rules: CategoryRule[] = []

export async function hydrateRules(supabase: SupabaseClient, firmId: string): Promise<void> {
  const rows = await loadPayloadRows<CategoryRule>(supabase, 'category_rules', firmId)
  _rules = rows
}

async function persistRule(rule: CategoryRule): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await upsertPayloadRow(
    ctx.supabase,
    'category_rules',
    ctx.firmId,
    rule.id,
    rule as unknown as Record<string, unknown>
  )
}

async function deleteRuleRemote(id: string): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('category_rules').delete().eq('id', id).eq('firm_id', ctx.firmId)
}

export function listRules(): CategoryRule[] {
  return _rules.slice().sort((a, b) => b.timesApplied - a.timesApplied)
}

export function findRuleForDescription(description: string): CategoryRule | null {
  for (const r of _rules) {
    if (!r.active) continue
    if (vendorPatternMatches(description, r.vendorPattern)) return r
  }
  return null
}

export async function saveRule(input: {
  description: string
  accountCode: string
  categoryName: string
  createdBy: string
}): Promise<CategoryRule> {
  const pattern = normalizeVendor(input.description)
  const existingIdx = _rules.findIndex((r) => r.vendorPattern === pattern)
  const rule: CategoryRule = {
    id: existingIdx >= 0 ? _rules[existingIdx].id : `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vendorPattern: pattern,
    accountCode: input.accountCode,
    categoryName: input.categoryName,
    createdBy: input.createdBy,
    createdAt: existingIdx >= 0 ? _rules[existingIdx].createdAt : new Date().toISOString(),
    timesApplied: existingIdx >= 0 ? _rules[existingIdx].timesApplied : 0,
    active: true,
  }
  if (existingIdx >= 0) _rules[existingIdx] = rule
  else _rules.unshift(rule)
  await persistRule(rule)
  return rule
}

export async function deleteRule(id: string): Promise<void> {
  _rules = _rules.filter((r) => r.id !== id)
  await deleteRuleRemote(id)
}

export async function setRuleActive(id: string, active: boolean): Promise<void> {
  const r = _rules.find((x) => x.id === id)
  if (!r) return
  r.active = active
  await persistRule(r)
}

export function findMatchingPending(rule: CategoryRule, txs: Transaction[]): Transaction[] {
  return txs.filter((t) => t.status === 'pending' && vendorPatternMatches(t.description, rule.vendorPattern))
}

export async function bumpRuleUsage(ruleId: string, count: number): Promise<void> {
  const r = _rules.find((x) => x.id === ruleId)
  if (!r) return
  r.timesApplied += count
  r.lastAppliedAt = new Date().toISOString()
  await persistRule(r)
}

export function applyRulesToJob(txs: Transaction[]): {
  txs: Transaction[]
  applied: Array<{ ruleId: string; txId: string }>
} {
  const applied: Array<{ ruleId: string; txId: string }> = []
  const next = txs.map((t) => {
    if (t.status !== 'pending') return t
    const rule = findRuleForDescription(t.description)
    if (!rule) return t
    applied.push({ ruleId: rule.id, txId: t.id })
    return {
      ...t,
      status: 'edited' as const,
      final_account_code: rule.accountCode,
      final_category: rule.categoryName,
      confidence: Math.max(t.confidence, 0.99),
      notes: t.notes ?? `Auto-applied rule: ${rule.vendorPattern}`,
    }
  })
  return { txs: next, applied }
}
