'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import PublicShell from '@/components/landing/PublicShell'
import {
  DarkCard,
  DarkInput,
  DarkLabel,
  DarkButton,
  DarkError,
} from '@/components/landing/DarkFormPrimitives'

interface ErrInfo {
  title: string
  body: string
  isRateLimit: boolean
  isConfig: boolean
}

function friendlyError(msg: string): ErrInfo {
  const lower = msg.toLowerCase()

  if (
    lower.includes('rate limit') ||
    lower.includes('too many') ||
    lower.includes('429') ||
    lower.includes('exceeded')
  ) {
    return {
      title: 'Too many requests',
      body: 'Password reset emails are temporarily limited. Please wait 60 minutes before trying again.',
      isRateLimit: true,
      isConfig: false,
    }
  }

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
      body: "Our email service is not yet configured. You can still access your account — contact us and we'll reset your password immediately.",
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [errInfo, setErrInfo] = useState<ErrInfo | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrInfo(null)

    const supabase = createClient()
    if (!supabase) {
      setErrInfo({
        title: 'Auth not configured',
        body: 'Password reset is not available in demo mode. Please contact support.',
        isRateLimit: false,
        isConfig: true,
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
      <PublicShell>
        <main style={{ padding: '120px 24px 60px', maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
          <DarkCard>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#FAFAFA', margin: 0, marginBottom: 10 }}>
              Password reset unavailable
            </h1>
            <p style={{ fontSize: 14, color: '#888888', margin: 0, lineHeight: 1.55 }}>
              This app is running in demo mode without authentication configured. You can access
              all features directly from the dashboard.
            </p>
            <div style={{ marginTop: 18 }}>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  padding: '11px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#000',
                  background: '#00C853',
                  boxShadow: '0 6px 28px rgba(0,200,83,0.35)',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                Go to Dashboard →
              </Link>
            </div>
          </DarkCard>
        </main>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 60px', maxWidth: 460, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              letterSpacing: '-0.03em',
              color: '#FAFAFA',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Reset your password
          </h1>
          <p style={{ fontSize: 14, color: '#888888', margin: '10px 0 0' }}>
            We&apos;ll send you a secure reset link.
          </p>
        </div>

        <DarkCard>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#FAFAFA', margin: 0, marginBottom: 10 }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 14, color: '#888888', margin: 0, lineHeight: 1.55 }}>
                We sent a reset link to <strong style={{ color: '#FAFAFA' }}>{email}</strong>. It
                should arrive within a minute.
              </p>
              <p style={{ fontSize: 12, color: '#444444', marginTop: 14 }}>
                Didn&apos;t get it? Check spam or{' '}
                <button
                  onClick={() => {
                    setSent(false)
                    setErrInfo(null)
                  }}
                  style={{
                    color: '#00C853',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: 12,
                  }}
                >
                  try again
                </button>
                .
              </p>
              <div style={{ marginTop: 18 }}>
                <Link
                  href="/login"
                  style={{ fontSize: 13, color: '#888888', textDecoration: 'none' }}
                >
                  ← Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errInfo && (
                <div style={{ marginBottom: 16 }}>
                  <DarkError>
                    <strong>
                      {errInfo.isRateLimit ? '⏳ ' : errInfo.isConfig ? 'ℹ ' : '⚠ '}
                      {errInfo.title}
                    </strong>
                    <div style={{ marginTop: 4, opacity: 0.85 }}>{errInfo.body}</div>
                    {(errInfo.isRateLimit || errInfo.isConfig) && (
                      <div style={{ marginTop: 8, fontSize: 12 }}>
                        <a
                          href="mailto:hello@closebooks.app?subject=Password Reset Request"
                          style={{ color: '#00C853', textDecoration: 'underline' }}
                        >
                          Email us
                        </a>{' '}
                        and we&apos;ll reset it manually within minutes.
                      </div>
                    )}
                  </DarkError>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <DarkLabel htmlFor="email">Email address</DarkLabel>
                <DarkInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  placeholder="you@yourfirm.com"
                />
              </div>

              <DarkButton type="submit" block disabled={loading || !email.trim()}>
                {loading ? 'Sending…' : 'Send reset link'}
              </DarkButton>

              <p style={{ marginTop: 20, fontSize: 13, textAlign: 'center', color: '#888888' }}>
                Remembered it?{' '}
                <Link href="/login" style={{ color: '#00C853', textDecoration: 'none', fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </DarkCard>

        <p style={{ marginTop: 20, fontSize: 12, textAlign: 'center', color: '#444444' }}>
          Having trouble?{' '}
          <a href="mailto:hello@closebooks.app" style={{ color: '#444444', textDecoration: 'underline' }}>
            Contact support
          </a>
        </p>
      </main>
    </PublicShell>
  )
}
