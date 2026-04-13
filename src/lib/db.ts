/**
 * db.ts — Supabase-first data access layer with in-memory fallback.
 *
 * All functions try Supabase first. On any error, missing config, or missing
 * session they fall back to the client memory cache (populated after hydrate).
 *
 * Client-side only — do not import in Server Components or API routes.
 */

import { createClient } from '@/lib/supabase/client'
import {
  memoryGetJobs as lsGetJobs,
  memoryGetJob as lsGetJob,
  memorySaveJob as lsSaveJob,
  memoryDeleteJob as lsDeleteJob,
  memoryGetClients as lsGetClients,
  memorySaveClient as lsSaveClient,
  memoryDeleteClient as lsDeleteClient,
} from '@/lib/memoryData'
import type { CategorizationJob, Client, Transaction } from '@/types'

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Returns the firm ID for the currently authenticated user, or null. */
async function getFirmId(): Promise<string | null> {
  try {
    const supabase = createClient()
    if (!supabase) return null
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    return data?.id ?? null
  } catch {
    return null
  }
}

function mapTxRow(row: Record<string, unknown>): Transaction {
  return {
    id:                   String(row.id),
    date:                 String(row.date ?? ''),
    description:          String(row.description ?? ''),
    amount:               Number(row.amount ?? 0),
    type:                 (row.type as 'debit' | 'credit') ?? 'debit',
    original_description: String(row.original_description ?? row.description ?? ''),
    suggested_category:   String(row.suggested_category ?? ''),
    suggested_account_code: String(row.suggested_account_code ?? ''),
    confidence:           Number(row.confidence ?? 0),
    status:               (row.status as Transaction['status']) ?? 'pending',
    final_category:       row.final_category ? String(row.final_category) : undefined,
    final_account_code:   row.final_account_code ? String(row.final_account_code) : undefined,
    notes:                row.notes ? String(row.notes) : undefined,
  }
}

function mapJobRow(row: Record<string, unknown>, transactions: Transaction[]): CategorizationJob {
  return {
    id:                 String(row.id),
    client_name:        String(row.client_name ?? ''),
    created_at:         String(row.created_at ?? new Date().toISOString()),
    status:             (row.status as CategorizationJob['status']) ?? 'review',
    total_transactions: Number(row.total_transactions ?? transactions.length),
    auto_categorized:   Number(row.auto_categorized ?? 0),
    approved:           Number(row.approved ?? transactions.filter(t => t.status === 'approved' || t.status === 'edited').length),
    flagged:            Number(row.flagged ?? transactions.filter(t => t.status === 'flagged').length),
    transactions,
    chart_of_accounts:  (row.chart_of_accounts as CategorizationJob['chart_of_accounts']) ?? [],
  }
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

/**
 * Load all jobs for the current firm.
 * Returns jobs WITHOUT embedded transactions (for performance).
 * Falls back to memory (includes transactions after hydration).
 */
export async function dbGetJobs(): Promise<CategorizationJob[]> {
  try {
    const supabase = createClient()
    if (!supabase) return lsGetJobs()

    const firmId = await getFirmId()
    if (!firmId) return lsGetJobs()

    const { data, error } = await supabase
      .from('jobs')
      .select('id, client_name, created_at, status, total_transactions, auto_categorized, approved, flagged, chart_of_accounts')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })

    if (error || !data) return lsGetJobs()

    return data.map(row => mapJobRow(row as Record<string, unknown>, []))
  } catch {
    return lsGetJobs()
  }
}

/**
 * Load a single job with all its transactions.
 * Falls back to memory.
 */
export async function dbGetJob(id: string): Promise<CategorizationJob | null> {
  try {
    const supabase = createClient()
    if (!supabase) return lsGetJob(id)

    const firmId = await getFirmId()
    if (!firmId) return lsGetJob(id)

    const [jobResult, txResult] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', id).eq('firm_id', firmId).maybeSingle(),
      supabase.from('transactions').select('*').eq('job_id', id).order('date', { ascending: true }),
    ])

    if (jobResult.error || !jobResult.data) return lsGetJob(id)

    const transactions = (txResult.data ?? []).map(row => mapTxRow(row as Record<string, unknown>))
    return mapJobRow(jobResult.data as Record<string, unknown>, transactions)
  } catch {
    return lsGetJob(id)
  }
}

/**
 * Save a job and all its transactions.
 * Writes to memory first, then Supabase.
 */
export async function dbSaveJob(job: CategorizationJob): Promise<void> {
  lsSaveJob(job)

  try {
    const supabase = createClient()
    if (!supabase) return

    const firmId = await getFirmId()
    if (!firmId) return

    const { transactions, chart_of_accounts, ...meta } = job
    const approved = transactions.filter(t => t.status === 'approved' || t.status === 'edited').length
    const flagged  = transactions.filter(t => t.status === 'flagged').length

    const { error: jobErr } = await supabase.from('jobs').upsert({
      id:                 meta.id,
      firm_id:            firmId,
      client_name:        meta.client_name,
      created_at:         meta.created_at,
      status:             meta.status,
      total_transactions: meta.total_transactions,
      auto_categorized:   meta.auto_categorized,
      approved,
      flagged,
      chart_of_accounts,
    }, { onConflict: 'id' })

    if (jobErr) return

    if (transactions.length === 0) return

    const txRows = transactions.map(t => ({
      id:                   t.id,
      job_id:               job.id,
      date:                 t.date,
      description:          t.description,
      amount:               t.amount,
      type:                 t.type,
      original_description: t.original_description,
      suggested_category:   t.suggested_category,
      suggested_account_code: t.suggested_account_code,
      confidence:           t.confidence,
      status:               t.status,
      final_category:       t.final_category ?? null,
      final_account_code:   t.final_account_code ?? null,
      notes:                t.notes ?? null,
    }))

    // Batch in chunks of 500 to stay within Supabase limits
    for (let i = 0; i < txRows.length; i += 500) {
      await supabase.from('transactions').upsert(txRows.slice(i, i + 500), { onConflict: 'id' })
    }
  } catch {
    // memory already has the data — silently ignore Supabase errors
  }
}

export async function dbDeleteJob(id: string): Promise<void> {
  lsDeleteJob(id)
  try {
    const supabase = createClient()
    if (!supabase) return
    await supabase.from('transactions').delete().eq('job_id', id)
    await supabase.from('jobs').delete().eq('id', id)
  } catch {
    // ignore
  }
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function dbGetClients(): Promise<Client[]> {
  try {
    const supabase = createClient()
    if (!supabase) return lsGetClients()

    const firmId = await getFirmId()
    if (!firmId) return lsGetClients()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })

    if (error || !data) return lsGetClients()
    return data as Client[]
  } catch {
    return lsGetClients()
  }
}

export async function dbSaveClient(client: Client): Promise<void> {
  lsSaveClient(client)
  try {
    const supabase = createClient()
    if (!supabase) return
    const firmId = await getFirmId()
    if (!firmId) return
    await supabase.from('clients').upsert(
      { ...client, firm_id: firmId },
      { onConflict: 'id' }
    )
  } catch {
    // ignore
  }
}

export async function dbDeleteClient(id: string): Promise<void> {
  lsDeleteClient(id)
  try {
    const supabase = createClient()
    if (!supabase) return
    await supabase.from('clients').delete().eq('id', id)
  } catch {
    // ignore
  }
}

// ─── Firm ────────────────────────────────────────────────────────────────────

/**
 * Create or update the firm record for a user after signup.
 * Uses upsert on owner_id so it's safe to call multiple times.
 */
export async function dbEnsureFirm(firmName: string, ownerId: string): Promise<void> {
  try {
    const supabase = createClient()
    if (!supabase) return
    await supabase.from('firms').upsert(
      { owner_id: ownerId, name: firmName },
      { onConflict: 'owner_id' }
    )
  } catch {
    // ignore — app works without this
  }
}
