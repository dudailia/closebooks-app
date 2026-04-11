/**
 * Free trial system.
 * Every new user gets 5 free closes. After that, they see an upgrade prompt.
 * All state lives in localStorage — no auth required.
 */

const TRIAL_KEY = 'cb_free_trial'
const FREE_CLOSES = 5

interface TrialState {
  closesUsed: number
  startedAt: string
  plan: 'free' | 'starter' | 'growth' | 'scale'
  trialActivatedAt?: string
}

function loadTrial(): TrialState {
  if (typeof window === 'undefined') return { closesUsed: 0, startedAt: new Date().toISOString(), plan: 'free' }
  try {
    const raw = localStorage.getItem(TRIAL_KEY)
    if (!raw) {
      const initial: TrialState = { closesUsed: 0, startedAt: new Date().toISOString(), plan: 'free' }
      localStorage.setItem(TRIAL_KEY, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw) as TrialState
  } catch {
    return { closesUsed: 0, startedAt: new Date().toISOString(), plan: 'free' }
  }
}

function saveTrial(state: TrialState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TRIAL_KEY, JSON.stringify(state))
}

/** Call this when a close is started (upload step 3). */
export function recordCloseUsed(): void {
  const state = loadTrial()
  state.closesUsed++
  saveTrial(state)
}

/** Returns how many closes have been used. */
export function getClosesUsed(): number {
  return loadTrial().closesUsed
}

/** Returns how many free closes remain. */
export function getFreeClosesRemaining(): number {
  const state = loadTrial()
  if (state.plan !== 'free') return Infinity
  return Math.max(0, FREE_CLOSES - state.closesUsed)
}

/** Returns true if the user can start another close. */
export function canStartClose(): boolean {
  const state = loadTrial()
  if (state.plan !== 'free') return true
  return state.closesUsed < FREE_CLOSES
}

/** Returns the current plan. */
export function getCurrentPlan(): TrialState['plan'] {
  return loadTrial().plan
}

/** Activate a paid plan (called after Stripe webhook / for demo). */
export function activatePlan(plan: TrialState['plan']): void {
  const state = loadTrial()
  state.plan = plan
  state.trialActivatedAt = new Date().toISOString()
  saveTrial(state)
}

/** Returns trial status summary for display. */
export function getTrialStatus(): {
  plan: TrialState['plan']
  closesUsed: number
  closesRemaining: number
  isOnFreeTier: boolean
  hasExhaustedTrial: boolean
  percentUsed: number
} {
  const state = loadTrial()
  const isOnFreeTier = state.plan === 'free'
  const closesRemaining = isOnFreeTier ? Math.max(0, FREE_CLOSES - state.closesUsed) : Infinity
  const hasExhaustedTrial = isOnFreeTier && state.closesUsed >= FREE_CLOSES

  return {
    plan: state.plan,
    closesUsed: state.closesUsed,
    closesRemaining,
    isOnFreeTier,
    hasExhaustedTrial,
    percentUsed: isOnFreeTier ? Math.min(100, Math.round((state.closesUsed / FREE_CLOSES) * 100)) : 0,
  }
}

export { FREE_CLOSES }
