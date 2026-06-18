export type TierId = 'starter' | 'professional' | 'enterprise'

export interface Tier {
  id: TierId
  name: string
  tagline: string
  monthly: number
  clients: string
  users: string
  features: string[]
  popular?: boolean
}

export const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo CPAs testing the waters',
    monthly: 49,
    clients: '10 clients',
    users: '1 seat',
    features: [
      'Up to 10 clients',
      '1 seat',
      'AI categorization',
      'CSV import & export',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For growing firms running multiple closes',
    monthly: 149,
    clients: '50 clients',
    users: '5 seats',
    popular: true,
    features: [
      'Up to 50 clients',
      '5 seats',
      'Full AI + rules engine',
      'Autonomous close agent',
      'Narrative insights',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For established firms with custom needs',
    monthly: 349,
    clients: 'Unlimited clients',
    users: 'Unlimited seats',
    features: [
      'Unlimited clients',
      'Unlimited seats',
      'White-label portal',
      'API access',
      'Priority onboarding by request',
      'Firm setup assistance',
    ],
  },
]

export function priceEnvKey(tier: TierId, annual: boolean): string {
  const a = annual ? 'YEAR' : 'MONTH'
  const map: Record<TierId, string> = {
    starter: `NEXT_PUBLIC_STRIPE_PRICE_STARTER_${a}`,
    professional: `NEXT_PUBLIC_STRIPE_PRICE_PRO_${a}`,
    enterprise: `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_${a}`,
  }
  return map[tier]
}

export function resolvePriceId(tier: TierId, annual: boolean): string | undefined {
  const v = process.env[priceEnvKey(tier, annual) as keyof NodeJS.ProcessEnv]
  return typeof v === 'string' && v && !v.startsWith('your_') ? v : undefined
}

export function annualTotal(monthly: number): number {
  return Math.round(monthly * 0.8 * 12)
}
