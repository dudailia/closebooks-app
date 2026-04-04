import type { CategorizationJob } from '@/types'

const KEY = 'closebooks_jobs'

export function getJobs(): CategorizationJob[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CategorizationJob[]
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
  localStorage.setItem(KEY, JSON.stringify(jobs))
}

export function deleteJob(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getJobs().filter((j) => j.id !== id)))
}
