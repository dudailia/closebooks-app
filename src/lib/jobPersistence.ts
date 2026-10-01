import type { SupabaseClient } from '@supabase/supabase-js'

// jobs.client_id is added by
// supabase/migrations/20261001200000_jobs_client_id.sql. Until that migration
// runs, Supabase rejects an upsert naming the column (PGRST204), so the save
// retries without it: the job still saves, linked by name as before.

interface PostgrestLikeError {
  code?: string
  message?: string
}

export function isMissingClientIdColumn(error: PostgrestLikeError | null | undefined): boolean {
  if (!error) return false
  return (error.code === 'PGRST204' || error.code === '42703') && (error.message ?? '').includes('client_id')
}

let clientIdMissing = false

/** Test hook. */
export function resetJobColumnDetection(): void {
  clientIdMissing = false
}

/** Upsert one jobs row. Drops client_id (for the rest of the session) if the column doesn't exist. */
export async function upsertJobRow(
  supabase: Pick<SupabaseClient, 'from'>,
  row: Record<string, unknown>
): Promise<{ error: PostgrestLikeError | null }> {
  const attempt = (r: Record<string, unknown>) =>
    supabase.from('jobs').upsert(r, { onConflict: 'id' }) as unknown as Promise<{ error: PostgrestLikeError | null }>

  if (!clientIdMissing) {
    const { error } = await attempt(row)
    if (!isMissingClientIdColumn(error)) return { error }
    clientIdMissing = true
  }
  const { client_id: _dropped, ...withoutClientId } = row
  return attempt(withoutClientId)
}
