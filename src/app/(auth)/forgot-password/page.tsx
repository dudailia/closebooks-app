'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) { setError('Auth not configured.'); setLoading(false); return }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f4' }}>
        <div className="w-full max-w-md rounded-2xl border p-8 text-center" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>
          <Logo />
          <h1 className="mt-4 text-xl font-semibold" style={{ color: '#1a1714' }}>Auth not configured</h1>
          <p className="mt-2 text-sm" style={{ color: '#6b6560' }}>Configure Supabase to enable password reset.</p>
          <Link href="/login" className="mt-6 inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#faf8f4' }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo /></Link>
        </div>

        <div className="rounded-2xl border p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <h1 className="text-xl font-semibold" style={{ color: '#1a1714' }}>Check your email</h1>
              <p className="text-sm" style={{ color: '#6b6560' }}>
                We sent a password reset link to <strong>{email}</strong>. Check your inbox — it should arrive within a minute.
              </p>
              <p className="text-xs" style={{ color: '#a09a94' }}>
                Didn&apos;t get it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="underline" style={{ color: '#b8734a' }}>try again</button>.
              </p>
              <Link href="/login" className="inline-block mt-4 text-sm font-medium" style={{ color: '#2d5a27' }}>
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}>
                Reset your password
              </h1>
              <p className="text-sm mb-6" style={{ color: '#a09a94' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourfirm.com"
                    required
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                    style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#b8734a' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e0dbd4' }}
                  />
                </div>

                {error && (
                  <div className="rounded-lg px-3 py-2.5 text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#2d5a27' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-5 text-sm text-center" style={{ color: '#6b6560' }}>
                Remembered it?{' '}
                <Link href="/login" className="font-medium" style={{ color: '#b8734a' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

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
