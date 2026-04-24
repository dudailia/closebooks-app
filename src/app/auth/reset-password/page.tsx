'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import PublicShell from '@/components/landing/PublicShell'
import {
  DarkCard,
  DarkInput,
  DarkLabel,
  DarkButton,
  DarkError,
} from '@/components/landing/DarkFormPrimitives'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is established from the hash token
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) {
      setError('Auth not configured.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (done) {
    return (
      <PublicShell>
        <main style={{ padding: '120px 24px 60px', maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
          <DarkCard>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#F0F0F5', margin: 0, marginBottom: 10 }}>
              Password updated
            </h1>
            <p style={{ fontSize: 14, color: '#A8A8BC', margin: 0 }}>
              Redirecting to your dashboard…
            </p>
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
              fontFamily: 'var(--font-serif)',
              fontSize: 36,
              letterSpacing: '-0.03em',
              color: '#F0F0F5',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Set a new password
          </h1>
          <p style={{ fontSize: 14, color: '#A8A8BC', margin: '10px 0 0' }}>
            Choose a strong password for your account.
          </p>
        </div>

        <DarkCard>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ marginBottom: 16 }}>
                <DarkError>{error}</DarkError>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <DarkLabel htmlFor="password">New password</DarkLabel>
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

            <div style={{ marginBottom: 20 }}>
              <DarkLabel htmlFor="confirm">Confirm password</DarkLabel>
              <DarkInput
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
            </div>

            <DarkButton type="submit" block disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </DarkButton>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, textAlign: 'center', color: '#A8A8BC' }}>
            <Link href="/login" style={{ color: '#A8A8BC', textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </p>
        </DarkCard>
      </main>
    </PublicShell>
  )
}
