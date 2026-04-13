'use client'

import Link from 'next/link'
import { useSubscriptionSafe } from '@/contexts/SubscriptionContext'
import type { GatedFeature } from '@/lib/plans'
import { featureMinTier } from '@/lib/plans'

const LABELS: Record<GatedFeature, string> = {
  full_ai: 'Full AI categorization & review',
  white_label: 'White-label client portal',
  api: 'API access',
  advanced_reports: 'Advanced reports',
  bulk_autopilot: 'Bulk autopilot closes',
}

export default function UpgradeModal() {
  const ctx = useSubscriptionSafe()
  if (!ctx) return null
  const { showUpgradeModal, setShowUpgradeModal, upgradeFeature } = ctx
  if (!showUpgradeModal || !upgradeFeature) return null

  const need = featureMinTier(upgradeFeature)

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && setShowUpgradeModal(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{ backgroundColor: '#fff', borderColor: '#e8e0d4' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#1a1714' }}>
          Upgrade required
        </h2>
        <p className="text-sm mb-4" style={{ color: '#6b6560' }}>
          {LABELS[upgradeFeature]} requires at least the <strong>{need}</strong> plan.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm border"
            style={{ borderColor: '#e0dbd4' }}
            onClick={() => setShowUpgradeModal(false)}
          >
            Not now
          </button>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#2d5a27' }}
            onClick={() => setShowUpgradeModal(false)}
          >
            View plans
          </Link>
        </div>
      </div>
    </div>
  )
}
