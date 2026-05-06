'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MagneticButton } from '@/components/ui/MagneticButton'

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
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: 'background-color 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease',
          backgroundColor: scrolled ? 'rgba(8,8,8,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid #1f1f1f' : '1px solid transparent',
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
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: '#00C853',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,200,83,0.4)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
          </Link>

          <nav className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#888888',
                  textDecoration: 'none',
                  transition: 'color 200ms',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FAFAFA')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              href="/login"
              className="hidden md:inline-flex"
              style={{
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 500,
                color: '#888888',
                textDecoration: 'none',
                borderRadius: 8,
                transition: 'color 200ms, background-color 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FAFAFA'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888888'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Sign in
            </Link>

            <MagneticButton>
              <Link
                href="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#000',
                  background: '#00C853',
                  borderRadius: 8,
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0,200,83,0.35)',
                  transition: 'box-shadow 200ms, background 200ms',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,200,83,0.55)'
                  e.currentTarget.style.background = '#00d95a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,200,83,0.35)'
                  e.currentTarget.style.background = '#00C853'
                }}
              >
                Start free
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7m0 0L6.5 3M9.5 6l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </MagneticButton>

            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
              style={{
                padding: 8,
                background: 'transparent',
                border: '1px solid #1f1f1f',
                borderRadius: 8,
                color: '#FAFAFA',
                cursor: 'pointer',
                minHeight: 'auto',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: '#080808',
              display: 'flex',
              flexDirection: 'column',
              padding: 28,
              borderLeft: '1px solid #1f1f1f',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#FAFAFA' }}>CloseBooks</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  padding: 8,
                  background: 'transparent',
                  border: '1px solid #1f1f1f',
                  borderRadius: 8,
                  color: '#FAFAFA',
                  cursor: 'pointer',
                  minHeight: 'auto',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontSize: 32,
                    fontFamily: 'var(--font-display)',
                    color: '#888888',
                    textDecoration: 'none',
                    letterSpacing: '-0.03em',
                    padding: '8px 0',
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#FAFAFA')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                >
                  {l.label}
                </motion.a>
              ))}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/login"
                style={{
                  padding: '14px 16px',
                  fontSize: 14,
                  textAlign: 'center',
                  color: '#FAFAFA',
                  border: '1px solid #1f1f1f',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                style={{
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#000',
                  background: '#00C853',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                Start free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
