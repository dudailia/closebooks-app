import type { SupabaseClient } from '@supabase/supabase-js'
import type { Transaction, TransactionSplit } from '@/types'

// Columns added by supabase/migrations/20260926000000_transaction_splits_source.sql.
// Until that migration runs, Supabase rejects any upsert that names them
// (PGRST204), so writes retry without them rather than dropping the whole batch.
export const NEW_TRANSACTION_COLUMNS = ['splits', 'categorization_source'] as const

const SOURCES: ReadonlyArray<NonNullable<Transaction['categorizationSource']>> = ['ai', 'firm_rule', 'manual', 'copilot']

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

/** The new columns for a transaction row. */
export function newColumnValues(t: Transaction): { splits: TransactionSplit[] | null; categorization_source: string | null } {
  return {
    splits: t.splits && t.splits.length > 0 ? t.splits : null,
    categorization_source: t.categorizationSource ?? null,
  }
}

interface PostgrestLikeError {
  code?: string
  message?: string
}

/** True when Supabase rejected a write because the new columns don't exist yet. */
export function isMissingNewColumnError(error: PostgrestLikeError | null | undefined): boolean {
  if (!error) return false
  if (error.code !== 'PGRST204' && error.code !== '42703') return false
  return NEW_TRANSACTION_COLUMNS.some((c) => (error.message ?? '').includes(c))
}

function withoutNewColumns(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row }
  for (const c of NEW_TRANSACTION_COLUMNS) delete copy[c]
  return copy
}

// Once a write has hit the missing columns, skip them for the rest of the session.
let newColumnsMissing = false

/** Test hook: forget that the columns were found missing. */
export function resetNewColumnDetection(): void {
  newColumnsMissing = false
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
    let chunk = rows.slice(i, i + chunkSize)
    if (newColumnsMissing) chunk = chunk.map(withoutNewColumns)

    let { error } = await supabase.from('transactions').upsert(chunk, { onConflict: 'id' })
    if (error && !newColumnsMissing && isMissingNewColumnError(error)) {
      newColumnsMissing = true
      console.warn('[transactions] splits/categorization_source columns missing — saving without them until the migration is applied.')
      ;({ error } = await supabase.from('transactions').upsert(chunk.map(withoutNewColumns), { onConflict: 'id' }))
    }
    if (error && !firstError) firstError = error
  }
  return { error: firstError }
}
