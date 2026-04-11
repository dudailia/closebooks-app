'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { dbEnsureFirm } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Shared input components
// ─────────────────────────────────────────────────────────────────────────────

const baseStyle = { borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }
const focusStyle = { borderColor: '#b8734a', backgroundColor: '#ffffff', boxShadow: '0 0 0 3px rgba(184,115,74,0.12)' }
const inputCls = 'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors'

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  minLength?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        className={inputCls}
        style={focused ? { ...baseStyle, ...focusStyle } : baseStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#1a1714' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={inputCls + ' appearance-none cursor-pointer'}
        style={focused ? { ...baseStyle, ...focusStyle } : baseStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

const FIRM_SIZE_OPTIONS = [
  { value: '1-5',   label: '1–5 people'   },
  { value: '6-15',  label: '6–15 people'  },
  { value: '16-50', label: '16–50 people' },
  { value: '50+',   label: '50+ people'   },
]

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter()
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [firmName,  setFirmName]  = useState('')
  const [firmSize,  setFirmSize]  = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [emailConfirmRequired, setEmailConfirmRequired] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) { setError('Auth not configured.'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          firm_name: firmName,
          firm_size: firmSize,
        },
      },
    })

    if (error) { setError(error.message); setLoading(false); return }

    // If email confirmation is required, the user object will be present but
    // the session will be null. Show a confirmation notice instead of redirecting.
    if (data.user && !data.session) {
      setEmailConfirmRequired(true)
      setLoading(false)
      return
    }

    // Create firm record in Supabase (fire-and-forget — app works without it)
    if (data.user) {
      dbEnsureFirm(firmName || email.split('@')[0], data.user.id).catch(() => {})
    }

    router.push('/dashboard')
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)

    const supabase = createClient()
    if (!supabase) { setError('Auth not configured.'); setGoogleLoading(false); return }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  // ── Email confirmation notice ─────────────────────────────────────────────

  if (emailConfirmRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f4' }}>
        <div className="w-full max-w-md rounded-2xl border p-8 text-center space-y-4" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>
          <LedgerLogo />
          <div className="text-4xl mt-2">📬</div>
          <h1 className="text-xl font-semibold" style={{ color: '#1a1714' }}>Check your email</h1>
          <p className="text-sm" style={{ color: '#6b6560' }}>
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click the link to activate your account and go straight to your dashboard.
          </p>
          <p className="text-xs" style={{ color: '#a09a94' }}>
            Didn&apos;t get it? Check spam or{' '}
            <button onClick={() => setEmailConfirmRequired(false)} className="underline" style={{ color: '#b8734a' }}>
              try again
            </button>
            .
          </p>
          <Link href="/demo" className="inline-block text-sm font-medium mt-2" style={{ color: '#2d5a27' }}>
            While you wait, try the live demo →
          </Link>
        </div>
      </div>
    )
  }

  // ── Unconfigured fallback ──────────────────────────────────────────────────

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#faf8f4' }}>
        <div className="w-full max-w-md rounded-2xl border p-8 text-center" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>
          <LedgerLogo />
          <h1 className="mt-4 text-xl font-semibold" style={{ color: '#1a1714' }}>Auth not configured</h1>
          <p className="mt-2 text-sm" style={{ color: '#6b6560' }}>
            Set <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
            <code className="font-mono text-xs bg-stone-100 px-1 py-0.5 rounded">.env.local</code> to enable sign-up.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#2d5a27' }}
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12" style={{ backgroundColor: '#faf8f4' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 select-none">
            <LedgerLogo />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ backgroundColor: '#ffffff', borderColor: '#e0dbd4' }}>

          <h1
            className="text-2xl mb-1"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Start closing faster
          </h1>
          <p className="text-sm mb-6" style={{ color: '#a09a94' }}>
            Free to try — no credit card required
          </p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border py-2.5 text-sm font-medium transition-colors disabled:opacity-50 mb-5"
            style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#faf8f4' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ebe3' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ backgroundColor: '#e8e0d4' }} />
            <span className="text-xs" style={{ color: '#a09a94' }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#e8e0d4' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                placeholder="Jane Smith"
                autoComplete="name"
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="jane@firm.com"
                autoComplete="email"
              />
            </div>

            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="8+ characters"
              autoComplete="new-password"
              minLength={8}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Firm Name"
                value={firmName}
                onChange={setFirmName}
                placeholder="Smith CPA"
                autoComplete="organization"
              />
              <SelectField
                label="Firm Size"
                value={firmSize}
                onChange={setFirmSize}
                options={FIRM_SIZE_OPTIONS}
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="mt-5 text-sm text-center" style={{ color: '#6b6560' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium" style={{ color: '#b8734a' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#a09a94' }}>
          <Link href="/demo" style={{ color: '#a09a94' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6b6560' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#a09a94' }}
          >
            Try the demo first — no account needed →
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function LedgerLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
        <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
        <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      </svg>
      <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif', fontSize: '20px', letterSpacing: '-0.01em', lineHeight: 1 }}>
        <span style={{ color: '#1a1714' }}>Close</span>
        <span style={{ color: '#b8734a' }}>Books</span>
      </span>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
