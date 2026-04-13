'use client'

import { useEffect } from 'react'
import { syncSubscriptionFromServer } from '@/lib/subscriptionSync'

/** After login, align local trial/plan with Stripe-backed Supabase row. */
export default function SubscriptionSync() {
  useEffect(() => {
    void syncSubscriptionFromServer()
  }, [])
  return null
}
