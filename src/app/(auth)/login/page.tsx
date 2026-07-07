'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import PublicShell from '@/components/landing/PublicShell'
import Button from '@/components/ui/Button'
import {
  DarkCard,
  DarkInput,
  DarkLabel,
  DarkDivider,
  DarkError,
  GoogleIcon,
} from '@/components/landing/DarkFormPrimitives'

/** Matches legacy DarkButton dimensions for pixel parity on auth surfaces. */
const authButtonSize = { padding: '12px 18px', fontSize: 14, borderRadius: 10 } as const

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) {
      router.replace('/dashboard')
    }
  }, [router])

  useEffect(() => {
    if (searchParams.get('reason') !== 'idle') return
    const supabase = createClient()
    void supabase?.auth.signOut()
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) {
      router.push('/dashboard')
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setLoading(false)
      if (authError.message.toLowerCase().includes('invalid login')) {
        setError('Incorrect email or password. Please try again.')
      } else if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError('Please check your email and click the confirmation link first.')
      } else {
        setError(authError.message)
      }
      return
    }

    router.push(nextPath)
    router.refresh()
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
    if (authError) {
      setError(authError.message)
      setGoogleLoading(false)
    }
  }

  if (!supabaseConfigured) {
    return (
      <PublicShell>
        <main style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 14, color: '#444444' }}>Redirecting…</p>
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
              fontSize: 40,
              letterSpacing: '-0.03em',
              color: '#FAFAFA',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#888888', margin: '10px 0 0' }}>
            Sign in to continue closing books.
          </p>
        </div>

        <DarkCard>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <DarkError>{error}</DarkError>
            </div>
          )}

          <Button
            variant="brand-ghost"
            fullWidth
            style={authButtonSize}
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </Button>

          <DarkDivider label="or" />

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 14 }}>
              <DarkLabel htmlFor="email">Email</DarkLabel>
              <DarkInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                placeholder="you@yourfirm.com"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <DarkLabel htmlFor="password">Password</DarkLabel>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 12, color: '#00C853', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <DarkInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="brand"
              fullWidth
              style={authButtonSize}
              disabled={loading || googleLoading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, textAlign: 'center', color: '#888888' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#00C853', textDecoration: 'none', fontWeight: 600 }}>
              Start free →
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

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  )
}
