'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import FirmCard from '@/components/FirmCard'
import { DEMO_FIRMS, INDUSTRIES } from '@/lib/directoryData'

// ─────────────────────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
        <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
        <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: '18px',
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        <span style={{ color: '#FAFAFA' }}>Close</span>
        <span style={{ color: '#b8734a' }}>Books</span>
      </span>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Top nav (marketing layout)
// ─────────────────────────────────────────────────────────────────────────────

function TopNav() {
  return (
    <nav
      style={{
        backgroundColor: '#080808',
        borderBottom: '1px solid #1f1f1f',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link
            href="/pricing"
            style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#FAFAFA',
              textDecoration: 'none',
              padding: '7px 16px',
              borderRadius: 9,
              border: '1px solid #1f1f1f',
              backgroundColor: '#0f0f0f',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#141414' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f0f0f' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter sidebar
// ─────────────────────────────────────────────────────────────────────────────

const US_STATES = [
  'AZ','CA','CO','FL','GA','IL','MI','MN','MO','NC','NY','OH','OR','PA','TN','TX','WA',
]

interface Filters {
  industry: string
  state: string
  service: string
  minRating: number
}

function FilterSidebar({
  filters,
  onChange,
  totalResults,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  totalResults: number
}) {
  const SERVICES = ['Bookkeeping', 'Tax Prep', 'Audit', 'Advisory', 'Payroll', '1099 Filing']

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div
        style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid #1f1f1f',
          borderRadius: 14,
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#FAFAFA' }}>Filters</p>
          {(filters.industry || filters.state || filters.service || filters.minRating > 0) && (
            <button
              onClick={() => onChange({ industry: '', state: '', service: '', minRating: 0 })}
              style={{
                fontSize: '11px',
                color: '#b8734a',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Industry */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Industry
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => onChange({ ...filters, industry: filters.industry === ind ? '' : ind })}
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: filters.industry === ind ? 'rgba(0,200,83,0.1)' : 'transparent',
                  color: filters.industry === ind ? '#00C853' : '#888888',
                  border: 'none',
                  fontWeight: filters.industry === ind ? 600 : 400,
                  transition: 'all 0.12s ease',
                }}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Location
          </p>
          <select
            value={filters.state}
            onChange={(e) => onChange({ ...filters, state: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #1f1f1f',
              backgroundColor: '#141414',
              color: '#FAFAFA',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Services */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Services
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SERVICES.map((svc) => (
              <button
                key={svc}
                onClick={() => onChange({ ...filters, service: filters.service === svc ? '' : svc })}
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: filters.service === svc ? 'rgba(0,200,83,0.1)' : 'transparent',
                  color: filters.service === svc ? '#00C853' : '#888888',
                  border: 'none',
                  fontWeight: filters.service === svc ? 600 : 400,
                  transition: 'all 0.12s ease',
                }}
              >
                {svc}
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Min. Rating
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[0, 4.7, 4.8, 4.9].map((r) => (
              <button
                key={r}
                onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? 0 : r })}
                style={{
                  textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: filters.minRating === r && r > 0 ? 'rgba(0,200,83,0.1)' : 'transparent',
                  color: filters.minRating === r && r > 0 ? '#00C853' : '#888888',
                  border: 'none',
                  fontWeight: filters.minRating === r && r > 0 ? 600 : 400,
                  transition: 'all 0.12s ease',
                }}
              >
                {r === 0 ? 'Any rating' : `${r}+ ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(0,200,83,0.06)',
          border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: 14,
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#00C853', margin: '0 0 4px', fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
          {totalResults}
        </p>
        <p style={{ fontSize: '12px', color: '#888888' }}>
          {totalResults === 1 ? 'firm matches' : 'firms match'} your criteria
        </p>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({
    industry: '',
    state: '',
    service: '',
    minRating: 0,
  })

  const filtered = useMemo(() => {
    return DEMO_FIRMS.filter((firm) => {
      if (filters.industry && !firm.specialties.includes(filters.industry)) return false
      if (filters.state && firm.state !== filters.state) return false
      if (filters.service && !firm.services.includes(filters.service)) return false
      if (filters.minRating > 0 && firm.clientSatisfaction < filters.minRating) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const match =
          firm.name.toLowerCase().includes(q) ||
          firm.city.toLowerCase().includes(q) ||
          firm.state.toLowerCase().includes(q) ||
          firm.specialties.some((s) => s.toLowerCase().includes(q)) ||
          firm.tagline.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [filters, searchQuery])

  return (
    <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: '#080808' }}>
      <TopNav />

      {/* Hero */}
      <div
        style={{
          backgroundColor: '#080808',
          borderBottom: '1px solid #1f1f1f',
          padding: '64px 24px 56px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(45,90,39,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(184,115,74,0.18) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 20,
              backgroundColor: 'rgba(45,90,39,0.25)',
              border: '1px solid rgba(196,217,192,0.3)',
              marginBottom: 20,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.25C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="#6ee7b7" fillOpacity="0.3" stroke="#6ee7b7" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8.5 12l2.5 2.5 5-5" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: 600 }}>Verified CPA Directory</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              letterSpacing: '-0.03em',
              color: '#ffffff',
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            Find a CloseBooks Verified CPA
          </h1>
          <p style={{ fontSize: '17px', color: '#8a8078', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Every firm in our directory is verified for accuracy, close speed, and client satisfaction. Find your perfect CPA match.
          </p>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              backgroundColor: '#0f0f0f',
              borderRadius: 14,
              border: '1px solid #1f1f1f',
              overflow: 'hidden',
              maxWidth: 580,
              margin: '0 auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ padding: '0 14px', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="#444444" strokeWidth="1.5" />
                <path d="M12 12l3 3" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by firm name, industry, or location..."
              style={{
                flex: 1,
                padding: '14px 0',
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                color: '#FAFAFA',
                backgroundColor: 'transparent',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  padding: '0 14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#444444',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Quick filters */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {['SaaS', 'Construction', 'Restaurant', 'Healthcare', 'Real Estate'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilters((f) => ({ ...f, industry: f.industry === tag ? '' : tag }))}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: filters.industry === tag ? 'rgba(196,217,192,0.25)' : 'rgba(255,255,255,0.07)',
                  color: filters.industry === tag ? '#6ee7b7' : '#8a8078',
                  border: `1px solid ${filters.industry === tag ? 'rgba(110,231,183,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '40px 24px',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {/* Filter sidebar — hidden on mobile */}
        <div className="hidden md:block" style={{ flexShrink: 0, width: 220 }}>
          <FilterSidebar filters={filters} onChange={setFilters} totalResults={filtered.length} />
        </div>

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Result count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontSize: '14px', color: '#888888' }}>
              {filtered.length === 0
                ? 'No firms match your filters'
                : `${filtered.length} verified ${filtered.length === 1 ? 'firm' : 'firms'}`}
              {(filters.industry || filters.state || filters.service) && (
                <button
                  onClick={() => setFilters({ industry: '', state: '', service: '', minRating: 0 })}
                  style={{
                    marginLeft: 12,
                    fontSize: '12px',
                    color: '#b8734a',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Clear filters
                </button>
              )}
            </p>
            <p style={{ fontSize: '12px', color: '#444444' }}>
              Sorted by: Accuracy
            </p>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                backgroundColor: '#0f0f0f',
                border: '2px dashed #1f1f1f',
                borderRadius: 16,
                padding: '60px 40px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  fontSize: '20px',
                  color: '#FAFAFA',
                  marginBottom: 8,
                }}
              >
                No firms found
              </p>
              <p style={{ fontSize: '14px', color: '#888888', marginBottom: 20 }}>
                Try broadening your search or removing some filters.
              </p>
              <button
                onClick={() => {
                  setFilters({ industry: '', state: '', service: '', minRating: 0 })
                  setSearchQuery('')
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  backgroundColor: '#00C853',
                  color: '#080808',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View all firms
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              {filtered.map((firm) => (
                <FirmCard key={firm.id} firm={firm} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #1f1f1f',
          padding: '32px 24px',
          textAlign: 'center',
          backgroundColor: '#080808',
        }}
      >
        <Logo />
        <p style={{ fontSize: '13px', color: '#444444', marginTop: 12 }}>
          © 2026 CloseBooks — AI-Powered Month-End Close for CPA Firms
        </p>
      </footer>
    </div>
  )
}
