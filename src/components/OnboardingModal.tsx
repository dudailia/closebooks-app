'use client'

import { useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'closebooks_onboarding_done'

export function markOnboardingDone() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, '1')
  }
}

export function needsOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(STORAGE_KEY)
}

// ─────────────────────────────────────────────────────────────────────────────
// Step illustrations
// ─────────────────────────────────────────────────────────────────────────────

function IllustrationUpload() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="36" height="46" rx="4" stroke="#e0dbd4" strokeWidth="2" fill="#faf8f4" />
      <path d="M20 22h20M20 30h20M20 38h12" stroke="#c8c2bb" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="52" cy="46" r="14" fill="#e8f0e6" />
      <path d="M52 53v-14M46 45l6-6 6 6" stroke="#2d5a27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IllustrationAI() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="20" width="56" height="34" rx="5" fill="#fdf8f4" stroke="#e0dbd4" strokeWidth="1.8" />
      <path d="M16 32h12M16 40h8" stroke="#c8c2bb" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="34" y="29" width="22" height="5" rx="2.5" fill="#e8f0e6" />
      <rect x="34" y="38" width="16" height="5" rx="2.5" fill="#fef9c3" />
      {/* Sparkle */}
      <path d="M58 10l1.2 3.6L63 15l-3.8 1.2L58 20l-1.2-3.8L53 15l3.8-1.4z" fill="#b8734a" opacity="0.85" />
      <path d="M14 12l.7 2L17 15l-2.3.7L14 18l-.7-2.3L11 15l2.3-.7z" fill="#b8734a" opacity="0.5" />
      <path d="M48 6l.5 1.4L50 8l-1.5.5L48 10l-.5-1.5L46 8l1.5-.6z" fill="#b8734a" opacity="0.4" />
    </svg>
  )
}

function IllustrationExport() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="26" fill="#e8f0e6" />
      <path d="M24 36l9 9 15-18" stroke="#2d5a27" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps data
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Welcome to CloseBooks',
    body: 'Close your clients\u2019 books 50% faster with AI. Here\u2019s how it works in 3 simple steps.',
    illustration: null,
    isWelcome: true,
  },
  {
    title: 'Upload a bank statement',
    body: 'Upload your client\u2019s bank statement as a CSV file. We support all major bank formats.',
    illustration: <IllustrationUpload />,
    isWelcome: false,
  },
  {
    title: 'AI categorizes everything',
    body: 'Our AI maps every transaction to your client\u2019s Chart of Accounts with 85\u201395% accuracy. You review only the exceptions.',
    illustration: <IllustrationAI />,
    isWelcome: false,
  },
  {
    title: 'Export and done',
    body: 'Approve the categorizations, export to QuickBooks or Xero, and you\u2019re done. What used to take days now takes hours.',
    illustration: <IllustrationExport />,
    isWelcome: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)

  function dismiss() {
    markOnboardingDone()
    onClose()
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26, 23, 20, 0.45)', backdropFilter: 'blur(2px)', animation: 'fadeUp 0.18s ease both' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e0dbd4' }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full transition-colors"
          style={{ color: '#a09a94', backgroundColor: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* Progress bar strip */}
        <div className="h-1 w-full" style={{ backgroundColor: '#f0ece4' }}>
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: '#2d5a27' }}
          />
        </div>

        {/* Body */}
        <div className="px-8 pt-8 pb-6 text-center">
          {current.isWelcome ? (
            /* Welcome step — logo + brand */
            <div className="mb-6">
              <div
                className="inline-flex items-center gap-2 mb-4"
              >
                <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
                  <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
                  <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
                  <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
                </svg>
                <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '22px', letterSpacing: '-0.01em' }}>
                  <span style={{ color: '#1a1714' }}>Close</span>
                  <span style={{ color: '#b8734a' }}>Books</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-6">
              {current.illustration}
            </div>
          )}

          <h2
            className="text-xl mb-3"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            {current.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>
            {current.body}
          </p>

          {/* Step counter */}
          {!current.isWelcome && (
            <p className="text-xs mt-3" style={{ color: '#a09a94' }}>
              Step {step} of {STEPS.length - 1}
            </p>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width:  i === step ? '20px' : '6px',
                height: '6px',
                backgroundColor: i === step ? '#2d5a27' : '#e0dbd4',
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Footer buttons */}
        <div
          className="px-8 pb-7 flex gap-3"
          style={{ justifyContent: isLast ? 'stretch' : 'space-between' }}
        >
          {isLast ? (
            /* Final step: two full-width CTAs */
            <div className="flex flex-col gap-2 w-full">
              <Link
                href="/dashboard/upload"
                onClick={dismiss}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Start Your First Close
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/demo"
                onClick={dismiss}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Try Demo First
              </Link>
            </div>
          ) : (
            <>
              {step > 0 ? (
                <button
                  onClick={back}
                  className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
                  style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={next}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                Next
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
