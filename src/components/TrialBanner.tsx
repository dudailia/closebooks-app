'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { APP_TRIAL_DAYS, getTrialStatus, TRIAL_EVENT } from '@/lib/freeTrial'

export default function TrialBanner() {
  const [status, setStatus] = useState<ReturnType<typeof getTrialStatus> | null>(null)

  useEffect(() => {
    setStatus(getTrialStatus())
    const handler = () => setStatus(getTrialStatus())
    window.addEventListener(TRIAL_EVENT, handler)
    return () => window.removeEventListener(TRIAL_EVENT, handler)
  }, [])

  if (!status) return null
  if (!status.isOnFreeTier) return null

  const { daysLeftInTrial, hasExhaustedTrial, percentUsed } = status

  if (hasExhaustedTrial) {
    return (
      <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: '#7f1d1d', color: '#fff' }}>
        <div className="flex items-center gap-2 text-sm">
          <span>🔒</span>
          <span className="font-medium">Your {APP_TRIAL_DAYS}-day trial has ended.</span>
          <span className="opacity-80 hidden sm:inline">Upgrade to keep closing clients — from $49/month.</span>
        </div>
        <Link
          href="/pricing?required=1"
          className="shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: '#fff', color: '#7f1d1d' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fee2e2' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff' }}
        >
          Upgrade now →
        </Link>
      </div>
    )
  }

  if (percentUsed === 0) {
    return (
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: '#f0f7ee', borderBottom: '1px solid #c4d9c0' }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#2d5a27' }}>
          <span>🎉</span>
          <span className="font-medium">Your {APP_TRIAL_DAYS}-day CloseBooks trial is active.</span>
          <span className="opacity-70 hidden sm:inline">No credit card required.</span>
        </div>
        <Link
          href="/dashboard/upload"
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all"
          style={{ backgroundColor: '#2d5a27' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
        >
          Start your first close
        </Link>
      </div>
    )
  }

  const isLow = daysLeftInTrial <= 3

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between gap-3 flex-wrap"
      style={{ backgroundColor: isLow ? '#fffbeb' : '#f0f7ee', borderBottom: `1px solid ${isLow ? '#fde68a' : '#c4d9c0'}` }}>
      <div className="flex items-center gap-3 text-sm">
        <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#d1fae5' }}>
          <span
            className="block h-full rounded-full"
            style={{ width: `${percentUsed}%`, backgroundColor: '#2d5a27' }}
          />
        </div>
        <span style={{ color: isLow ? '#92400e' : '#2d5a27', fontWeight: 500 }}>
          {daysLeftInTrial} trial {daysLeftInTrial === 1 ? 'day' : 'days'} remaining
        </span>
        <span className="hidden sm:inline text-xs" style={{ color: '#6b6560' }}>
          · Starter begins at $49/mo
        </span>
      </div>
      {isLow && (
        <Link
          href="/pricing?required=1"
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
          style={{ backgroundColor: '#b8734a', color: '#fff' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a0643d' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#b8734a' }}
        >
          Upgrade
        </Link>
      )}
    </div>
  )
}
