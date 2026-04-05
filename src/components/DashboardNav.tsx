'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { getPendingReviewCount } from '@/lib/storage'
import type { User } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// User menu (shown when logged in)
// ─────────────────────────────────────────────────────────────────────────────

function UserMenu({ user }: { user: User }) {
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    'Account'

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative ml-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{ color: '#1a1714', backgroundColor: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        {/* Avatar circle */}
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ backgroundColor: '#b8734a' }}
        >
          {displayName[0].toUpperCase()}
        </span>
        <span className="max-w-[120px] truncate hidden sm:block" style={{ color: '#1a1714' }}>
          {displayName}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
          <path d="M2 3.5l3 3 3-3" stroke="#6b6560" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden min-w-[180px]"
            style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#f0ebe3' }}>
              <p className="text-xs font-medium truncate" style={{ color: '#1a1714' }}>{displayName}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#a09a94' }}>{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
              style={{ color: '#991b1b' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardNav({ onHelpClick }: { onHelpClick?: () => void } = {}) {
  const path = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!supabaseConfigured) return
    const supabase = createClient()
    if (!supabase) return

    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Recompute pending count on every navigation
  useEffect(() => {
    setPendingCount(getPendingReviewCount())
  }, [path])

  return (
    <nav
      className="border-b"
      style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
    >
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none">
          <LedgerIcon />
          <span
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '18px',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            <span style={{ color: '#1a1714' }}>Close</span>
            <span style={{ color: '#b8734a' }}>Books</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          <NavLink href="/dashboard" active={path === '/dashboard'}>
            <span className="flex items-center gap-1.5">
              Dashboard
              {pendingCount > 0 && (
                <span
                  className="inline-flex items-center justify-center rounded-full font-mono font-semibold text-white leading-none"
                  style={{
                    backgroundColor: '#dc2626',
                    fontSize: 10,
                    minWidth: 16,
                    height: 16,
                    padding: '0 4px',
                  }}
                  title={`${pendingCount} transaction${pendingCount !== 1 ? 's' : ''} pending review`}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink href="/dashboard/clients" active={path.startsWith('/dashboard/clients')}>
            Clients
          </NavLink>
          <NavLink href="/dashboard/analytics" active={path.startsWith('/dashboard/analytics')}>
            Analytics
          </NavLink>
          <NavLink href="/dashboard/calendar" active={path.startsWith('/dashboard/calendar')}>
            Calendar
          </NavLink>
          <NavLink href="/dashboard/network" active={path.startsWith('/dashboard/network')}>
            <span className="flex items-center gap-1">
              <NetworkNavIcon />
              Network
            </span>
          </NavLink>
          <NavLink href="/dashboard/advisory" active={path.startsWith('/dashboard/advisory')}>
            <span className="flex items-center gap-1">
              <AdvisoryNavIcon />
              Advisory
            </span>
          </NavLink>
          <NavLink href="/dashboard/radar" active={path.startsWith('/dashboard/radar')}>
            <span className="flex items-center gap-1">
              <RadarNavIcon />
              Radar
            </span>
          </NavLink>
          <NavLink href="/dashboard/inbox" active={path.startsWith('/dashboard/inbox')}>
            <span className="flex items-center gap-1">
              <InboxNavIcon />
              Inbox
            </span>
          </NavLink>
          <NavLink href="/dashboard/tax-draft" active={path.startsWith('/dashboard/tax-draft')}>
            <span className="flex items-center gap-1">
              <TaxNavIcon />
              TaxDraft
            </span>
          </NavLink>
          <NavLink href="/dashboard/billing" active={path.startsWith('/dashboard/billing')}>
            Billing
          </NavLink>
          <NavLink href="/dashboard/vault" active={path.startsWith('/dashboard/vault')}>
            Vault
          </NavLink>
          <NavLink href="/dashboard/compliance" active={path.startsWith('/dashboard/compliance')}>
            <span className="flex items-center gap-1">
              <ShieldNavIcon />
              Compliance
            </span>
          </NavLink>
          <NavLink href="/dashboard/integrations" active={path.startsWith('/dashboard/integrations')}>
            Integrations
          </NavLink>
          <NavLink href="/dashboard/developers" active={path.startsWith('/dashboard/developers')}>
            Developers
          </NavLink>
          <NavLink href="/dashboard/templates" active={path.startsWith('/dashboard/templates')}>
            Templates
          </NavLink>
          <NavLink href="/demo" active={path === '/demo'}>
            Demo
          </NavLink>
          <NavLink href="/dashboard/copilot" active={path.startsWith('/dashboard/copilot')}>
            Copilot
          </NavLink>
          <NavLink href="/dashboard/autopilot" active={path.startsWith('/dashboard/autopilot')}>
            <span className="flex items-center gap-1">
              <RocketNavIcon />
              Autopilot
            </span>
          </NavLink>
          <NavLink href="/dashboard/referrals" active={path.startsWith('/dashboard/referrals')}>
            <span className="flex items-center gap-1">
              <GiftNavIcon />
              Refer
            </span>
          </NavLink>
          <NavLink href="/dashboard/team" active={path.startsWith('/dashboard/team')}>
            Team
          </NavLink>
          <NavLink href="/dashboard/settings" active={path.startsWith('/dashboard/settings')}>
            Settings
          </NavLink>

          {onHelpClick && (
            <button
              onClick={onHelpClick}
              className="ml-1 w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold border transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea'; e.currentTarget.style.color = '#1a1714' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b6560' }}
              title="How it works"
              aria-label="Open onboarding guide"
            >
              ?
            </button>
          )}

          <Link
            href="/pricing"
            className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Upgrade
          </Link>

          <Link
            href="/dashboard/upload"
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            <PlusIcon />
            New Close
          </Link>

          {/* Auth */}
          {supabaseConfigured && (
            user
              ? <UserMenu user={user} />
              : (
                <Link
                  href="/login"
                  className="ml-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: '#6b6560', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Sign in
                </Link>
              )
          )}
        </div>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
      style={{
        color: active ? '#2d5a27' : '#6b6560',
        backgroundColor: active ? '#e8f0e6' : 'transparent',
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#1a1714' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#6b6560' }}
    >
      {children}
    </Link>
  )
}

function LedgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
      <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1v9M1 5.5h9" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function RocketNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1c0 0-2.5 2-2.5 5.5l1 1c.5-1.5 1-2.5 1.5-3 .5.5 1 1.5 1.5 3l1-1C8.5 3 6 1 6 1z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M4.5 7.5l-1.5 1.5M7.5 7.5l1.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function GiftNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="5" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M1 5h10M6 5v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6 5c0-1.5 1.5-2 1.5-2S6.5 4.5 6 5M6 5c0-1.5-1.5-2-1.5-2S5.5 4.5 6 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function NetworkNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="2" cy="2" r="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="10" cy="2" r="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="2" cy="10" r="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="10" cy="10" r="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <path d="M3 3l2 2M7 5l2-2M5 7l-2 2M7 7l2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function AdvisoryNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2 2h8a1 1 0 011 1v5a1 1 0 01-1 1H7l-2 2V9H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      <path d="M4 5h4M4 7h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function RadarNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <circle cx="6" cy="6" r="0.7" fill="currentColor" />
      <path d="M6 6L9.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function InboxNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M1 4l5 3.5L11 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" fill="none" />
    </svg>
  )
}

function TaxNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <rect x="1.5" y="1" width="7" height="10" rx="1" stroke="currentColor" strokeWidth="1.1" fill="none" />
      <path d="M3.5 4h4M3.5 6h4M3.5 8h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M8.5 7l1.5 1.5L12 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldNavIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M6 1L2 3v3c0 2.5 1.5 4.5 4 5 2.5-.5 4-2.5 4-5V3L6 1z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      <path d="M4 6l1.5 1.5L8 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
