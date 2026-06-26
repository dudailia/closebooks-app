'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

// ─── Route label map ──────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  dashboard:    'Dashboard',
  upload:       'New Close',
  review:       'Review',
  clients:      'Clients',
  calendar:     'Calendar',
  copilot:      'Copilot',
  autopilot:    'Autopilot',
  radar:        'Radar',
  'tax-draft':  'TaxDraft',
  vault:        'Vault',
  inbox:        'Inbox',
  templates:    'Templates',
  analytics:    'Analytics',
  network:      'Network',
  advisory:     'Advisory',
  compliance:   'Compliance',
  billing:      'Billing',
  team:         'Team',
  settings:     'Settings',
  integrations: 'Integrations',
  developers:   'Developers',
  referrals:    'Refer & Earn',
  requests:     'Document Requests',
  messages:     'Messages',
  time:         'Time Tracking',
  'bulk-close': 'Bulk Close',
  'close-report': 'Close Report',
  run:          'Live Close',
  new:          'New Return',
  benchmarks:   'Benchmarks',
  insights:     'Insights',
  pulse:        'Pulse',
  setup:        'Setup',
  growth:       'Growth',
  pipeline:     'Pipeline',
  subscription: 'Subscription',
}

function isUUID(s: string) {
  return /^[0-9a-f-]{8,}$/i.test(s)
}

function segmentLabel(seg: string): string {
  if (isUUID(seg)) return ''
  // kebab-case slug like "smith-2024" → "Smith 2024"
  if (LABELS[seg]) return LABELS[seg]
  return seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function TopBar() {
  const pathname = usePathname()

  // Build breadcrumb from path segments after /dashboard
  const parts = pathname.split('/').filter(Boolean).slice(1) // remove 'dashboard'
  const crumbs: { label: string; href: string }[] = []
  let acc = '/dashboard'
  for (const seg of parts) {
    acc += '/' + seg
    const label = segmentLabel(seg)
    if (label) crumbs.push({ label, href: acc })
  }

  const isUpload = pathname === '/dashboard/upload'

  return (
    <header style={{
      height: 48,
      backgroundColor: '#080808',
      borderBottom: '1px solid #1f1f1f',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 56, // leaves room for mobile hamburger
      paddingRight: 20,
      gap: 8,
      flexShrink: 0,
    }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: '#888888', textDecoration: 'none', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FAFAFA' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#888888' }}
        >
          CloseBooks
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span style={{ color: '#444444', fontSize: 13 }}>›</span>
            {i === crumbs.length - 1 ? (
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} style={{ fontSize: 13, color: '#888888', textDecoration: 'none', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FAFAFA' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#888888' }}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <NotificationBell />
        {!isUpload && (
          <Link
            href="/dashboard/upload"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              backgroundColor: '#00C853',
              color: '#000',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              boxShadow: '0 0 16px rgba(0,200,83,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#00d95a' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00C853' }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New Close
          </Link>
        )}
      </div>
    </header>
  )
}
