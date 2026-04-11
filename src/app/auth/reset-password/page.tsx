'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Supabase sends the reset token in the URL hash — the client SDK reads it automatically
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    // Listen for PASSWORD_RECOVERY event which fires when the hash token is valid
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is authenticated with a temporary session — they can now update password
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) { setError('Auth not configured.'); setLoading(false); return }

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f4' }}>
        <div className="w-full max-w-md rounded-2xl border p-8 text-center space-y-4" style={{ backgroundColor: '#fff', borderColor: '#e0dbd4' }}>
          <div className="text-4xl">✓</div>
          <h1 className="text-xl font-semibold" style={{ color: '#1a1714' }}>Password updated</h1>
          <p className="text-sm" style={{ color: '#6b6560' }}>Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#faf8f4' }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <div className="flex items-center gap-2.5">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
                <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '20px' }}>
                <span style={{ color: '#1a1714' }}>Close</span><span style={{ color: '#b8734a' }}>Books</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="rounded-2xl border p-8" style={{ backgroundColor: '#fff', borderColor: '#e0dbd4' }}>
          <h1 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.02em' }}>
            Set new password
          </h1>
          <p className="text-sm mb-6" style={{ color: '#a09a94' }}>Choose a strong password for your account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'New Password', value: password, onChange: setPassword, autoComplete: 'new-password' },
              { label: 'Confirm Password', value: confirm, onChange: setConfirm, autoComplete: 'new-password' },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={e => f.onChange(e.target.value)}
                  placeholder="8+ characters"
                  required
                  minLength={8}
                  autoComplete={f.autoComplete}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#b8734a' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e0dbd4' }}
                />
              </div>
            ))}

            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
