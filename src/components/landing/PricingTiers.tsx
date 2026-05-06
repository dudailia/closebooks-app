'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GlowCard } from '@/components/ui/GlowCard'
import { MagneticButton } from '@/components/ui/MagneticButton'
import {
  TIERS,
  annualTotal,
  resolvePriceId,
  priceEnvKey,
  type Tier,
} from '@/lib/landing/tiers'

interface Props {
  variant?: 'landing' | 'pricing'
  annualDefault?: boolean
}

export default function PricingTiers({ variant = 'landing', annualDefault = false }: Props) {
  const [annual, setAnnual] = useState(annualDefault)

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            borderRadius: 999,
            backgroundColor: '#0f0f0f',
            border: '1px solid #1f1f1f',
          }}
        >
          {(['Monthly', 'Annual'] as const).map((label, i) => {
            const isActive = i === 0 ? !annual : annual
            return (
              <button
                key={label}
                type="button"
                onClick={() => setAnnual(i === 1)}
                style={{
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#000' : '#888888',
                  background: isActive ? '#00C853' : 'transparent',
                  transition: 'all 200ms',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: isActive ? '0 4px 16px rgba(0,200,83,0.3)' : 'none',
                  fontFamily: 'var(--font-sans)',
                  minHeight: 'auto',
                }}
              >
                {label}
                {i === 1 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 999,
                      backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(0,200,83,0.12)',
                      color: isActive ? '#000' : '#00C853',
                    }}
                  >
                    −20%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {TIERS.map((tier, i) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
          >
            <TierCard key={tier.id} tier={tier} annual={annual} variant={variant} />
          </motion.div>
        ))}
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: 28,
          fontSize: 13,
          color: '#444444',
          fontFamily: 'var(--font-sans)',
        }}
      >
        14-day trial on every plan · Cancel anytime · Annual saves 20%
      </p>
    </div>
  )
}

function TierCard({
  tier,
  annual,
  variant,
}: {
  tier: Tier
  annual: boolean
  variant: 'landing' | 'pricing'
}) {
  const display = annual ? annualTotal(tier.monthly) : tier.monthly
  const suffix = annual ? '/yr' : '/mo'

  return (
    <GlowCard
      style={{
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '100%',
        ...(tier.popular ? {
          borderColor: 'rgba(0,200,83,0.4)',
          boxShadow: '0 0 40px rgba(0,200,83,0.12)',
          animation: 'glow-pulse 3s ease-in-out infinite',
        } : {}),
      }}
    >
      {tier.popular && (
        <div
          style={{
            position: 'absolute',
            top: -13,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#000',
            background: '#00C853',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,200,83,0.4)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Most popular
        </div>
      )}

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#00C853',
          margin: 0,
          marginBottom: 14,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {tier.name}
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 60,
            lineHeight: 1,
            color: '#FAFAFA',
            letterSpacing: '-0.04em',
            fontWeight: 400,
          }}
        >
          ${display}
        </span>
        <span style={{ fontSize: 14, color: '#888888', fontFamily: 'var(--font-sans)' }}>{suffix}</span>
      </div>

      {annual && (
        <p style={{ fontSize: 11, color: '#00C853', margin: '4px 0 0', fontFamily: 'var(--font-sans)' }}>
          20% off vs ${tier.monthly * 12}/yr
        </p>
      )}

      <p style={{ fontSize: 13, color: '#888888', margin: '12px 0 4px', fontFamily: 'var(--font-sans)' }}>
        {tier.clients} · {tier.users}
      </p>
      <p style={{ fontSize: 13, color: '#444444', margin: 0, marginBottom: 22, fontFamily: 'var(--font-sans)' }}>
        {tier.tagline}
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
        {tier.features.map((f) => (
          <li
            key={f}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '5px 0',
              fontSize: 13,
              color: '#888888',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
              <circle cx="8" cy="8" r="7" fill="rgba(0,200,83,0.08)" />
              <path d="M5 8l2 2 4-4" stroke="#00C853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {variant === 'landing' ? (
        <LandingCta tier={tier} annual={annual} />
      ) : (
        <PricingCta tier={tier} annual={annual} />
      )}
    </GlowCard>
  )
}

function LandingCta({ tier, annual }: { tier: Tier; annual: boolean }) {
  const href = `/signup?plan=${tier.id}&billing=${annual ? 'annual' : 'monthly'}`

  if (tier.popular) {
    return (
      <MagneticButton style={{ width: '100%' }}>
        <Link
          href={href}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '13px 16px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            textDecoration: 'none',
            color: '#000',
            background: '#00C853',
            boxShadow: '0 6px 24px rgba(0,200,83,0.35)',
            transition: 'box-shadow 200ms',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,200,83,0.55)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,200,83,0.35)' }}
        >
          Start 14-day trial
        </Link>
      </MagneticButton>
    )
  }

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '13px 16px',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 10,
        textDecoration: 'none',
        color: '#FAFAFA',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid #1f1f1f',
        transition: 'background 200ms, border-color 200ms',
        fontFamily: 'var(--font-sans)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        e.currentTarget.style.borderColor = '#1f1f1f'
      }}
    >
      Start 14-day trial
    </Link>
  )
}

function PricingCta({ tier, annual }: { tier: Tier; annual: boolean }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const priceId = resolvePriceId(tier.id, annual)
  const configured = !!priceId

  async function handleClick() {
    if (!configured) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          customerEmail: email || undefined,
          planSlug: tier.id,
          billingInterval: annual ? 'year' : 'month',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed.')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 13,
          color: '#FAFAFA',
          backgroundColor: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: 8,
          outline: 'none',
          marginBottom: 10,
          boxSizing: 'border-box',
          fontFamily: 'var(--font-sans)',
        }}
      />
      {configured ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 16px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            cursor: loading ? 'wait' : 'pointer',
            color: tier.popular ? '#000' : '#FAFAFA',
            background: tier.popular ? '#00C853' : 'rgba(255,255,255,0.04)',
            border: tier.popular ? 'none' : '1px solid #1f1f1f',
            boxShadow: tier.popular ? '0 6px 24px rgba(0,200,83,0.3)' : 'none',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {loading ? 'Redirecting to Stripe…' : 'Subscribe'}
        </button>
      ) : (
        <p style={{ fontSize: 11, textAlign: 'center', color: '#444444', marginTop: 4, fontFamily: 'var(--font-sans)' }}>
          Set {priceEnvKey(tier.id, annual)} in env to enable checkout.
        </p>
      )}
      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#FF4444', fontFamily: 'var(--font-sans)' }}>{error}</p>
      )}
    </>
  )
}
