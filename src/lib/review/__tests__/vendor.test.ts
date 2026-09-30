import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@/types'

// The rule module persists to Supabase when it can; never from tests.
vi.mock('@/lib/syncSupabase', () => ({ getSupabaseAndFirm: async () => null }))

import { vendorKey, vendorPatternMatches } from '@/lib/review/vendor'
import {
  applyRulesBeforeAI, applyRulesToJob, deleteRule, ensureRulesLoaded, findRuleForDescription, listRules,
  mergeCategorized, saveRule,
} from '@/lib/review/rules'

const tx = (id: string, description: string, type: Transaction['type'] = 'debit'): Transaction => ({
  id, date: '2026-07-01', description, original_description: description, amount: 50, type,
  suggested_category: '', suggested_account_code: '', confidence: 0, status: 'pending',
})

beforeEach(async () => { for (const r of listRules()) await deleteRule(r.id) })

describe('vendorKey: the same vendor across months', () => {
  it.each([
    ['GUSTO DES:NET 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC', 'GUSTO DES:NET 07/31 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC'],
    ['TX COMPTROLLER DES:SALES TAX ID:4WL4C50FFN', 'TX COMPTROLLER DES:SALES TAX ID:9QQ2M7LA3C'],
    ['STRIPE TRANSFER ST-BPQBDJJ8SM', 'STRIPE TRANSFER ST-CKA0BCSQP1'],
    ['POS DEBIT 06/12 SHELL SERVICE STATION AUSTIN', 'POS DEBIT 07/03 SHELL SERVICE STATION AUSTIN'],
    ['AMZN Mktp US*2K4TR8LQ2 Amzn.com/bill WA', 'AMZN Mktp US*9XY7Q2LLP Amzn.com/bill WA'],
    ['LYFT *RIDE SUN 11AM 855-865-9553 CA', 'LYFT *RIDE THU 8AM 855-865-9553 CA'],
    ['ONLINE TRANSFER TO SAV ...8830 REF #CVC9MJ8U52', 'ONLINE TRANSFER TO SAV ...8830 REF #AB12CD34EF'],
    ['VERIZON WRLS P9170-01 FL', 'VERIZON WRLS P7933-01 FL'],
    // Generic lines, not from the eval data:
    ['CHECKCARD 0612 WHOLE FOODS #10234 PORTLAND OR', 'CHECKCARD 0719 WHOLE FOODS #10234 PORTLAND OR'],
    ['ADP PAYROLL FEES DES:ADP FEES ID:916284 INDN:ACME CO', 'ADP PAYROLL FEES DES:ADP FEES ID:104427 INDN:ACME CO'],
    ['ZELLE PAYMENT TO JOHN DOE CONF# 8H2K9Q', 'ZELLE PAYMENT TO JOHN DOE CONF# T4M7P1'],
    ['COMCAST CABLE COMM 800-266-2278 PA 03/14', 'COMCAST CABLE COMM 800-266-2278 PA 04/14'],
  ])('%s  ≈  %s', (a, b) => {
    expect(vendorKey(a)).toBe(vendorKey(b))
    expect(vendorKey(a)).not.toBe('')
  })

  it('keeps the vendor words and drops the noise', () => {
    expect(vendorKey('GUSTO DES:NET 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC')).toBe('gusto des:net')
    expect(vendorKey('ATM WITHDRAWAL 06/12 1100 CONGRESS AVE AUSTIN TX')).toBe('atm withdrawal congress ave austin')
    expect(vendorKey('SQ *ODD DUCK AUSTIN TX')).toBe('odd duck austin')
  })
})

describe('vendorKey: different transaction types stay apart', () => {
  it('Gusto net pay, payroll tax and platform fee are three different keys', () => {
    const keys = new Set([
      vendorKey('GUSTO DES:NET 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC'),
      vendorKey('GUSTO DES:TAX 06/15 ID:SQTQFJ55WM INDN:BRIGHTLINE STUDIO LLC'),
      vendorKey('GUSTO DES:FEE 07/01 ID:X2VMZ48QA7'),
    ])
    expect(keys.size).toBe(3)
  })

  it('the Comptroller sales-tax and franchise-tax payments differ', () => {
    expect(vendorKey('TX COMPTROLLER DES:SALES TAX ID:1')).not.toBe(vendorKey('TX COMPTROLLER DES:FRANCHISE ID:1'))
  })

  it('transfers to savings and to the owner differ', () => {
    expect(vendorKey('ONLINE TRANSFER TO SAV ...8830')).not.toBe(vendorKey('ONLINE TRANSFER TO REYES J PERSONAL CHK ...4417'))
  })
})

describe('vendorKey properties', () => {
  it.each([
    'GUSTO DES:TAX 06/30 ID:7RT32P2D2A INDN:BRIGHTLINE STUDIO LLC',
    'PAYMENT TO CHASE CARD ENDING IN 3301',
    'DELTA AIR 0062318842271 ATLANTA GA',
    'INCOMING WIRE TRF ORCHARD AND PINE CO REF KD33MX',
  ])('is idempotent: %s', (d) => {
    expect(vendorKey(vendorKey(d))).toBe(vendorKey(d))
  })

  it('a pattern stored by the old normaliser still matches', () => {
    // Old normalizeVendor kept store numbers and IDs, e.g. "ace hardware #07891 austin".
    expect(vendorPatternMatches('ACE HARDWARE #07891 AUSTIN TX', 'ace hardware #07891 austin')).toBe(true)
  })

  it('matching is exact on the key, not a substring', () => {
    expect(vendorPatternMatches('GUSTO DES:TAX 07/15 ID:A1B2C3D4', 'gusto')).toBe(false)
    expect(vendorPatternMatches('', 'gusto')).toBe(false)
  })
})

describe('rules with direction', () => {
  it('a Delta refund never matches the Delta purchase rule', async () => {
    await saveRule({ description: 'DELTA AIR 0062318842271 ATLANTA GA', accountCode: '5800', categoryName: 'Travel & Entertainment', createdBy: 't', direction: 'debit' })
    expect(findRuleForDescription('DELTA AIR 0062318842271 ATLANTA GA', 'debit')?.accountCode).toBe('5800')
    expect(findRuleForDescription('DELTA AIR 0062318842271 ATLANTA GA', 'credit')).toBeNull()
    const { applied } = applyRulesToJob([tx('p', 'DELTA AIR 0062321957006 ATLANTA GA'), tx('r', 'DELTA AIR 0062318842271 ATLANTA GA', 'credit')])
    expect(applied.map((a) => a.txId)).toEqual(['p'])
  })

  it('the same key in both directions keeps two separate rules', async () => {
    await saveRule({ description: 'ACME CORP', accountCode: '5400', categoryName: 'Office Supplies', createdBy: 't', direction: 'debit' })
    await saveRule({ description: 'ACME CORP', accountCode: '1100', categoryName: 'Accounts Receivable', createdBy: 't', direction: 'credit' })
    expect(listRules()).toHaveLength(2)
    expect(findRuleForDescription('ACME CORP', 'credit')?.accountCode).toBe('1100')
  })

  it('a rule saved before direction existed still matches either way', async () => {
    await saveRule({ description: 'STAPLES 00115 AUSTIN TX', accountCode: '5400', categoryName: 'Office Supplies', createdBy: 't' })
    expect(findRuleForDescription('STAPLES 00115 AUSTIN TX', 'credit')?.accountCode).toBe('5400')
  })
})

describe('rules first at upload', () => {
  it('rule rows take the account with source = rule; only the rest go to the AI; order is kept', async () => {
    await ensureRulesLoaded() // no Supabase in tests: resolves with the in-memory rules
    await saveRule({ description: 'GUSTO DES:TAX 06/15 ID:SQTQFJ55WM', accountCode: '2300', categoryName: 'Payroll Liabilities', createdBy: 't', direction: 'debit' })
    const txs = [tx('a', 'UBER *TRIP HELP.UBER.COM CA'), tx('b', 'GUSTO DES:TAX 07/15 ID:9ZZ8YY7XX6'), tx('c', 'GUSTO DES:NET 07/15 ID:9ZZ8YY7XX6')]
    const { txs: out, unmatched, ruleApplied } = applyRulesBeforeAI(txs)
    expect(ruleApplied).toBe(1)
    expect(unmatched.map((t) => t.id)).toEqual(['a', 'c'])
    expect(out[1]).toMatchObject({
      status: 'edited', categorizationSource: 'firm_rule', final_account_code: '2300', suggested_account_code: '2300',
      suggested_category: 'Payroll Liabilities',
    })
    const fromAi = unmatched.map((t) => ({ ...t, suggested_account_code: '5800', status: 'approved' as const }))
    expect(mergeCategorized(out, fromAi).map((t) => [t.id, t.final_account_code ?? t.suggested_account_code])).toEqual([
      ['a', '5800'], ['b', '2300'], ['c', '5800'],
    ])
  })
})
