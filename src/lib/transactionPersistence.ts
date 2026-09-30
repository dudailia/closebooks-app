import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction, TransactionSplit } from '@/types'

// Columns added after the original schema: splits and categorization_source by
// supabase/migrations/20260926000000_transaction_splits_source.sql, approved_by by
// 20260930000000_transaction_approved_by.sql. Until a migration runs, Supabase
// rejects any upsert that names its column (PGRST204), so writes retry without
// that column rather than dropping the whole batch. Each column is dropped on
// its own, so one missing column doesn't stop the others saving.
export const NEW_TRANSACTION_COLUMNS = ['splits', 'categorization_source', 'approved_by'] as const
type NewColumn = (typeof NEW_TRANSACTION_COLUMNS)[number]

const SOURCES: ReadonlyArray<NonNullable<Transaction['categorizationSource']>> = ['ai', 'firm_rule', 'manual', 'copilot']
const APPROVERS: ReadonlyArray<NonNullable<Transaction['approvedBy']>> = ['ai', 'rule', 'reviewer']

/** Splits from a `splits` jsonb cell. Missing or empty (old rows) → undefined. */
export function readSplits(value: unknown): TransactionSplit[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  return value.map((item, i) => {
    const s = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const amount = Number(s.amount)
    return {
      id: String(s.id ?? `split-${i}`),
      // A bad amount becomes 0, which the journal generator reports as an exception.
      amount: Number.isFinite(amount) ? amount : 0,
      account_code: String(s.account_code ?? ''),
      category: String(s.category ?? ''),
      ...(s.notes ? { notes: String(s.notes) } : {}),
    }
  })
}

/** categorizationSource from a `categorization_source` cell. Unknown or missing → undefined. */
export function readCategorizationSource(value: unknown): Transaction['categorizationSource'] {
  return SOURCES.find((s) => s === value)
}

/** approvedBy from an `approved_by` cell. Unknown or missing → undefined. */
export function readApprovedBy(value: unknown): Transaction['approvedBy'] {
  return APPROVERS.find((a) => a === value)
}

/** The new columns for a transaction row. */
export function newColumnValues(t: Transaction): { splits: TransactionSplit[] | null; categorization_source: string | null; approved_by: string | null } {
  return {
    splits: t.splits && t.splits.length > 0 ? t.splits : null,
    categorization_source: t.categorizationSource ?? null,
    approved_by: t.approvedBy ?? null,
  }
}

interface PostgrestLikeError {
  code?: string
  message?: string
}

/** The new columns a missing-column error names (empty for any other error). */
export function missingNewColumns(error: PostgrestLikeError | null | undefined): NewColumn[] {
  if (!error) return []
  if (error.code !== 'PGRST204' && error.code !== '42703') return []
  return NEW_TRANSACTION_COLUMNS.filter((c) => (error.message ?? '').includes(c))
}

/** True when Supabase rejected a write because a new column doesn't exist yet. */
export function isMissingNewColumnError(error: PostgrestLikeError | null | undefined): boolean {
  return missingNewColumns(error).length > 0
}

// Columns found missing are skipped for the rest of the session.
const missing = new Set<NewColumn>()

function withoutMissing(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row }
  for (const c of missing) delete copy[c]
  return copy
}

/** Test hook: forget which columns were found missing. */
export function resetNewColumnDetection(): void {
  missing.clear()
}

/**
 * Upsert transaction rows in chunks. If the new columns aren't in the table
 * yet, the chunk is retried without them so every other field still saves.
 * Returns the first error that remains after any retry.
 */
export async function upsertTransactionRows(
  supabase: Pick<SupabaseClient, 'from'>,
  rows: Record<string, unknown>[],
  chunkSize: number,
): Promise<{ error: PostgrestLikeError | null }> {
  let firstError: PostgrestLikeError | null = null
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    let { error } = await supabase.from('transactions').upsert(chunk.map(withoutMissing), { onConflict: 'id' })
    // At most one retry per new column: each retry drops the column(s) the error named.
    for (let tries = 0; error && tries < NEW_TRANSACTION_COLUMNS.length; tries++) {
      const named = missingNewColumns(error).filter((c) => !missing.has(c))
      if (named.length === 0) break
      named.forEach((c) => missing.add(c))
      console.warn(`[transactions] column(s) ${named.join(', ')} missing: saving without them until the migration is applied.`)
      ;({ error } = await supabase.from('transactions').upsert(chunk.map(withoutMissing), { onConflict: 'id' }))
    }
    if (error && !firstError) firstError = error
  }
  return { error: firstError }
}
