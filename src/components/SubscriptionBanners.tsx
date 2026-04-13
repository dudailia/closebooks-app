'use client'

import Link from 'next/link'
import { useSubscriptionSafe } from '@/contexts/SubscriptionContext'

export default function SubscriptionBanners() {
  const ctx = useSubscriptionSafe()
  if (!ctx || ctx.loading) return null

  const { subscription } = ctx

  if (subscription.paymentFailedAt && subscription.gracePeriodEnd) {
    const end = new Date(subscription.gracePeriodEnd)
    if (end.getTime() > Date.now()) {
      return (
        <div
          className="w-full px-4 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2"
          style={{ backgroundColor: '#fef3c7', color: '#92400e', borderBottom: '1px solid #fcd34d' }}
        >
          <span>
            Payment failed — update your card by{' '}
            <strong>{end.toLocaleDateString()}</strong> to avoid losing access.
          </span>
          <Link href="/dashboard/subscription" className="font-semibold underline">
            Fix billing
          </Link>
        </div>
      )
    }
  }

  if (subscription.isTrialing && subscription.daysLeftInTrial != null && subscription.daysLeftInTrial <= 14) {
    return (
      <div
        className="w-full px-4 py-2 text-sm flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderBottom: '1px solid #bfdbfe' }}
      >
        <span>
          Trial: <strong>{subscription.daysLeftInTrial}</strong> day{subscription.daysLeftInTrial === 1 ? '' : 's'} left
          {subscription.tier ? ` · ${subscription.tier}` : ''}
        </span>
        <Link href="/pricing" className="font-semibold underline">
          View plans
        </Link>
      </div>
    )
  }

  return null
}
