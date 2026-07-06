'use client'

import { useState } from 'react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Slider component
// ---------------------------------------------------------------------------
function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA' }}>{label}</label>
        <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#00C853' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '9999px',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          accentColor: '#00C853',
          backgroundColor: '#1f1f1f',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#444444' }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MetricCard component
// ---------------------------------------------------------------------------
function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle?: string
}) {
  return (
    <div
      style={{
        backgroundColor: '#0f0f0f',
        border: '1px solid #1f1f1f',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div style={{ fontSize: '13px', color: '#888888', fontWeight: 500 }}>{label}</div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#00C853',
          transition: 'all 0.3s ease',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#888888' }}>{subtitle}</div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ROICalculator() {
  const [clients, setClients] = useState(15)
  const [avgTransactions, setAvgTransactions] = useState(150)
  const [hoursPerClose, setHoursPerClose] = useState(4)
  const [hourlyRate, setHourlyRate] = useState(65)

  // Calculations
  const monthlyHoursTotal = clients * hoursPerClose
  const aiHoursSaved = Math.round(monthlyHoursTotal * 0.72)
  const aiHoursRemaining = monthlyHoursTotal - aiHoursSaved
  const annualHoursSaved = aiHoursSaved * 12
  const annualMoneySaved = annualHoursSaved * hourlyRate
  const subscriptionCost = 249 * 12
  const annualROI = Math.round(((annualMoneySaved - subscriptionCost) / subscriptionCost) * 100)
  const paybackDays = Math.round((subscriptionCost / 12) / (aiHoursSaved * hourlyRate / 30))

  // Bar chart values
  const currentMonthlyCost = clients * hoursPerClose * hourlyRate
  const withClosebooks = aiHoursRemaining * hourlyRate + 249
  const barMax = Math.max(currentMonthlyCost, withClosebooks, 1)
  const currentBarPct = (currentMonthlyCost / barMax) * 100
  const closebooksBarPct = (withClosebooks / barMax) * 100

  const formatDollars = (v: number) => `$${v.toLocaleString()}`
  const formatHours = (v: number) => `${v} hrs`
  const formatNumber = (v: number) => `${v}`

  return (
    <div style={{ backgroundColor: '#080808', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Top nav */}
      <nav
        style={{
          backgroundColor: '#0f0f0f',
          borderBottom: '1px solid #1f1f1f',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#00C853' }}>CloseBooks</span>
        </Link>
        <Link
          href="/"
          style={{
            fontSize: '14px',
            color: '#888888',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '64px 24px 40px' }}>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#00C85315',
            color: '#00C853',
            borderRadius: '9999px',
            padding: '4px 14px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
            letterSpacing: '0.02em',
          }}
        >
          FREE ROI CALCULATOR
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 700,
            color: '#FAFAFA',
            lineHeight: 1.2,
            margin: '0 0 16px',
          }}
        >
          How much could your firm save<br />with AI-powered close?
        </h1>
        <p style={{ fontSize: '18px', color: '#888888', maxWidth: '540px', margin: '0 auto', lineHeight: 1.6 }}>
          Enter your numbers below to see your personalized ROI
        </p>
      </section>

      {/* Two-column layout */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px 64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left column — Inputs */}
        <div
          style={{
            backgroundColor: '#0f0f0f',
            border: '1px solid #1f1f1f',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FAFAFA', margin: '0 0 8px' }}>
              Your firm details
            </h2>
            <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
              Adjust the sliders to match your current workload
            </p>
          </div>

          <Slider
            label="Monthly clients"
            value={clients}
            min={1}
            max={100}
            step={1}
            format={formatNumber}
            onChange={setClients}
          />
          <Slider
            label="Avg transactions per client"
            value={avgTransactions}
            min={50}
            max={500}
            step={10}
            format={formatNumber}
            onChange={setAvgTransactions}
          />
          <Slider
            label="Hours per close currently"
            value={hoursPerClose}
            min={1}
            max={20}
            step={0.5}
            format={(v) => `${v} hrs`}
            onChange={setHoursPerClose}
          />
          <Slider
            label="Your hourly rate ($/hr)"
            value={hourlyRate}
            min={25}
            max={200}
            step={5}
            format={(v) => `$${v}`}
            onChange={setHourlyRate}
          />

          {/* Summary row */}
          <div
            style={{
              backgroundColor: '#080808',
              border: '1px solid #1f1f1f',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
            }}
          >
            <span style={{ color: '#888888' }}>Current monthly hours</span>
            <span style={{ fontWeight: 700, color: '#FAFAFA' }}>{monthlyHoursTotal} hrs</span>
          </div>

          {paybackDays > 0 && isFinite(paybackDays) && (
            <div
              style={{
                backgroundColor: '#00C85310',
                border: '1px solid #00C85330',
                borderRadius: '10px',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#00C853',
                fontWeight: 600,
              }}
            >
              Estimated payback period: {paybackDays} day{paybackDays !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Right column — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metric cards 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <MetricCard
              label="Hours saved per month"
              value={formatHours(aiHoursSaved)}
            />
            <MetricCard
              label="Annual time savings"
              value={formatHours(annualHoursSaved)}
            />
            <MetricCard
              label="Annual money saved"
              value={formatDollars(annualMoneySaved)}
            />
            <MetricCard
              label="ROI on CloseBooks"
              value={`${annualROI.toLocaleString()}%`}
              subtitle="at $249/month"
            />
          </div>

          {/* Comparison bar chart */}
          <div
            style={{
              backgroundColor: '#0f0f0f',
              border: '1px solid #1f1f1f',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FAFAFA', margin: 0 }}>
              Monthly cost comparison
            </h3>

            {/* Current */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#888888' }}>Current monthly cost</span>
                <span style={{ fontWeight: 700, color: '#FAFAFA' }}>{formatDollars(currentMonthlyCost)}</span>
              </div>
              <div
                style={{
                  height: '28px',
                  backgroundColor: '#1f1f1f',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${currentBarPct}%`,
                    backgroundColor: '#b8734a',
                    borderRadius: '6px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* With CloseBooks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#888888' }}>With CloseBooks</span>
                <span style={{ fontWeight: 700, color: '#00C853' }}>{formatDollars(withClosebooks)}</span>
              </div>
              <div
                style={{
                  height: '28px',
                  backgroundColor: '#1f1f1f',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${closebooksBarPct}%`,
                    backgroundColor: '#00C853',
                    borderRadius: '6px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Savings callout */}
            {currentMonthlyCost > withClosebooks && (
              <div
                style={{
                  backgroundColor: '#00C85310',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#00C853',
                  fontWeight: 600,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                You save {formatDollars(currentMonthlyCost - withClosebooks)} every month
              </div>
            )}
          </div>

          {/* CTA */}
          <div
            style={{
              backgroundColor: '#00C853',
              borderRadius: '16px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#FAFAFA', margin: 0, lineHeight: 1.3 }}>
              Start saving {aiHoursSaved} hours this month
            </p>
            <Link
              href="/get-started"
              style={{
                display: 'inline-block',
                backgroundColor: '#ffffff',
                color: '#00C853',
                fontWeight: 700,
                fontSize: '16px',
                padding: '14px 32px',
                borderRadius: '9999px',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
            >
              Start Free Trial →
            </Link>
            <p style={{ fontSize: '13px', color: '#FAFAFA99', margin: 0 }}>
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Early access — we do not publish customer quotes without permission */}
      <section
        style={{
          backgroundColor: '#0f0f0f',
          borderTop: '1px solid #1f1f1f',
          padding: '64px 24px',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#00C853',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Early access
          </p>
          <h2
            style={{
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 600,
              color: '#FAFAFA',
              margin: '0 0 12px',
              letterSpacing: '-0.02em',
            }}
          >
            No customer quotes yet — verify the workflow yourself
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#888888',
              margin: '0 auto 40px',
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            CloseBooks is onboarding pilot CPA firms. We only publish testimonials with written permission. Use these tools to evaluate fit on your own data and volume.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            {[
              {
                title: 'Interactive demo',
                copy: 'Upload a CSV or use sample data — walk through categorize, review, and export.',
                href: '/demo',
                cta: 'Try the demo',
              },
              {
                title: 'Sample close package',
                copy: 'Preview export checks, exception lists, and client-ready output before you commit.',
                href: '/sample-close-package',
                cta: 'View sample',
              },
              {
                title: 'Start free trial',
                copy: '14 days on your firm workspace — no credit card required at signup.',
                href: '/signup',
                cta: 'Create account',
              },
            ].map(({ title, copy, href, cta }) => (
              <div
                key={title}
                style={{
                  backgroundColor: '#080808',
                  border: '1px solid #1f1f1f',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#FAFAFA', margin: '0 0 8px' }}>
                  {title}
                </p>
                <p style={{ fontSize: '14px', color: '#888888', margin: '0 0 16px', lineHeight: 1.55 }}>
                  {copy}
                </p>
                <Link href={href} style={{ fontSize: '14px', fontWeight: 700, color: '#00C853', textDecoration: 'none' }}>
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
