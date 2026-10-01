/**
 * In-memory cache for jobs and clients (no localStorage).
 * Populated by hydrateFirmData from Supabase when authenticated.
 */

import type { CategorizationJob, Client } from '@/types'
import { jobsForClient } from '@/lib/clientJobs'

let _jobs: CategorizationJob[] = []
let _clients: Client[] = []
let _hydrated = false

export function isMemoryHydrated(): boolean {
  return _hydrated
}

export function setMemoryHydrated(v: boolean): void {
  _hydrated = v
}

export function memoryGetJobs(): CategorizationJob[] {
  return _jobs
}

export function memorySetJobs(jobs: CategorizationJob[]): void {
  _jobs = jobs
}

export function memoryGetJob(id: string): CategorizationJob | null {
  return _jobs.find((j) => j.id === id) ?? null
}

export function memorySaveJob(job: CategorizationJob): void {
  const idx = _jobs.findIndex((j) => j.id === job.id)
  if (idx >= 0) _jobs[idx] = job
  else _jobs.unshift(job)
}

export function memoryDeleteJob(id: string): void {
  _jobs = _jobs.filter((j) => j.id !== id)
}

export function memoryGetClients(): Client[] {
  return _clients
}

export function memorySetClients(clients: Client[]): void {
  _clients = clients
}

export function memoryGetClient(id: string): Client | null {
  return _clients.find((c) => c.id === id) ?? null
}

export function memorySaveClient(client: Client): void {
  const idx = _clients.findIndex((c) => c.id === client.id)
  if (idx >= 0) _clients[idx] = client
  else _clients.unshift(client)
}

export function memoryDeleteClient(id: string): void {
  _clients = _clients.filter((c) => c.id !== id)
}

export function memoryGetJobsForClient(client: Pick<Client, 'id' | 'business_name'>): CategorizationJob[] {
  return jobsForClient(_jobs, client)
}

export function memoryGetPendingReviewCount(): number {
  return _jobs
    .filter((j) => j.status === 'review')
    .reduce((sum, j) => sum + j.transactions.filter((t) => t.status === 'pending').length, 0)
}
