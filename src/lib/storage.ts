/**
 * Jobs & clients — backed by in-memory cache + Supabase (see lib/db.ts, lib/hydrateFirmData.ts).
 * No localStorage.
 */

import {
  memoryGetJobs,
  memoryGetJob,
  memorySaveJob,
  memoryDeleteJob,
  memoryGetClients,
  memoryGetClient,
  memorySaveClient,
  memoryDeleteClient,
  memoryGetJobsForClient,
  memoryGetPendingReviewCount,
} from '@/lib/memoryData'
import type { CategorizationJob, Client } from '@/types'

export function getJobs(): CategorizationJob[] {
  return memoryGetJobs()
}

export function getJob(id: string): CategorizationJob | null {
  return memoryGetJob(id)
}

export function saveJob(job: CategorizationJob): void {
  memorySaveJob(job)
}

export function deleteJob(id: string): void {
  memoryDeleteJob(id)
}

export function getJobsForClient(businessName: string): CategorizationJob[] {
  return memoryGetJobsForClient(businessName)
}

export function getPendingReviewCount(): number {
  return memoryGetPendingReviewCount()
}

export function getClients(): Client[] {
  return memoryGetClients()
}

export function getClient(id: string): Client | null {
  return memoryGetClient(id)
}

export function saveClient(client: Client): void {
  memorySaveClient(client)
}

export function deleteClient(id: string): void {
  memoryDeleteClient(id)
}
