'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTrialStatus, FREE_CLOSES } from '@/lib/freeTrial'

export default function TrialBanner() {
  const [status, setStatus] = useState<ReturnType<typeof getTrialStatus> | null>(null)

  useEffect(() => {
    setStatus(getTrialStatus())
    // Re-check when localStorage changes (e.g. after a close is recorded)
    const handler = () => setStatus(getTrialStatus())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  if (!status) return null
  if (!status.isOnFreeTier) return null

  const { closesUsed, closesRemaining, hasExhaustedTrial } = status

  if (hasExhaustedTrial) {
    return (
      <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: '#7f1d1d', color: '#fff' }}>
        <div className="flex items-center gap-2 text-sm">
          <span>🔒</span>
          <span className="font-medium">You&apos;ve used all {FREE_CLOSES} free closes.</span>
          <span className="opacity-80 hidden sm:inline">Upgrade to keep going — from $99/month.</span>
        </div>
        <Link
          href="/pricing"
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

  if (closesUsed === 0) {
    return (
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: '#f0f7ee', borderBottom: '1px solid #c4d9c0' }}>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#2d5a27' }}>
          <span>🎉</span>
          <span className="font-medium">Your first {FREE_CLOSES} closes are free.</span>
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

  const remaining = closesRemaining
  const isLow = remaining <= 1

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between gap-3 flex-wrap"
      style={{ backgroundColor: isLow ? '#fffbeb' : '#f0f7ee', borderBottom: `1px solid ${isLow ? '#fde68a' : '#c4d9c0'}` }}>
      <div className="flex items-center gap-3 text-sm">
        {/* Progress dots */}
        <div className="flex gap-1">
          {Array.from({ length: FREE_CLOSES }, (_, i) => (
            <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i < closesUsed ? '#2d5a27' : '#d1fae5' }} />
          ))}
        </div>
        <span style={{ color: isLow ? '#92400e' : '#2d5a27', fontWeight: 500 }}>
          {remaining} free {remaining === 1 ? 'close' : 'closes'} remaining
        </span>
        <span className="hidden sm:inline text-xs" style={{ color: '#6b6560' }}>
          · Upgrade any time from $99/mo
        </span>
      </div>
      {isLow && (
        <Link
          href="/pricing"
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
