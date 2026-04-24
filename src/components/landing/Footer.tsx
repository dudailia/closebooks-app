'use client'
import Link from 'next/link'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#features', label: 'Features' },
      { href: '#pricing', label: 'Pricing' },
      { href: '/install', label: 'Install' },
      { href: '/demo', label: 'Demo' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/changelog', label: 'Changelog' },
      { href: '/security', label: 'Security' },
      { href: '/status', label: 'Status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/cpa-council', label: 'CPA Council' },
      { href: '/careers', label: 'Careers' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/dpa', label: 'DPA' },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '72px 0 40px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.4fr) repeat(auto-fit, minmax(140px, 1fr))',
            gap: 48,
            marginBottom: 56,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00110A',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                C
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 20,
                  fontWeight: 400,
                  color: '#F0F0F5',
                  letterSpacing: '-0.02em',
                }}
              >
                CloseBooks
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: '#A8A8BC', margin: 0, maxWidth: 300 }}>
              The AI co-pilot for month-end close. Built with CPAs, for CPAs.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#6E6E85',
                  margin: 0,
                  marginBottom: 14,
                }}
              >
                {c.title}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {c.links.map((l) => (
                  <li key={l.href} style={{ marginBottom: 10 }}>
                    <Link
                      href={l.href}
                      style={{
                        fontSize: 13,
                        color: '#A8A8BC',
                        textDecoration: 'none',
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0F5')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#A8A8BC')}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <p style={{ fontSize: 12, color: '#6E6E85', margin: 0 }}>
            © {new Date().getFullYear()} CloseBooks. Crafted for finance teams.
          </p>
          <p style={{ fontSize: 12, color: '#6E6E85', margin: 0 }}>
            Built on{' '}
            <a href="https://vercel.com" style={{ color: '#A8A8BC', textDecoration: 'none' }}>
              Vercel
            </a>{' '}
            · Powered by Claude
          </p>
        </div>
      </div>
    </footer>
  )
}
