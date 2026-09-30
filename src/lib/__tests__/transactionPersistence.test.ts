import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@/types'
import {
  isMissingNewColumnError,
  newColumnValues,
  readApprovedBy,
  readCategorizationSource,
  readSplits,
  resetNewColumnDetection,
  upsertTransactionRows,
} from '@/lib/transactionPersistence'

const MISSING = { code: 'PGRST204', message: "Could not find the 'categorization_source' column of 'transactions' in the schema cache" }

const ALL_NEW = ['splits', 'categorization_source', 'approved_by']

// A fake Supabase client that records upserts and, like PostgREST, rejects a
// write by naming the first column it doesn't have.
function fakeSupabase(opts: { hasNewColumns: boolean | string[]; otherError?: { code: string; message: string } }) {
  const has = opts.hasNewColumns === true ? ALL_NEW : opts.hasNewColumns === false ? [] : opts.hasNewColumns
  const calls: Record<string, unknown>[][] = []
  const client = {
    from: () => ({
      upsert: async (rows: Record<string, unknown>[]) => {
        calls.push(rows)
        if (opts.otherError) return { error: opts.otherError }
        const unknown = ALL_NEW.find((c) => !has.includes(c) && rows.some((r) => c in r))
        return { error: unknown ? { code: 'PGRST204', message: `Could not find the '${unknown}' column of 'transactions' in the schema cache` } : null }
      },
    }),
  }
  return { client: client as never, calls }
}

const row = (id: string) => ({ id, job_id: 'j1', amount: 1, splits: null, categorization_source: 'manual', approved_by: 'reviewer' })

beforeEach(() => {
  resetNewColumnDetection()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('reading old and new rows', () => {
  it('old rows without the columns load with no splits and no source', () => {
    expect(readSplits(undefined)).toBeUndefined()
    expect(readSplits(null)).toBeUndefined()
    expect(readSplits([])).toBeUndefined()
    expect(readCategorizationSource(undefined)).toBeUndefined()
    expect(readCategorizationSource(null)).toBeUndefined()
  })

  it('reads splits and a known source', () => {
    expect(readSplits([{ id: 's1', amount: '60.5', account_code: '6100', category: 'Software', notes: 'n' }]))
      .toEqual([{ id: 's1', amount: 60.5, account_code: '6100', category: 'Software', notes: 'n' }])
    expect(readCategorizationSource('firm_rule')).toBe('firm_rule')
    expect(readApprovedBy('ai')).toBe('ai')
    expect(readApprovedBy('robot')).toBeUndefined()
    expect(readApprovedBy(null)).toBeUndefined()
  })

  it('a bad split amount becomes 0 and an unknown source is dropped', () => {
    expect(readSplits([{ amount: 'abc' }])).toEqual([{ id: 'split-0', amount: 0, account_code: '', category: '' }])
    expect(readCategorizationSource('robot')).toBeUndefined()
  })
})

describe('newColumnValues', () => {
  it('writes null for no splits and no source', () => {
    expect(newColumnValues({ id: 't' } as Transaction)).toEqual({ splits: null, categorization_source: null, approved_by: null })
    expect(newColumnValues({ id: 't', splits: [] } as unknown as Transaction)).toEqual({ splits: null, categorization_source: null, approved_by: null })
  })

  it('writes splits and source when present', () => {
    const splits = [{ id: 's1', amount: 1, account_code: '6100', category: 'X' }]
    expect(newColumnValues({ id: 't', splits, categorizationSource: 'manual', approvedBy: 'reviewer' } as Transaction))
      .toEqual({ splits, categorization_source: 'manual', approved_by: 'reviewer' })
  })
})

describe('isMissingNewColumnError', () => {
  it('matches only missing-column errors that name a new column', () => {
    expect(isMissingNewColumnError(MISSING)).toBe(true)
    expect(isMissingNewColumnError({ code: '42703', message: 'column transactions.splits does not exist' })).toBe(true)
    expect(isMissingNewColumnError({ code: 'PGRST204', message: "Could not find the 'foo' column" })).toBe(false)
    expect(isMissingNewColumnError({ code: '42501', message: 'row-level security' })).toBe(false)
    expect(isMissingNewColumnError(null)).toBe(false)
  })
})

describe('upsertTransactionRows', () => {
  it('migration applied: saves the new columns in one request per chunk', async () => {
    const { client, calls } = fakeSupabase({ hasNewColumns: true })
    const res = await upsertTransactionRows(client, [row('a'), row('b'), row('c')], 2)
    expect(res.error).toBeNull()
    expect(calls).toHaveLength(2)
    expect(calls[0][0]).toHaveProperty('categorization_source', 'manual')
  })

  it('migration not applied: retries without the new columns and remembers it', async () => {
    const { client, calls } = fakeSupabase({ hasNewColumns: false })
    const res = await upsertTransactionRows(client, [row('a'), row('b'), row('c')], 2)
    expect(res.error).toBeNull()
    // chunk 1: rejected once per missing column, then saved; chunk 2: sent without them from the start
    expect(calls).toHaveLength(5)
    expect(calls[3][0]).not.toHaveProperty('splits')
    expect(calls[3][0]).not.toHaveProperty('categorization_source')
    expect(calls[3][0]).not.toHaveProperty('approved_by')
    expect(calls[3][0]).toMatchObject({ id: 'a', job_id: 'j1', amount: 1 })
    expect(calls[4].map((r) => 'splits' in r)).toEqual([false])
  })

  it('only approved_by missing: drops just that column and keeps saving the others', async () => {
    const { client, calls } = fakeSupabase({ hasNewColumns: ['splits', 'categorization_source'] })
    const res = await upsertTransactionRows(client, [row('a'), row('b')], 1)
    expect(res.error).toBeNull()
    expect(calls).toHaveLength(3)
    expect(calls[1][0]).not.toHaveProperty('approved_by')
    expect(calls[1][0]).toHaveProperty('categorization_source', 'manual')
    expect(calls[2][0]).toHaveProperty('categorization_source', 'manual')
    expect(calls[2][0]).not.toHaveProperty('approved_by')
  })

  it('other errors are returned, not retried', async () => {
    const { client, calls } = fakeSupabase({ hasNewColumns: true, otherError: { code: '42501', message: 'row-level security' } })
    const res = await upsertTransactionRows(client, [row('a')], 500)
    expect(res.error).toEqual({ code: '42501', message: 'row-level security' })
    expect(calls).toHaveLength(1)
  })
})
