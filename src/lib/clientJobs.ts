// Which client a close (job) belongs to.
//
// New jobs carry the client's id (`client_id`) and are matched on it only, so
// two clients with the same name never share closes and renaming a client
// keeps its closes. Jobs saved before client_id existed have only
// `client_name`; they still match by name (case-insensitive), as before.

import type { CategorizationJob, Client } from '@/types'

function sameName(a: string | undefined, b: string | undefined): boolean {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
}

/** True when the job is one of this client's closes. */
export function jobBelongsToClient(job: Pick<CategorizationJob, 'client_id' | 'client_name'>, client: Pick<Client, 'id' | 'business_name'>): boolean {
  if (job.client_id) return job.client_id === client.id
  return sameName(job.client_name, client.business_name)
}

/** This client's closes, in the order given. */
export function jobsForClient<J extends Pick<CategorizationJob, 'client_id' | 'client_name'>>(jobs: J[], client: Pick<Client, 'id' | 'business_name'>): J[] {
  return jobs.filter((j) => jobBelongsToClient(j, client))
}

/**
 * The client a job belongs to: by id when the job has one. A job without an
 * id (saved before client_id) is matched by name only when exactly one client
 * has that name; with two or more it is ambiguous and returns null.
 */
export function clientForJob<C extends Pick<Client, 'id' | 'business_name'>>(job: Pick<CategorizationJob, 'client_id' | 'client_name'>, clients: C[]): C | null {
  if (job.client_id) return clients.find((c) => c.id === job.client_id) ?? null
  const byName = clients.filter((c) => sameName(c.business_name, job.client_name))
  return byName.length === 1 ? byName[0] : null
}

/** True when two jobs are closes of the same client. */
export function sameClientJobs(a: Pick<CategorizationJob, 'client_id' | 'client_name'>, b: Pick<CategorizationJob, 'client_id' | 'client_name'>): boolean {
  if (a.client_id && b.client_id) return a.client_id === b.client_id
  return sameName(a.client_name, b.client_name)
}

/** Clients whose name, industry or email contains the query (case-insensitive). Empty query → all. */
export function searchClients<C extends Pick<Client, 'business_name' | 'industry' | 'contact_email'>>(clients: C[], query: string): C[] {
  const q = query.trim().toLowerCase()
  if (!q) return clients
  return clients.filter((c) =>
    [c.business_name, c.industry, c.contact_email].some((v) => (v ?? '').toLowerCase().includes(q))
  )
}
