'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
      { href: '/security', label: 'Security' },
      { href: '/tools/roi-calculator', label: 'ROI Calculator' },
      { href: '/connect/docs', label: 'API Docs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
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
        borderTop: '1px solid #1f1f1f',
        padding: '72px 0 40px',
        position: 'relative',
      }}
    >
      {/* Top edge glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -1,
          left: '30%',
          right: '30%',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(0,200,83,0.3), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.4fr) repeat(auto-fit, minmax(130px, 1fr))',
            gap: 48,
            marginBottom: 60,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#00C853',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(0,200,83,0.3)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 13V8M6 13V5M9 13V3M12 13V7" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 400,
                  color: '#FAFAFA',
                  letterSpacing: '-0.02em',
                }}
              >
                CloseBooks
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#888888', margin: 0, maxWidth: 280, fontFamily: 'var(--font-sans)' }}>
              Month-end close software for CPA firms building AI-first workflows.
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
                  color: '#444444',
                  margin: 0,
                  marginBottom: 16,
                  fontFamily: 'var(--font-sans)',
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
                        color: '#888888',
                        textDecoration: 'none',
                        transition: 'color 150ms',
                        fontFamily: 'var(--font-sans)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#FAFAFA')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
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
            borderTop: '1px solid #1f1f1f',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <p style={{ fontSize: 12, color: '#444444', margin: 0, fontFamily: 'var(--font-sans)' }}>
            © {new Date().getFullYear()} CloseBooks. Crafted for finance teams.
          </p>
          <p style={{ fontSize: 12, color: '#444444', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Built on{' '}
            <a href="https://vercel.com" style={{ color: '#888888', textDecoration: 'none', transition: 'color 150ms' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FAFAFA')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
            >
              Vercel
            </a>{' '}
            · Powered by{' '}
            <span style={{ color: '#00C853' }}>Claude</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
