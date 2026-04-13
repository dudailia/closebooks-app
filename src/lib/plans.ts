/**
 * Canonical plan tiers — env maps to Stripe Price IDs (monthly + annual).
 * Annual = 20% off monthly × 12.
 */

export type PlanTierId = 'starter' | 'professional' | 'enterprise'

export interface PlanLimits {
  maxClients: number
  maxUsers: number
  fullAi: boolean
  whiteLabel: boolean
  apiAccess: boolean
}

export const PLAN_LIMITS: Record<PlanTierId, PlanLimits> = {
  starter: {
    maxClients: 10,
    maxUsers: 1,
    fullAi: false,
    whiteLabel: false,
    apiAccess: false,
  },
  professional: {
    maxClients: 50,
    maxUsers: 5,
    fullAi: true,
    whiteLabel: false,
    apiAccess: false,
  },
  enterprise: {
    maxClients: 999999,
    maxUsers: 999999,
    fullAi: true,
    whiteLabel: true,
    apiAccess: true,
  },
}

/** Features above starter require at least professional */
export type GatedFeature =
  | 'full_ai'
  | 'white_label'
  | 'api'
  | 'advanced_reports'
  | 'bulk_autopilot'

export function featureMinTier(f: GatedFeature): PlanTierId {
  switch (f) {
    case 'full_ai':
    case 'advanced_reports':
    case 'bulk_autopilot':
      return 'professional'
    case 'white_label':
    case 'api':
      return 'enterprise'
    default:
      return 'professional'
  }
}

const TIER_ORDER: PlanTierId[] = ['starter', 'professional', 'enterprise']

export function tierAtLeast(have: PlanTierId | null | undefined, need: PlanTierId): boolean {
  if (!have) return false
  return TIER_ORDER.indexOf(have) >= TIER_ORDER.indexOf(need)
}

export function parsePlanSlug(raw: string | null | undefined): PlanTierId | null {
  if (!raw) return null
  const s = raw.toLowerCase().trim()
  if (s === 'unknown' || s === 'pending') return null
  if (s === 'starter' || s === 'price_starter') return 'starter'
  if (s === 'professional' || s === 'pro' || s === 'price_pro') return 'professional'
  if (s === 'enterprise' || s === 'price_enterprise') return 'enterprise'
  return null
}
