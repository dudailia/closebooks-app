'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { dbEnsureFirm } from '@/lib/db'
import { loadFirmSettings, saveFirmSettings } from '@/lib/firmSettings'
import PublicShell from '@/components/landing/PublicShell'
import {
  DarkCard,
  DarkInput,
  DarkSelect,
  DarkLabel,
  DarkButton,
  DarkDivider,
  DarkError,
  GoogleIcon,
} from '@/components/landing/DarkFormPrimitives'
import { TIERS } from '@/lib/landing/tiers'

const FIRM_SIZE_OPTIONS = [
  { value: '1-5', label: '1–5 people' },
  { value: '6-15', label: '6–15 people' },
  { value: '16-50', label: '16–50 people' },
  { value: '50+', label: '50+ people' },
]

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planSlug = searchParams.get('plan')
  const billing = searchParams.get('billing')
  const selectedTier = TIERS.find((t) => t.id === planSlug) ?? null

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firmName, setFirmName] = useState('')
  const [firmSize, setFirmSize] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) {
      if (firmName) {
        void saveFirmSettings({ ...loadFirmSettings(), firmName, preparedBy: fullName })
      }
      router.push('/dashboard')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          firm_name: firmName,
          firm_size: firmSize,
          selected_plan: planSlug ?? undefined,
          selected_billing: billing ?? undefined,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setEmailConfirmRequired(true)
      setLoading(false)
      return
    }

    if (data.user) {
      dbEnsureFirm(firmName || email.split('@')[0], data.user.id).catch(() => {})
    }

    // If a plan was pre-selected, route to /pricing for checkout
    if (planSlug) {
      router.push('/pricing')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) {
      router.push('/dashboard')
      return
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) {
      setError(authError.message)
      setGoogleLoading(false)
    }
  }

  if (emailConfirmRequired) {
    return (
      <PublicShell>
        <main style={{ padding: '120px 24px 60px', maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
          <DarkCard>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#FAFAFA', margin: 0, marginBottom: 10 }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: '#888888', margin: 0, lineHeight: 1.55 }}>
              We sent a confirmation link to <strong style={{ color: '#FAFAFA' }}>{email}</strong>.
              Click it to activate your account and continue to your dashboard.
            </p>
            <p style={{ fontSize: 12, color: '#444444', marginTop: 14 }}>
              Didn&apos;t get it? Check spam or{' '}
              <button
                onClick={() => setEmailConfirmRequired(false)}
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
          </DarkCard>
        </main>
      </PublicShell>
    )
  }

  if (!supabaseConfigured) {
    if (typeof window !== 'undefined') {
      if (firmName) {
        void saveFirmSettings({ ...loadFirmSettings(), firmName, preparedBy: fullName })
      }
      window.location.href = '/dashboard'
    }
    return (
      <PublicShell>
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 14, color: '#444444' }}>Setting up your account…</p>
        </main>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 60px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 40,
              letterSpacing: '-0.03em',
              color: '#FAFAFA',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Start closing faster
          </h1>
          <p style={{ fontSize: 14, color: '#888888', margin: '10px 0 0' }}>
            Free to try — no credit card required
          </p>
        </div>

        <DarkCard>
          {selectedTier && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                backgroundColor: 'rgba(0,200,83,0.08)',
                border: '1px solid rgba(0,200,83,0.24)',
                marginBottom: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: '#FAFAFA' }}>
                Starting <strong>{selectedTier.name}</strong>
                {billing === 'annual' ? ' · Annual (20% off)' : ' · Monthly'}
              </p>
              <Link
                href="/pricing"
                style={{ fontSize: 12, color: '#00C853', textDecoration: 'none' }}
              >
                Change plan
              </Link>
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16 }}>
              <DarkError>{error}</DarkError>
            </div>
          )}

          <DarkButton variant="ghost" block onClick={handleGoogle} disabled={googleLoading || loading}>
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </DarkButton>

          <DarkDivider label="or" />

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <DarkLabel htmlFor="fullName">Full Name</DarkLabel>
                <DarkInput
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <DarkLabel htmlFor="email">Email</DarkLabel>
                <DarkInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="jane@firm.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <DarkLabel htmlFor="password">Password</DarkLabel>
              <DarkInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="8+ characters"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <DarkLabel htmlFor="firmName">Firm Name</DarkLabel>
                <DarkInput
                  id="firmName"
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  required
                  autoComplete="organization"
                  placeholder="Smith CPA"
                />
              </div>
              <div>
                <DarkLabel htmlFor="firmSize">Firm Size</DarkLabel>
                <DarkSelect
                  id="firmSize"
                  value={firmSize}
                  onChange={(e) => setFirmSize(e.target.value)}
                  required
                >
                  <option value="" disabled>Select…</option>
                  {FIRM_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ backgroundColor: '#0f0f0f', color: '#FAFAFA' }}>
                      {o.label}
                    </option>
                  ))}
                </DarkSelect>
              </div>
            </div>

            <DarkButton type="submit" block disabled={loading || googleLoading}>
              {loading ? 'Creating account…' : 'Create free account'}
            </DarkButton>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, textAlign: 'center', color: '#888888' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#00C853', textDecoration: 'none', fontWeight: 600 }}>
              Sign in →
            </Link>
          </p>
        </DarkCard>

        <p style={{ marginTop: 20, fontSize: 12, textAlign: 'center', color: '#444444' }}>
          <Link href="/demo" style={{ color: '#444444', textDecoration: 'none' }}>
            Try the live demo first — no account needed →
          </Link>
        </p>
      </main>
    </PublicShell>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <PublicShell>
          <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 14, color: '#444444' }}>Loading…</p>
          </main>
        </PublicShell>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
