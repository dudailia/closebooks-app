'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PortalShellProps {
  token: string
  firmName: string
  accentColor: string
  clientName: string
  permissions: string[]
  children: React.ReactNode
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function FolderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}
function ReportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

export default function PortalShell({
  token,
  firmName,
  accentColor,
  clientName,
  permissions,
  children,
}: PortalShellProps) {
  const pathname = usePathname()
  const base = `/portal/${token}`

  const navItems = [
    { label: 'Home', href: base, icon: HomeIcon, always: true },
    { label: 'Documents', href: `${base}/documents`, icon: FolderIcon, permission: 'upload_documents' },
    { label: 'Messages', href: `${base}/messages`, icon: ChatIcon, permission: 'send_messages' },
    { label: 'Reports', href: `${base}/reports`, icon: ReportIcon, permission: 'view_reports' },
    { label: 'Actions', href: `${base}/actions`, icon: CheckIcon, permission: 'approve_items' },
  ].filter(item => item.always || permissions.includes(item.permission!))

  function isActive(href: string) {
    if (href === base) return pathname === base
    return pathname.startsWith(href)
  }

  return (
    <div style={{ background: '#faf8f4', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)', ['--accent' as string]: accentColor }}>
      {/* Desktop top nav */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #e8e0d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714', fontWeight: 400 }}>{firmName}</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block' }} />
        </div>

        {/* Desktop tabs — hidden on mobile */}
        <div style={{ display: 'flex', gap: 4 }} className="portal-desktop-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive(item.href) ? 600 : 400,
                color: isActive(item.href) ? accentColor : '#6b6560',
                background: isActive(item.href) ? `${accentColor}15` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ fontSize: 14, color: '#6b6560', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clientName}
        </div>
      </nav>

      {/* Page content */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 96px' }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: '#ffffff',
        borderTop: '1px solid #e8e0d4',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }} className="portal-mobile-nav">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '8px 4px',
                color: active ? accentColor : '#9ca3af',
                textDecoration: 'none',
                minHeight: 56,
              }}
            >
              <Icon />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 640px) {
          .portal-mobile-nav { display: none !important; }
          .portal-desktop-nav { display: flex !important; }
        }
        @media (max-width: 639px) {
          .portal-desktop-nav { display: none !important; }
          .portal-mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
