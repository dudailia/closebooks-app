'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { SubscriptionState } from '@/lib/subscriptionTypes'
import { EMPTY_SUBSCRIPTION } from '@/lib/subscriptionTypes'
import {
  featureMinTier,
  tierAtLeast,
  type GatedFeature,
} from '@/lib/plans'
import { activatePlan } from '@/lib/freeTrial'

interface SubscriptionContextValue {
  subscription: SubscriptionState
  loading: boolean
  refresh: () => Promise<void>
  canAccessFeature: (feature: GatedFeature) => boolean
  showUpgradeModal: boolean
  setShowUpgradeModal: (v: boolean) => void
  upgradeFeature: GatedFeature | null
  setUpgradeFeature: (f: GatedFeature | null) => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(EMPTY_SUBSCRIPTION)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<GatedFeature | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription', { cache: 'no-store' })
      if (!res.ok) {
        setSubscription(EMPTY_SUBSCRIPTION)
        return
      }
      const data = (await res.json()) as { subscription: SubscriptionState }
      const sub = data.subscription ?? EMPTY_SUBSCRIPTION
      setSubscription(sub)
      const t = sub.tier
      if (t === 'starter') activatePlan('starter')
      else if (t === 'professional') activatePlan('growth')
      else if (t === 'enterprise') activatePlan('scale')
    } catch {
      setSubscription(EMPTY_SUBSCRIPTION)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof window === 'undefined' || pathname !== '/dashboard') return
    const q = new URLSearchParams(window.location.search)
    if (q.get('checkout') !== 'success') return
    void refresh()
    const t = document.createElement('div')
    t.className = 'fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white'
    t.style.backgroundColor = '#2d5a27'
    t.textContent = 'Subscription active — welcome to CloseBooks!'
    document.body.appendChild(t)
    setTimeout(() => t.remove(), 5000)
    router.replace('/dashboard', { scroll: false })
  }, [pathname, router, refresh])

  const canAccessFeature = useCallback(
    (feature: GatedFeature) => {
      const need = featureMinTier(feature)
      return tierAtLeast(subscription.tier, need)
    },
    [subscription.tier]
  )

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      loading,
      refresh,
      canAccessFeature,
      showUpgradeModal,
      setShowUpgradeModal,
      upgradeFeature,
      setUpgradeFeature,
    }),
    [
      subscription,
      loading,
      refresh,
      canAccessFeature,
      showUpgradeModal,
      upgradeFeature,
    ]
  )

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return ctx
}

export function useSubscriptionSafe(): SubscriptionContextValue | null {
  return useContext(SubscriptionContext)
}
