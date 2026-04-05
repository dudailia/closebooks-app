'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { getPendingReviewCount } from '@/lib/storage'
import type { User } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string
  label: string
  icon: () => React.ReactElement
  exact?: boolean
  badge?: number
  badgeColor?: string
}

interface NavSection {
  id: string
  label: string | null
  items: NavItem[]
}

// ─── Nav structure ────────────────────────────────────────────────────────────

function buildSections(pendingCount: number): NavSection[] {
  return [
    {
      id: 'main',
      label: null,
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: HomeIcon, exact: true },
        {
          href: '/dashboard/upload',
          label: 'New Close',
          icon: PlusIcon,
          badge: pendingCount > 0 ? pendingCount : undefined,
          badgeColor: '#dc2626',
        },
      ],
    },
    {
      id: 'clients',
      label: 'CLIENTS',
      items: [
        { href: '/dashboard/clients',  label: 'Clients',  icon: UsersIcon },
        { href: '/dashboard/calendar', label: 'Calendar', icon: CalendarIcon },
      ],
    },
    {
      id: 'ai',
      label: 'AI TOOLS',
      items: [
        { href: '/dashboard/copilot',       label: 'Copilot',       icon: SparkleIcon },
        { href: '/dashboard/autopilot',     label: 'Autopilot',     icon: RocketIcon },
        { href: '/dashboard/agent',         label: 'Agent Mode',    icon: AgentIcon },
        { href: '/dashboard/predict',       label: 'Predict Close', icon: PredictIcon },
        { href: '/dashboard/radar',         label: 'Radar',         icon: RadarIcon },
        { href: '/dashboard/tax-draft',     label: 'TaxDraft',      icon: TaxIcon },
        { href: '/dashboard/tax-strategy',  label: 'Tax Strategy',  icon: TaxStrategyIcon },
        { href: '/dashboard/1099',          label: '1099 Filing',   icon: Form1099Icon },
        { href: '/dashboard/audit-defense', label: 'Audit Defense', icon: AuditIcon },
      ],
    },
    {
      id: 'documents',
      label: 'DOCUMENTS',
      items: [
        { href: '/dashboard/vault',     label: 'Vault',     icon: VaultIcon },
        { href: '/dashboard/inbox',     label: 'Inbox',     icon: InboxIcon },
        { href: '/dashboard/templates', label: 'Templates', icon: FileIcon },
      ],
    },
    {
      id: 'insights',
      label: 'INSIGHTS',
      items: [
        { href: '/dashboard/analytics',  label: 'Analytics',  icon: ChartIcon },
        { href: '/dashboard/network',    label: 'Network',    icon: NetworkIcon },
        { href: '/dashboard/advisory',   label: 'Advisory',   icon: MessageIcon },
        { href: '/dashboard/compliance', label: 'Compliance', icon: ShieldIcon },
      ],
    },
    {
      id: 'growth',
      label: 'GROWTH',
      items: [
        { href: '/dashboard/portal',        label: 'Client Portal', icon: PortalIcon },
        { href: '/dashboard/whitelabel',    label: 'White-Label',   icon: WhitelabelIcon },
        { href: '/dashboard/voice',         label: 'Voice AI',      icon: VoiceIcon },
        { href: '/dashboard/profile',       label: 'My Profile',    icon: ProfileIcon },
        { href: '/dashboard/connect',       label: 'Connect API',   icon: ApiIcon },
        { href: '/dashboard/certification', label: 'Certification', icon: CertIcon },
        { href: '/dashboard/referrals',     label: 'Refer & Earn',  icon: GiftIcon },
      ],
    },
    {
      id: 'admin',
      label: 'ADMIN',
      items: [
        { href: '/dashboard/billing',      label: 'Billing',      icon: CreditCardIcon },
        { href: '/dashboard/team',         label: 'Team',         icon: TeamIcon },
        { href: '/dashboard/settings',     label: 'Settings',     icon: GearIcon },
        { href: '/dashboard/integrations', label: 'Integrations', icon: PlugIcon },
        { href: '/dashboard/developers',   label: 'Developers',   icon: CodeIcon },
      ],
    },
  ]
}

// ─── Sidebar item ─────────────────────────────────────────────────────────────

function SidebarItem({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '8px 0' : '7px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        textDecoration: 'none',
        position: 'relative',
        backgroundColor: active ? '#e8f0e6' : 'transparent',
        borderLeft: active ? '3px solid #2d5a27' : '3px solid transparent',
        color: active ? '#2d5a27' : '#6b6560',
        fontWeight: active ? 600 : 400,
        fontSize: 13,
        transition: 'background-color 0.12s, color 0.12s',
        marginBottom: 1,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f5f0ea'
          e.currentTarget.style.color = '#1a1714'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#6b6560'
        }
      }}
    >
      {/* Icon */}
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', position: 'relative' }}>
        <item.icon />
        {item.badge != null && item.badge > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -5,
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: item.badgeColor ?? '#dc2626',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
          }}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        maxWidth: collapsed ? 0 : 160,
        opacity: collapsed ? 0 : 1,
        transition: 'max-width 0.18s ease, opacity 0.12s ease',
        display: 'block',
      }}>
        {item.label}
      </span>
    </Link>
  )
}

// ─── User menu ────────────────────────────────────────────────────────────────

function UserFooter({ user, collapsed }: { user: User | null; collapsed: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const name = (user?.user_metadata?.full_name as string | undefined)
    || user?.email?.split('@')[0]
    || 'Account'
  const initials = name.slice(0, 2).toUpperCase()

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title={collapsed ? name : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: collapsed ? '8px 0' : '8px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderRadius: 8,
          textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: '#b8734a',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {user ? initials : '?'}
        </span>
        <span style={{
          overflow: 'hidden',
          maxWidth: collapsed ? 0 : 140,
          opacity: collapsed ? 0 : 1,
          transition: 'max-width 0.18s ease, opacity 0.12s ease',
          minWidth: 0,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1714', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user ? name : 'Sign in'}
          </div>
          {user?.email && (
            <div style={{ fontSize: 11, color: '#a09a94', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          )}
        </span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 8,
            right: 8,
            zIndex: 20,
            backgroundColor: '#fff',
            border: '1px solid #e8e0d4',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            overflow: 'hidden',
            marginBottom: 4,
          }}>
            {user ? (
              <>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0ebe3' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1714' }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#a09a94', marginTop: 1 }}>{user.email}</div>
                </div>
                <button
                  onClick={signOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '10px 14px', border: 'none',
                    background: 'none', cursor: 'pointer', fontSize: 13, color: '#991b1b',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <SignOutIcon /> Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                style={{ display: 'block', padding: '10px 14px', fontSize: 13, color: '#2d5a27', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign in →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('cb_sidebar_collapsed')
    const isCollapsed = saved === 'true'
    if (isCollapsed) setCollapsed(true)
    document.documentElement.style.setProperty('--sb-width', isCollapsed ? '52px' : '220px')
  }, [])

  useEffect(() => {
    localStorage.setItem('cb_sidebar_collapsed', String(collapsed))
    document.documentElement.style.setProperty('--sb-width', collapsed ? '52px' : '220px')
  }, [collapsed])

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Auth
  useEffect(() => {
    if (!supabaseConfigured) return
    const supabase = createClient()
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Pending count
  useEffect(() => {
    setPendingCount(getPendingReviewCount())
  }, [pathname])

  const sections = buildSections(pendingCount)
  const W = collapsed ? 52 : 220

  const sidebarContent = (
    <aside style={{
      width: W,
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e8e0d4',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflowX: 'hidden',
      overflowY: 'auto',
      flexShrink: 0,
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 30,
    }}>

      {/* Logo + collapse toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '14px 0' : '14px 12px 14px 14px',
        borderBottom: '1px solid #f0ebe3',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}
          title={collapsed ? 'CloseBooks' : undefined}
        >
          <LedgerLogo />
          <span style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 16,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            maxWidth: collapsed ? 0 : 120,
            opacity: collapsed ? 0 : 1,
            transition: 'max-width 0.18s ease, opacity 0.12s ease',
          }}>
            <span style={{ color: '#1a1714' }}>Close</span>
            <span style={{ color: '#b8734a' }}>Books</span>
          </span>
        </Link>

        {/* Collapse toggle */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            style={{
              width: 24, height: 24, borderRadius: 6, border: 'none',
              background: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#a09a94', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.backgroundColor = '#f5f0ea' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#a09a94'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ChevronLeftIcon />
          </button>
        )}
      </div>

      {/* Expand button (collapsed state only) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          style={{
            width: '100%', padding: '8px 0', border: 'none',
            background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a09a94', borderBottom: '1px solid #f0ebe3',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.backgroundColor = '#f5f0ea' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#a09a94'; e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* Nav sections */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 4px' : '8px 10px' }}>
        {sections.map((section, si) => (
          <div key={section.id} style={{ marginTop: si === 0 ? 0 : 20 }}>
            {section.label && !collapsed && (
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#a09a94',
                textTransform: 'uppercase',
                padding: '0 4px',
                marginBottom: 4,
              }}>
                {section.label}
              </div>
            )}
            {section.label && collapsed && (
              <div style={{ height: 1, backgroundColor: '#f0ebe3', margin: '0 4px 8px' }} />
            )}
            {section.items.map(item => (
              <SidebarItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #f0ebe3',
        padding: collapsed ? '8px 4px' : '10px',
        flexShrink: 0,
      }}>
        {/* Upgrade */}
        <Link
          href="/pricing"
          title={collapsed ? 'Upgrade' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: collapsed ? '7px 0' : '8px',
            borderRadius: 8,
            backgroundColor: '#b8734a',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            marginBottom: 8,
            transition: 'background-color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a05e3a' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#b8734a' }}
        >
          <UpgradeIcon />
          <span style={{
            overflow: 'hidden', whiteSpace: 'nowrap',
            maxWidth: collapsed ? 0 : 120,
            opacity: collapsed ? 0 : 1,
            transition: 'max-width 0.18s ease, opacity 0.12s ease',
          }}>
            Upgrade
          </span>
        </Link>

        {/* User */}
        <UserFooter user={user} collapsed={collapsed} />
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ flexShrink: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 40,
          width: 36, height: 36, borderRadius: 8,
          border: '1px solid #e8e0d4',
          backgroundColor: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#1a1714',
        }}
      >
        <HamburgerIcon />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 35 }}
            onClick={() => setMobileOpen(false)}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}

// ─── Icons (all 16×16, stroke="currentColor") ─────────────────────────────────

function LedgerLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
      <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
function HomeIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 7l6-5 6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/><path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function UsersIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M1 13c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity=".6"/><path d="M14 13c0-1.5-1-2.5-2-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".6"/></svg> }
function CalendarIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M1.5 6.5h13M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function SparkleIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 10l-4 2.5 1.5-4.5L2 5.5h4.5L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/></svg> }
function RocketIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2s-3 2.5-3 7l1.5 1.5c.5-2 1.5-3.5 1.5-3.5s1 1.5 1.5 3.5L11 9c0-4.5-3-7-3-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/><path d="M5 9.5l-2 2M11 9.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg> }
function RadarIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="8" cy="8" r="1" fill="currentColor"/><path d="M8 8L12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".5"/></svg> }
function TaxIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="9" height="13" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M4 5h5M4 7.5h5M4 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M11 9l2 2M13 9l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function VaultIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="8" cy="8" r="1" fill="currentColor"/><path d="M8 5.5V4M8 12v-1.5M5.5 8H4M12 8h-1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg> }
function InboxIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M1.5 9.5h3l1.5 2h4l1.5-2h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4.5 6l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FileIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> }
function ChartIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1.5 12.5h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3.5 12.5V8M7 12.5V5M10.5 12.5V7.5M14 12.5V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function NetworkIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="3" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.1" fill="none"/><circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.1" fill="none"/><path d="M4.5 4.5l2 2M9.5 6l2-2M6 9.5l-2 2M10 9.5l2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg> }
function MessageIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 2h12a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 2.5V11H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><path d="M4.5 6h7M4.5 8.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> }
function ShieldIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 4v4c0 3.5 2 5.5 6 7 4-1.5 6-3.5 6-7V4L8 1.5z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><path d="M5.5 8l2 2L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CreditCardIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3"/><path d="M4 9.5h2M9 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function TeamIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg> }
function GearIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function PlugIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 9l-3.5 3.5M5 2v4M11 2v4M4 6h8a0 0 0 010 4H4a0 0 0 010-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg> }
function CodeIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function GiftIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="6" width="13" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M1.5 6h13M8 6v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 6c0-2 1.5-3 2-2.5S8.5 5.5 8 6M8 6c0-2-1.5-3-2-2.5S7.5 5.5 8 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg> }
function UpgradeIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2l3.5 4H8v6H6V6H3.5L7 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/></svg> }
function ChevronLeftIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevronRightIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function HamburgerIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function SignOutIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AgentIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/><path d="M11 2l1.5 1.5M13 4l-1.5-1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity=".6"/><circle cx="12.5" cy="2.5" r="1" fill="currentColor" opacity=".5"/></svg> }
function PredictIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 13l3-4 2.5 2 3-5 3.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M13 5v3M13 5h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function PortalIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.5" cy="9.5" r="1" fill="currentColor"/><path d="M7 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function WhitelabelIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M5 5h6M5 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M1.5 5h13" stroke="currentColor" strokeWidth="1.1" opacity=".4"/><circle cx="3.5" cy="3.5" r=".8" fill="currentColor" opacity=".5"/></svg> }
function VoiceIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="1.5" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M3 8c0 2.8 2.2 5 5 5s5-2.2 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/><path d="M8 13v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function TaxStrategyIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 12l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="13" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1.1" fill="none"/></svg> }
function Form1099Icon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="9" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M4 5h5M4 7.5h5M4 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><path d="M11 9.5l2 2M13 9.5l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function AuditIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 4v3.5c0 3.5 2.5 5.5 6 7 3.5-1.5 6-3.5 6-7V4L8 1.5z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round"/><path d="M5.5 7.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ProfileIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/><path d="M11.5 2.5l1 1M13 4l-1-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".5"/></svg> }
function ApiIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12v8H2z" stroke="currentColor" strokeWidth="1.2" fill="none" rx="1.5"/><path d="M4.5 8l1.5-1.5L7.5 8 6 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 6.5h3M9 9.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> }
function CertIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M5.5 7l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 11l-1 3L8 13l3.5 1-1-3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fill="none"/></svg> }
