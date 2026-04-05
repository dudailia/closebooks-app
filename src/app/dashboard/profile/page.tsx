'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'

// ─────────────────────────────────────────────────────────────────────────────
// Count-up hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, decimals])

  return value
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric card with count-up
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  target,
  suffix = '',
  decimals = 0,
  accent = false,
}: {
  label: string
  target: number
  suffix?: string
  decimals?: number
  accent?: boolean
}) {
  const value = useCountUp(target, 1600, decimals)

  return (
    <div
      style={{
        backgroundColor: accent ? '#f0f5ef' : '#ffffff',
        border: `1px solid ${accent ? '#c4d9c0' : '#e8e0d4'}`,
        borderRadius: 16,
        padding: '24px 20px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          fontSize: '2.4rem',
          letterSpacing: '-0.03em',
          color: accent ? '#2d5a27' : '#1a1714',
          lineHeight: 1,
          margin: 0,
        }}
      >
        {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}
        {suffix}
      </p>
      <p style={{ fontSize: '13px', color: '#6b6560', marginTop: 8, fontWeight: 500 }}>
        {label}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Specialties editor
// ─────────────────────────────────────────────────────────────────────────────

const ALL_INDUSTRIES = [
  'Construction', 'SaaS', 'Restaurant', 'Real Estate', 'Healthcare',
  'Manufacturing', 'Retail', 'Nonprofit', 'Legal', 'E-Commerce',
  'Hospitality', 'Transportation', 'Professional Services',
]

function SpecialtiesEditor() {
  const [selected, setSelected] = useState<string[]>([
    'SaaS', 'E-Commerce', 'Professional Services',
  ])

  function toggle(industry: string) {
    setSelected((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 16,
        padding: '24px',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 6 }}>
        Specialties
      </p>
      <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>
        Industries you serve
      </h2>
      <p style={{ fontSize: '13px', color: '#6b6560', marginBottom: 16 }}>
        Click to add or remove. These appear on your public profile.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ALL_INDUSTRIES.map((ind) => {
          const active = selected.includes(ind)
          return (
            <button
              key={ind}
              onClick={() => toggle(ind)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                backgroundColor: active ? '#2d5a27' : '#f5f0ea',
                color: active ? '#ffffff' : '#6b6560',
                border: `1px solid ${active ? '#2d5a27' : '#e8e0d4'}`,
              }}
            >
              {active && <span style={{ marginRight: 4 }}>✓</span>}
              {ind}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p style={{ fontSize: '12px', color: '#6b9965', marginTop: 14 }}>
          {selected.length} {selected.length === 1 ? 'specialty' : 'specialties'} selected — showing on your public profile
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText('https://closebooks.com/directory/pinecrest-advisors').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Link href="/dashboard" style={{ fontSize: '12px', color: '#b8734a', textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <h1
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '2rem',
                letterSpacing: '-0.02em',
                color: '#1a1714',
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              Firm Profile
            </h1>
            <p style={{ fontSize: '14px', color: '#a09a94' }}>
              Your verified CloseBooks presence — visible to businesses searching the directory.
            </p>
          </div>
          <Link
            href="/dashboard/profile/edit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 10,
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#1a1714',
              color: '#ffffff',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            Edit Profile
          </Link>
        </div>

        {/* Verified banner */}
        <div
          style={{
            backgroundColor: '#f0f5ef',
            border: '1px solid #c4d9c0',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <VerifiedBadge size="lg" showLabel />
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1714', margin: 0 }}>
                CloseBooks Verified
              </p>
              <p style={{ fontSize: '13px', color: '#6b9965', margin: '2px 0 0' }}>
                Your firm meets all accuracy and completion benchmarks
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/directory/pinecrest-advisors"
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: '#2d5a27',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              Preview public profile →
            </Link>
            <button
              onClick={copyLink}
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: copied ? '#e8f0e6' : '#ffffff',
                color: copied ? '#2d5a27' : '#1a1714',
                border: '1px solid #c4d9c0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? '✓ Link copied!' : 'Copy profile link'}
            </button>
          </div>
        </div>

        {/* Hero card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '28px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background gradient */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 280,
              height: 180,
              background: 'radial-gradient(ellipse at top right, rgba(45,90,39,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 6 }}>
                Your Firm
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                  fontSize: '1.8rem',
                  letterSpacing: '-0.02em',
                  color: '#1a1714',
                  margin: '0 0 4px',
                }}
              >
                Pinecrest Advisors
              </h2>
              <p style={{ fontSize: '14px', color: '#6b6560', margin: '0 0 12px' }}>
                SaaS-focused accounting built for growth.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#6b6560' }}>
                  <span style={{ marginRight: 5 }}>📍</span>Austin, TX
                </span>
                <span style={{ fontSize: '13px', color: '#6b6560' }}>
                  <span style={{ marginRight: 5 }}>📅</span>Founded 2016
                </span>
                <span style={{ fontSize: '13px', color: '#6b6560' }}>
                  <span style={{ marginRight: 5 }}>👥</span>5–10 team members
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {['SaaS', 'E-Commerce', 'Professional Services'].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: '#e8f0e6',
                  color: '#2d5a27',
                  border: '1px solid #c4d9c0',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Verified performance metrics */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 14 }}>
            Verified Performance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <MetricCard label="Total Closes Completed" target={847} accent />
            <MetricCard label="Average Close Time" target={34} suffix=" min" />
            <MetricCard label="AI Accuracy Rate" target={99.1} suffix="%" decimals={1} />
            <MetricCard label="Client Satisfaction" target={4.9} suffix="/5.0" decimals={1} />
          </div>
        </div>

        {/* Specialties editor */}
        <SpecialtiesEditor />

        {/* Not yet verified banner (demo — hidden since verified) */}
        <div
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde68a',
            borderRadius: 16,
            padding: '20px 24px',
            display: 'none', // hide since this firm is verified
          }}
        >
          <p style={{ fontWeight: 600, color: '#92400e', marginBottom: 12 }}>
            Get CloseBooks Verified
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '10 closes completed', done: true },
              { label: '95%+ AI accuracy rate', done: true },
              { label: 'Firm info complete', done: true },
            ].map(({ label, done }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: done ? '#2d5a27' : '#e8e0d4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '11px',
                    flexShrink: 0,
                  }}
                >
                  {done ? '✓' : ''}
                </span>
                <span style={{ fontSize: '14px', color: '#92400e' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
