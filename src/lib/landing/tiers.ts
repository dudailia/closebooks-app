import { FEATURES, isDashboardRouteVisible } from '@/lib/features'

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

// Bullets for features hidden in the demo build (src/lib/features.ts) drop out with them.
const when = (visible: boolean, label: string): string[] => (visible ? [label] : [])

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
      ...when(FEATURES.reviewAutoClose, 'Autonomous close agent'),
      ...when(FEATURES.reviewNarrative, 'Narrative insights'),
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
      ...when(isDashboardRouteVisible('/dashboard/whitelabel'), 'White-label portal'),
      ...when(isDashboardRouteVisible('/dashboard/developers'), 'API access'),
      'Priority onboarding by request',
    ],
  },
]

// Price-id env vars must be referenced as LITERAL `process.env.NEXT_PUBLIC_*`
// expressions. Next.js only inlines statically-written NEXT_PUBLIC_* vars into
// the client bundle; a computed `process.env[key]` resolves to undefined in the
// browser (that dynamic lookup is what broke the pricing CTA — it rendered the
// signup-link fallback after hydration). Keep these static.
const PRICE_ENV: Record<TierId, { month: string | undefined; year: string | undefined }> = {
  starter: {
    month: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTH,
    year:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEAR,
  },
  professional: {
    month: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTH,
    year:  process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEAR,
  },
  enterprise: {
    month: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTH,
    year:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEAR,
  },
}

export function resolvePriceId(tier: TierId, annual: boolean): string | undefined {
  const v = PRICE_ENV[tier][annual ? 'year' : 'month']
  // Unchanged: missing, empty, or a `your_…` placeholder all count as unconfigured.
  return typeof v === 'string' && v && !v.startsWith('your_') ? v : undefined
}

export function annualTotal(monthly: number): number {
  return Math.round(monthly * 0.8 * 12)
}
