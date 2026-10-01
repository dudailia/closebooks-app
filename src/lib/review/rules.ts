import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction } from '@/types'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow } from '@/lib/supabaseJsonTable'
import { vendorKey, vendorPatternMatches } from './vendor'

export interface CategoryRule {
  id: string
  vendorPattern: string
  /** Money out (debit) or in (credit). Rules saved before this existed match either. */
  direction?: Transaction['type']
  accountCode: string
  categoryName: string
  createdBy: string
  createdAt: string
  timesApplied: number
  lastAppliedAt?: string
  active: boolean
}

let _rules: CategoryRule[] = []
let _loaded: Promise<void> | null = null

export async function hydrateRules(supabase: SupabaseClient, firmId: string): Promise<void> {
  const rows = await loadPayloadRows<CategoryRule>(supabase, 'category_rules', firmId)
  _rules = rows
}

/**
 * Load the firm's rules once per session, before anything applies them.
 * Without Supabase (demo mode) the in-memory rules are used as they are.
 * A failed load is retried on the next call.
 */
export function ensureRulesLoaded(): Promise<void> {
  if (!_loaded) {
    _loaded = (async () => {
      const ctx = await getSupabaseAndFirm()
      if (ctx) await hydrateRules(ctx.supabase, ctx.firmId)
    })().catch((err) => {
      _loaded = null
      throw err
    })
  }
  return _loaded
}

function directionMatches(rule: CategoryRule, type: Transaction['type'] | undefined): boolean {
  return !rule.direction || !type || rule.direction === type
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

/** The first active rule whose vendor key and direction match. */
export function findRuleForDescription(description: string, type?: Transaction['type']): CategoryRule | null {
  for (const r of _rules) {
    if (!r.active) continue
    if (!directionMatches(r, type)) continue
    if (vendorPatternMatches(description, r.vendorPattern)) return r
  }
  return null
}

export async function saveRule(input: {
  description: string
  accountCode: string
  categoryName: string
  createdBy: string
  direction?: Transaction['type']
}): Promise<CategoryRule> {
  const pattern = vendorKey(input.description)
  const existingIdx = _rules.findIndex((r) =>
    vendorKey(r.vendorPattern) === pattern && (r.direction ?? null) === (input.direction ?? null))
  const rule: CategoryRule = {
    id: existingIdx >= 0 ? _rules[existingIdx].id : `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    vendorPattern: pattern,
    ...(input.direction ? { direction: input.direction } : {}),
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
  return txs.filter((t) => t.status === 'pending' && directionMatches(rule, t.type) && vendorPatternMatches(t.description, rule.vendorPattern))
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
    const rule = findRuleForDescription(t.description, t.type)
    if (!rule) return t
    applied.push({ ruleId: rule.id, txId: t.id })
    // A rule is a reviewer's own earlier correction, saved, so the row is
    // approved (and posted), credited to the rule.
    return {
      ...t,
      status: 'approved' as const,
      categorizationSource: 'firm_rule' as const,
      approvedBy: 'rule' as const,
      final_account_code: rule.accountCode,
      final_category: rule.categoryName,
      confidence: Math.max(t.confidence, 0.99),
      notes: t.notes ?? `Auto-applied rule: ${rule.vendorPattern}`,
    }
  })
  return { txs: next, applied }
}

/**
 * Upload path: rules run before the AI. Rows matching an active rule take the
 * rule's account (source = firm_rule) and are not sent to the AI; `unmatched`
 * is what still needs categorising. Call ensureRulesLoaded() first.
 */
export function applyRulesBeforeAI(txs: Transaction[]): { txs: Transaction[]; unmatched: Transaction[]; ruleApplied: number } {
  const { txs: next, applied } = applyRulesToJob(txs)
  const ruleOf = new Map(applied.map((a) => [a.txId, a.ruleId]))
  const out = next.map((t) => {
    const ruleId = ruleOf.get(t.id)
    if (!ruleId) return t
    const rule = _rules.find((r) => r.id === ruleId)
    return {
      ...t,
      suggested_category: t.final_category ?? '',
      suggested_account_code: t.final_account_code ?? '',
      reasoning: `Matched firm rule "${rule?.vendorPattern ?? ''}".`,
    }
  })
  return { txs: out, unmatched: out.filter((t) => !ruleOf.has(t.id)), ruleApplied: applied.length }
}

/** Put AI results back into the full list, in the original order. */
export function mergeCategorized(all: Transaction[], categorized: Transaction[]): Transaction[] {
  const byId = new Map(categorized.map((t) => [t.id, t]))
  return all.map((t) => byId.get(t.id) ?? t)
}
