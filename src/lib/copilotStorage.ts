import type { CopilotRun, CopilotConfig } from '@/types'

const RUNS_KEY   = 'closebooks_copilot_runs'
const CONFIG_KEY = 'closebooks_copilot_config'
const MAX_RUNS   = 50

export const DEFAULT_CONFIG: CopilotConfig = {
  confidenceThreshold: 0.85,
  maxAutoAmount:       5000,
  autoFlagThreshold:   0.60,
}

// ─── Config ──────────────────────────────────────────────────────────────────

export function loadCopilotConfig(): CopilotConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG }
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveCopilotConfig(config: CopilotConfig): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export function getCopilotRuns(): CopilotRun[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RUNS_KEY) ?? '[]') as CopilotRun[]
  } catch {
    return []
  }
}

export function saveCopilotRun(run: CopilotRun): void {
  if (typeof window === 'undefined') return
  const all = getCopilotRuns().filter((r) => r.id !== run.id)
  all.unshift(run)
  localStorage.setItem(RUNS_KEY, JSON.stringify(all.slice(0, MAX_RUNS)))
}

export function getRunsForJob(jobId: string): CopilotRun[] {
  return getCopilotRuns().filter((r) => r.jobId === jobId)
}
