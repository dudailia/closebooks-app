import type { CategorizationJob, Client } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────────────────────

const JOBS_KEY = 'closebooks_jobs'

export function getJobs(): CategorizationJob[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(JOBS_KEY) ?? '[]') as CategorizationJob[]
  } catch {
    return []
  }
}

export function getJob(id: string): CategorizationJob | null {
  return getJobs().find((j) => j.id === id) ?? null
}

export function saveJob(job: CategorizationJob): void {
  const jobs = getJobs()
  const idx = jobs.findIndex((j) => j.id === job.id)
  if (idx >= 0) jobs[idx] = job
  else jobs.unshift(job)
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
}

export function deleteJob(id: string): void {
  localStorage.setItem(JOBS_KEY, JSON.stringify(getJobs().filter((j) => j.id !== id)))
}

/** All jobs whose client_name matches (case-insensitive). */
export function getJobsForClient(businessName: string): CategorizationJob[] {
  const lower = businessName.toLowerCase()
  return getJobs().filter((j) => j.client_name.toLowerCase() === lower)
}

// ─────────────────────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTS_KEY = 'closebooks_clients'

export function getClients(): Client[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CLIENTS_KEY) ?? '[]') as Client[]
  } catch {
    return []
  }
}

export function getClient(id: string): Client | null {
  return getClients().find((c) => c.id === id) ?? null
}

export function saveClient(client: Client): void {
  const clients = getClients()
  const idx = clients.findIndex((c) => c.id === client.id)
  if (idx >= 0) clients[idx] = client
  else clients.unshift(client)
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))
}

export function deleteClient(id: string): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(getClients().filter((c) => c.id !== id)))
}
