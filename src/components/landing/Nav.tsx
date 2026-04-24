'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#testimonials', label: 'Firms' },
  { href: '#pricing', label: 'Pricing' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: 'background-color 240ms ease, border-color 240ms ease, backdrop-filter 240ms ease',
          backgroundColor: scrolled ? 'rgba(10,10,15,0.72)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px) saturate(160%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(160%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 28px',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
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
                letterSpacing: '-0.02em',
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
          </Link>

          <nav
            className="hidden md:flex"
            style={{ gap: 32, alignItems: 'center' }}
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 14,
                  color: '#A8A8BC',
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0F5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#A8A8BC')}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/login"
              className="hidden md:inline-flex"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: '#A8A8BC',
                textDecoration: 'none',
                borderRadius: 8,
                transition: 'color 150ms, background-color 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F0F0F5'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#A8A8BC'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#00110A',
                background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'transform 150ms, box-shadow 150ms',
                boxShadow: '0 4px 16px rgba(0,217,126,0.24)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,217,126,0.36)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,217,126,0.24)'
              }}
            >
              Start free
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
              style={{
                padding: 8,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#F0F0F5',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: '#0A0A0F',
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{
                padding: 8,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#F0F0F5',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 40 }}>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 28,
                  fontFamily: 'var(--font-serif)',
                  color: '#F0F0F5',
                  textDecoration: 'none',
                  letterSpacing: '-0.02em',
                }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
            <Link
              href="/login"
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: 14,
                textAlign: 'center',
                color: '#F0F0F5',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center',
                color: '#00110A',
                background: 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
