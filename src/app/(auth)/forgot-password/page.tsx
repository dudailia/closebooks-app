'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function friendlyError(msg: string): { title: string; body: string; isRateLimit: boolean; isConfig: boolean } {
  const lower = msg.toLowerCase()

  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('429') || lower.includes('exceeded')) {
    return {
      title: 'Too many requests',
      body: 'Password reset emails are temporarily limited. Please wait 60 minutes before trying again.',
      isRateLimit: true,
      isConfig: false,
    }
  }

  // "Error sending reset password" — Supabase SMTP not configured or redirect URL not whitelisted
  if (
    lower.includes('error sending') ||
    lower.includes('smtp') ||
    lower.includes('sending confirmation') ||
    lower.includes('failed to send') ||
    lower.includes('email not sent') ||
    lower.includes('unable to send')
  ) {
    return {
      title: 'Email delivery unavailable',
      body: 'Our email service is not yet configured. You can still access your account — contact us and we\'ll reset your password immediately.',
      isRateLimit: false,
      isConfig: true,
    }
  }

  if (lower.includes('user not found') || lower.includes('no user')) {
    return {
      title: 'Email not found',
      body: 'No account exists with that email address. Check for typos or sign up for a new account.',
      isRateLimit: false,
      isConfig: false,
    }
  }

  return { title: 'Something went wrong', body: msg, isRateLimit: false, isConfig: false }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [errInfo, setErrInfo] = useState<{ title: string; body: string; isRateLimit: boolean; isConfig: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrInfo(null)

    const supabase = createClient()
    if (!supabase) {
      // No Supabase configured — tell user to contact support
      setErrInfo({
        title: 'Auth not configured',
        body: 'Password reset is not available in demo mode. Please contact support.',
        isRateLimit: false,
      })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)

    if (error) {
      setErrInfo(friendlyError(error.message))
      return
    }

    setSent(true)
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f4' }}>
        <div className="w-full max-w-md rounded-2xl border p-8 text-center space-y-4" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>
          <Logo />
          <h1 className="text-xl font-semibold" style={{ color: '#1a1714' }}>Password reset unavailable</h1>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            This app is running in demo mode without authentication configured.<br />
            You can access all features directly from the dashboard.
          </p>
          <Link href="/dashboard" className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>
            Go to Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12" style={{ backgroundColor: '#faf8f4' }}>
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <Link href="/"><Logo /></Link>
        </div>

        <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <h1 className="text-xl font-semibold" style={{ color: '#1a1714' }}>Check your email</h1>
              <p className="text-sm" style={{ color: '#6b6560' }}>
                We sent a password reset link to <strong>{email}</strong>.
                It should arrive within a minute — check your spam folder if you don&apos;t see it.
              </p>
              <p className="text-xs" style={{ color: '#a09a94' }}>
                Didn&apos;t get it?{' '}
                <button
                  onClick={() => { setSent(false); setErrInfo(null) }}
                  className="underline"
                  style={{ color: '#b8734a', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  Try again
                </button>
              </p>
              <Link
                href="/login"
                className="inline-block text-sm font-medium"
                style={{ color: '#2d5a27' }}
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h1
                className="text-2xl mb-1"
                style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}
              >
                Reset your password
              </h1>
              <p className="text-sm mb-6" style={{ color: '#a09a94' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourfirm.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors"
                    style={{
                      borderColor: focused ? '#b8734a' : '#e0dbd4',
                      color: '#1a1714',
                      backgroundColor: '#faf8f4',
                      fontSize: '16px',
                      boxShadow: focused ? '0 0 0 3px rgba(184,115,74,0.12)' : 'none',
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                </div>

                {/* Error message */}
                {errInfo && (
                  <div
                    className="rounded-xl px-4 py-3 space-y-1"
                    style={{
                      backgroundColor: errInfo.isRateLimit ? '#fffbeb' : errInfo.isConfig ? '#eff6ff' : '#fef2f2',
                      border: `1px solid ${errInfo.isRateLimit ? '#fde68a' : errInfo.isConfig ? '#bfdbfe' : '#fecaca'}`,
                      color: errInfo.isRateLimit ? '#92400e' : errInfo.isConfig ? '#1e40af' : '#991b1b',
                    }}
                  >
                    <p className="text-sm font-semibold">{errInfo.isRateLimit ? '⏳' : errInfo.isConfig ? 'ℹ️' : '⚠'} {errInfo.title}</p>
                    <p className="text-xs" style={{ opacity: 0.85 }}>{errInfo.body}</p>
                    {(errInfo.isRateLimit || errInfo.isConfig) && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium">Your options right now:</p>
                        <p className="text-xs">
                          1.{' '}
                          <a
                            href="mailto:hello@closebooks.app?subject=Password Reset Request&body=Please reset the password for: "
                            className="underline font-semibold"
                            style={{ color: errInfo.isConfig ? '#1d4ed8' : '#92400e' }}
                          >
                            Email us
                          </a>
                          {' '}and we&apos;ll reset it manually within minutes.
                        </p>
                        <p className="text-xs">
                          2. Or{' '}
                          <a href="/signup" className="underline" style={{ color: errInfo.isConfig ? '#1d4ed8' : '#92400e' }}>
                            create a new account
                          </a>
                          {' '}— your demo data is saved in your browser.
                        </p>
                        {errInfo.isConfig && (
                          <p className="text-xs opacity-70">
                            (This is a temporary configuration issue — we&apos;re working on it)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#2d5a27' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-5 text-sm text-center" style={{ color: '#6b6560' }}>
                Remembered it?{' '}
                <Link
                  href="/login"
                  className="font-medium"
                  style={{ color: '#b8734a' }}
                  onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Rate limit info note */}
        <p className="mt-4 text-center text-xs" style={{ color: '#a09a94' }}>
          Having trouble?{' '}
          <a href="mailto:hello@closebooks.app" style={{ color: '#a09a94', textDecoration: 'underline' }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
        <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
      </svg>
      <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '20px', letterSpacing: '-0.01em' }}>
        <span style={{ color: '#1a1714' }}>Close</span><span style={{ color: '#b8734a' }}>Books</span>
      </span>
    </div>
  )
}
