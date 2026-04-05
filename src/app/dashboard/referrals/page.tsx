'use client'

import { useState, useEffect } from 'react'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'
import { loadFirmSettings } from '@/lib/firmSettings'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40) || 'my-firm'
}

const BASE_URL = 'https://closebooks-app.vercel.app'

function getReferralStats(): { clicks: number; signups: number } {
  if (typeof window === 'undefined') return { clicks: 0, signups: 0 }
  try {
    const raw = localStorage.getItem('cb_referral_stats')
    return raw ? JSON.parse(raw) : { clicks: 0, signups: 0 }
  } catch { return { clicks: 0, signups: 0 } }
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0"
      style={{
        borderColor: copied ? '#059669' : '#e8e0d4',
        color: copied ? '#059669' : '#6b6560',
        backgroundColor: copied ? '#ecfdf5' : '#ffffff',
      }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 5.5l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="3.5" y="3.5" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M2 7.5V2a1 1 0 011-1h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReferralsPage() {
  const [firmName, setFirmName] = useState('My Firm')
  const [stats, setStats]       = useState({ clicks: 0, signups: 0 })
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const settings = loadFirmSettings()
    if (settings.firmName) setFirmName(settings.firmName)
    setStats(getReferralStats())
  }, [])

  const slug        = toSlug(firmName)
  const referralUrl = `${BASE_URL}/ref/${slug}`

  const emailTemplate = `Hi [Name],

I've been using CloseBooks to automate my month-end close and it's saving me 15+ hours per month. It uses AI to categorize transactions automatically, so I spend way less time on routine bookkeeping.

Thought you'd find it useful — here's my referral link:
${referralUrl}

They offer a free trial so you can try it with a real client before committing.

Best,
${firmName}`

  const linkedinMessage = `Hey [Name], I've been using CloseBooks for AI-powered month-end close — saves me 15+ hours/month. Check it out (my referral link): ${referralUrl}`

  const smsMessage = `Try CloseBooks — AI month-end close, saves hours per client. Free trial: ${referralUrl}`

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-8 space-y-6 page-enter">

        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '1.6rem',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Refer & Earn
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Share CloseBooks with other CPAs — when they sign up, you both get a free month.
          </p>
        </div>

        {/* Referral link box */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#a09a94' }}>
            Your referral link
          </p>
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-3"
            style={{ borderColor: '#d4e8d0', backgroundColor: '#f6faf5' }}
          >
            <GiftIcon />
            <span className="flex-1 font-mono text-sm" style={{ color: '#2d5a27' }}>
              {mounted ? referralUrl : `${BASE_URL}/ref/your-firm`}
            </span>
            {mounted && <CopyButton text={referralUrl} label="Copy link" />}
          </div>
          <p className="text-xs mt-2" style={{ color: '#a09a94' }}>
            This link is tied to your firm name. Anyone who signs up through it gets credited to you.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Link clicks', value: stats.clicks },
            { label: 'Signups', value: stats.signups },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border px-4 py-4"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <p className="font-mono text-2xl font-bold" style={{ color: '#1a1714' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: '#6b6560' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Pre-written messages */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f0ece4', backgroundColor: '#faf8f4' }}>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Ready-to-send messages</p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>Copy and paste — your referral link is already included</p>
          </div>

          {/* Email */}
          <MessageBlock
            icon={<EmailMsgIcon />}
            label="Email"
            sublabel="Best for warm intros"
            text={emailTemplate}
          />

          {/* LinkedIn */}
          <div style={{ borderTop: '1px solid #f0ece4' }}>
            <MessageBlock
              icon={<LinkedInIcon />}
              label="LinkedIn message"
              sublabel="Connect with local CPAs"
              text={linkedinMessage}
            />
          </div>

          {/* SMS */}
          <div style={{ borderTop: '1px solid #f0ece4' }}>
            <MessageBlock
              icon={<SmsIcon />}
              label="Text message"
              sublabel="Quick and direct"
              text={smsMessage}
            />
          </div>
        </div>

        {/* How it works */}
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#a09a94' }}>
            How it works
          </p>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Share your referral link with another CPA or firm' },
              { step: '2', text: 'They sign up for CloseBooks using your link' },
              { step: '3', text: 'You both receive one free month of your current plan' },
              { step: '4', text: 'No limit — refer as many firms as you like' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}
                >
                  {step}
                </span>
                <p className="text-sm" style={{ color: '#1a1714' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      <AppFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------
// MessageBlock
// ---------------------------------------------------------------------------

function MessageBlock({
  icon, label, sublabel, text,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  text: string
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = text.slice(0, 100) + (text.length > 100 ? '…' : '')
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-sm font-medium" style={{ color: '#1a1714' }}>{label}</p>
            <p className="text-xs" style={{ color: '#a09a94' }}>{sublabel}</p>
          </div>
        </div>
        <CopyButton text={text} />
      </div>
      <div
        className="rounded-lg border p-3 text-xs leading-relaxed cursor-pointer"
        style={{ borderColor: '#f0ece4', backgroundColor: '#faf8f4', color: '#6b6560', whiteSpace: 'pre-wrap' }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? text : preview}
        {text.length > 100 && (
          <span className="ml-1 font-medium" style={{ color: '#b8734a' }}>
            {expanded ? ' Show less' : ' Show more'}
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GiftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="2" y="6" width="12" height="8" rx="1" stroke="#2d5a27" strokeWidth="1.3" fill="none" />
      <path d="M1 6h14M8 6V14" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 6c0-2 2-3 2-3s-1 2-2 3M8 6c0-2-2-3-2-3s1 2 2 3" stroke="#2d5a27" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function EmailMsgIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#6b6560" strokeWidth="1.3" fill="none" />
      <path d="M1 4.5l6 4 6-4" stroke="#6b6560" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0077b5" className="shrink-0">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2" fill="#0077b5"/>
    </svg>
  )
}

function SmsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="#6b6560" strokeWidth="1.3" fill="none" />
      <path d="M4 13l3-3h4" stroke="#6b6560" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5h6M4 7.5h3" stroke="#6b6560" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
