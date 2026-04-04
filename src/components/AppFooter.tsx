import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer
      className="border-t mt-auto"
      style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
    >
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none shrink-0">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
              <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
              <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
              <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: 16,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#1a1714' }}>Close</span>
              <span style={{ color: '#b8734a' }}>Books</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { href: '/',              label: 'Home'      },
              { href: '/#features',    label: 'Features'  },
              { href: '/pricing',      label: 'Pricing'   },
              { href: '/dashboard',    label: 'Dashboard' },
              { href: '/portal/demo',  label: 'Portal'    },
              { href: '/demo',         label: 'Demo'      },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-colors"
                style={{ color: '#a09a94' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#a09a94' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div
          className="mt-6 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t"
          style={{ borderColor: '#f0ece4' }}
        >
          <p className="text-xs" style={{ color: '#c4bdb8' }}>
            © 2026 CloseBooks · Built at Northeastern University
          </p>
          <p className="text-xs" style={{ color: '#c4bdb8' }}>
            Made for CPAs who deserve better tools.
          </p>
        </div>
      </div>
    </footer>
  )
}
