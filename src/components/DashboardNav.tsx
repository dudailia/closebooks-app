'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardNav({ onHelpClick }: { onHelpClick?: () => void } = {}) {
  const path = usePathname()

  return (
    <nav
      className="border-b"
      style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
    >
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">

        {/* Logo — links to homepage */}
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
            Dashboard
          </NavLink>
          <NavLink href="/demo" active={path === '/demo'}>
            Demo
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
        </div>
      </div>
    </nav>
  )
}

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
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = '#1a1714'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = '#6b6560'
      }}
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
