'use client'
import { useState } from 'react'
import Link from 'next/link'
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
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 44 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
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
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  color: isActive ? '#00110A' : '#A8A8BC',
                  background: isActive
                    ? 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)'
                    : 'transparent',
                  transition: 'all 160ms',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
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
                      backgroundColor: isActive
                        ? 'rgba(0,17,10,0.15)'
                        : 'rgba(0,217,126,0.16)',
                      color: isActive ? '#00110A' : '#00D97E',
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
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        {TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} annual={annual} variant={variant} />
        ))}
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: 28,
          fontSize: 13,
          color: '#6E6E85',
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
    <div
      style={{
        position: 'relative',
        padding: 28,
        borderRadius: 20,
        backgroundColor: '#111118',
        border: tier.popular
          ? '1px solid rgba(0,217,126,0.5)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: tier.popular ? '0 24px 60px rgba(0,217,126,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {tier.popular && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#00110A',
            background: 'linear-gradient(135deg, #00D97E, #00B368)',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0,217,126,0.3)',
          }}
        >
          Most popular
        </div>
      )}

      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#00D97E',
          margin: 0,
          marginBottom: 12,
        }}
      >
        {tier.name}
      </p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 56,
            lineHeight: 1,
            color: '#F0F0F5',
            letterSpacing: '-0.035em',
            fontWeight: 400,
          }}
        >
          ${display}
        </span>
        <span style={{ fontSize: 14, color: '#A8A8BC' }}>{suffix}</span>
      </div>

      {annual && (
        <p style={{ fontSize: 11, color: '#00D97E', margin: '4px 0 0' }}>
          20% off vs ${tier.monthly * 12}/yr
        </p>
      )}

      <p style={{ fontSize: 13, color: '#A8A8BC', margin: '12px 0 4px' }}>
        {tier.clients} · {tier.users}
      </p>
      <p style={{ fontSize: 13, color: '#6E6E85', margin: 0, marginBottom: 20 }}>
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
              padding: '6px 0',
              fontSize: 13,
              color: '#D5D5E0',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ marginTop: 2, flexShrink: 0 }}
            >
              <circle cx="8" cy="8" r="7" fill="rgba(0,217,126,0.1)" />
              <path
                d="M5 8l2 2 4-4"
                stroke="#00D97E"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
    </div>
  )
}

function LandingCta({ tier, annual }: { tier: Tier; annual: boolean }) {
  const href = `/signup?plan=${tier.id}&billing=${annual ? 'annual' : 'monthly'}`
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '12px 16px',
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 10,
        textDecoration: 'none',
        color: tier.popular ? '#00110A' : '#F0F0F5',
        background: tier.popular
          ? 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)'
          : 'rgba(255,255,255,0.04)',
        border: tier.popular ? 'none' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: tier.popular ? '0 8px 24px rgba(0,217,126,0.28)' : 'none',
        transition: 'transform 160ms, box-shadow 160ms',
      }}
      onMouseEnter={(e) => {
        if (tier.popular) {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,217,126,0.42)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
        }
      }}
      onMouseLeave={(e) => {
        if (tier.popular) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,217,126,0.28)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
        }
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
          color: '#F0F0F5',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          outline: 'none',
          marginBottom: 10,
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      {configured ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            cursor: loading ? 'wait' : 'pointer',
            color: tier.popular ? '#00110A' : '#F0F0F5',
            background: tier.popular
              ? 'linear-gradient(135deg, #00D97E 0%, #00B368 100%)'
              : 'rgba(255,255,255,0.04)',
            border: tier.popular ? 'none' : '1px solid rgba(255,255,255,0.12)',
            boxShadow: tier.popular ? '0 8px 24px rgba(0,217,126,0.28)' : 'none',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Redirecting to Stripe…' : 'Subscribe'}
        </button>
      ) : (
        <p style={{ fontSize: 11, textAlign: 'center', color: '#6E6E85', marginTop: 4 }}>
          Set {priceEnvKey(tier.id, annual)} in env to enable checkout.
        </p>
      )}
      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#FF8FA0' }}>{error}</p>
      )}
    </>
  )
}
