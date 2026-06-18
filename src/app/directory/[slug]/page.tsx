'use client'

import { useState } from 'react'
import Link from 'next/link'
import { use } from 'react'
import { DEMO_FIRMS } from '@/lib/directoryData'
import VerifiedBadge from '@/components/VerifiedBadge'
import FirmCard from '@/components/FirmCard'

// ─────────────────────────────────────────────────────────────────────────────
// Logo + Nav
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/directory"
            style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}
          >
            ← Back to directory
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
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Star rating
// ─────────────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1l1.5 3.5L12 5l-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5z"
            fill={i <= rating ? '#f59e0b' : '#1f1f1f'}
            stroke={i <= rating ? '#f59e0b' : '#1f1f1f'}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact modal
// ─────────────────────────────────────────────────────────────────────────────

function ContactModal({ firmName, onClose }: { firmName: string; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(26,23,20,0.5)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#0f0f0f',
          borderRadius: 20,
          padding: '32px',
          border: '1px solid #1f1f1f',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          margin: '0 16px',
        }}
      >
        {!sent ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    fontSize: '1.5rem',
                    letterSpacing: '-0.02em',
                    color: '#FAFAFA',
                    margin: 0,
                  }}
                >
                  Contact {firmName}
                </h2>
                <p style={{ fontSize: '13px', color: '#888888', marginTop: 4 }}>
                  Send a message — they typically respond within 1 business day.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888888',
                  fontSize: '22px',
                  lineHeight: 1,
                  flexShrink: 0,
                  marginTop: -2,
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#FAFAFA', marginBottom: 6 }}>
                  Your Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #1f1f1f',
                    fontSize: '14px',
                    color: '#FAFAFA',
                    backgroundColor: '#141414',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00C853' }}
                  onBlur={(e) => { e.target.style.borderColor = '#1f1f1f' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#FAFAFA', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #1f1f1f',
                    fontSize: '14px',
                    color: '#FAFAFA',
                    backgroundColor: '#141414',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00C853' }}
                  onBlur={(e) => { e.target.style.borderColor = '#1f1f1f' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#FAFAFA', marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell them about your business and what you're looking for..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #1f1f1f',
                    fontSize: '14px',
                    color: '#FAFAFA',
                    backgroundColor: '#141414',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#00C853' }}
                  onBlur={(e) => { e.target.style.borderColor = '#1f1f1f' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  backgroundColor: '#00C853',
                  color: '#080808',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#00b34a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00C853' }}
              >
                Send Message
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,200,83,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14l5.5 5.5L22 8" stroke="#00C853" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '1.4rem',
                color: '#FAFAFA',
                margin: '0 0 8px',
              }}
            >
              Message sent!
            </h3>
            <p style={{ fontSize: '14px', color: '#888888', marginBottom: 24 }}>
              {firmName} will be in touch soon.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                backgroundColor: '#1f1f1f',
                color: '#FAFAFA',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function FirmProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [contactOpen, setContactOpen] = useState(false)

  const firm = DEMO_FIRMS.find((f) => f.slug === slug) ?? DEMO_FIRMS[0]
  const relatedFirms = DEMO_FIRMS.filter(
    (f) => f.slug !== firm.slug && f.specialties.some((s) => firm.specialties.includes(s))
  ).slice(0, 3)

  return (
    <div data-theme="dark" style={{ minHeight: '100vh', backgroundColor: '#080808' }}>
      <TopNav />

      {/* Hero header */}
      <div
        style={{
          backgroundColor: '#080808',
          borderBottom: '1px solid #1f1f1f',
          padding: '48px 24px 44px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(ellipse at 15% 60%, rgba(45,90,39,0.3) 0%, transparent 60%), radial-gradient(ellipse at 85% 20%, rgba(184,115,74,0.15) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              {firm.verified && (
                <div style={{ marginBottom: 14 }}>
                  <VerifiedBadge size="sm" showLabel />
                </div>
              )}
              <h1
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  margin: '0 0 8px',
                  lineHeight: 1.1,
                }}
              >
                {firm.name}
              </h1>
              <p style={{ fontSize: '16px', color: '#8a8078', margin: '0 0 16px' }}>
                {firm.tagline}
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#8a8078', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" stroke="#8a8078" strokeWidth="1.2" fill="none" />
                    <circle cx="7" cy="5" r="1.5" stroke="#8a8078" strokeWidth="1.2" fill="none" />
                  </svg>
                  {firm.city}, {firm.state}
                </span>
                <span style={{ fontSize: '14px', color: '#8a8078' }}>Founded {firm.foundedYear}</span>
                <span style={{ fontSize: '14px', color: '#8a8078' }}>{firm.teamSize} people</span>
              </div>
            </div>
            <button
              onClick={() => setContactOpen(true)}
              style={{
                padding: '13px 28px',
                borderRadius: 12,
                backgroundColor: '#00C853',
                color: '#080808',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#00b34a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00C853' }}
            >
              Contact This Firm
            </button>
          </div>
        </div>
      </div>

      {/* Hero metrics bar */}
      <div
        style={{
          backgroundColor: '#0f0f0f',
          borderBottom: '1px solid #1f1f1f',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
          }}
        >
          {[
            { value: firm.closesCompleted.toLocaleString(), label: 'Closes Completed' },
            { value: `${firm.accuracyRate}%`, label: 'AI Accuracy', accent: true },
            { value: `${firm.avgCloseTimeMin} min`, label: 'Avg Close Time' },
            { value: `${firm.clientSatisfaction}/5.0`, label: 'Client Rating' },
          ].map(({ value, label, accent }) => (
            <div
              key={label}
              style={{
                padding: '20px 16px',
                textAlign: 'center',
                borderRight: '1px solid #1f1f1f',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  fontSize: '1.8rem',
                  letterSpacing: '-0.02em',
                  color: accent ? '#00C853' : '#FAFAFA',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: '12px', color: '#444444', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '40px 24px',
          display: 'flex',
          gap: 40,
          alignItems: 'flex-start',
        }}
      >
        {/* Left column — main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* About */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: 16,
              padding: '28px',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 10 }}>
              About
            </p>
            <p style={{ fontSize: '15px', color: '#FAFAFA', lineHeight: 1.7, margin: 0 }}>
              {firm.bio}
            </p>
          </div>

          {/* Specialties */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: 16,
              padding: '28px',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 10 }}>
              Specialties
            </p>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', marginBottom: 16 }}>
              Industries Served
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {firm.specialties.map((s) => (
                <span
                  key={s}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'rgba(0,200,83,0.1)',
                    color: '#00C853',
                    border: '1px solid rgba(0,200,83,0.2)',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: 16,
              padding: '28px',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 10 }}>
              Services
            </p>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#FAFAFA', marginBottom: 16 }}>
              What they offer
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              {firm.services.map((svc) => (
                <div
                  key={svc}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: '#141414',
                    border: '1px solid #1f1f1f',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,200,83,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="#00C853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span style={{ fontSize: '13px', color: '#FAFAFA', fontWeight: 500 }}>{svc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: 16,
              padding: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 6 }}>
                Pricing
              </p>
              <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
                Hourly rate range
              </p>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '1.8rem',
                letterSpacing: '-0.02em',
                color: '#FAFAFA',
                margin: 0,
              }}
            >
              ${firm.hourlyRateMin}–${firm.hourlyRateMax}
              <span style={{ fontSize: '1rem', color: '#888888', fontFamily: 'inherit' }}>/hr</span>
            </p>
          </div>

          {/* Reviews */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: 16,
              padding: '28px',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 10 }}>
              Client Reviews
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  fontSize: '3rem',
                  letterSpacing: '-0.03em',
                  color: '#FAFAFA',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {firm.clientSatisfaction}
              </p>
              <div>
                <Stars rating={Math.round(firm.clientSatisfaction)} />
                <p style={{ fontSize: '13px', color: '#888888', marginTop: 4 }}>
                  Based on {firm.reviews.length} verified reviews
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {firm.reviews.map((review, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px',
                    borderRadius: 12,
                    backgroundColor: '#141414',
                    border: '1px solid #1f1f1f',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0,200,83,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#00C853',
                          flexShrink: 0,
                        }}
                      >
                        {review.author[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#FAFAFA', margin: 0 }}>
                          {review.author}
                        </p>
                        <p style={{ fontSize: '12px', color: '#888888', margin: '2px 0 0' }}>
                          {review.company}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <Stars rating={review.rating} />
                      <p style={{ fontSize: '11px', color: '#444444', marginTop: 3 }}>
                        {new Date(review.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#FAFAFA', lineHeight: 1.6, margin: 0 }}>
                    "{review.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA bottom */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              borderRadius: 20,
              padding: '36px 32px',
              border: '1px solid #1f1f1f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(ellipse at 10% 50%, rgba(0,200,83,0.12) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-serif), Georgia, serif',
                  fontSize: '1.5rem',
                  letterSpacing: '-0.02em',
                  color: '#FAFAFA',
                  margin: '0 0 6px',
                }}
              >
                Ready to work with {firm.name}?
              </p>
              <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
                Send a message and they'll get back to you within 1 business day.
              </p>
            </div>
            <button
              onClick={() => setContactOpen(true)}
              style={{
                padding: '13px 28px',
                borderRadius: 12,
                backgroundColor: '#00C853',
                color: '#080808',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                position: 'relative',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#00b34a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00C853' }}
            >
              Contact This Firm →
            </button>
          </div>
        </div>

        {/* Right sidebar — related firms */}
        {relatedFirms.length > 0 && (
          <aside
            style={{
              width: 300,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
            className="hidden lg:flex"
          >
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 14 }}>
                Similar Firms
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {relatedFirms.map((f) => (
                  <FirmCard key={f.id} firm={f} />
                ))}
              </div>
            </div>
            <Link
              href="/directory"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                borderRadius: 10,
                fontSize: '14px',
                fontWeight: 600,
                color: '#00C853',
                backgroundColor: 'rgba(0,200,83,0.08)',
                border: '1px solid rgba(0,200,83,0.2)',
                textDecoration: 'none',
              }}
            >
              View all firms →
            </Link>
          </aside>
        )}
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

      {contactOpen && (
        <ContactModal firmName={firm.name} onClose={() => setContactOpen(false)} />
      )}
    </div>
  )
}
