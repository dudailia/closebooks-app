'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { notify } from '@/lib/notify'

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-fade animation hook
// ─────────────────────────────────────────────────────────────────────────────

function useFadeIn(delay = 0) {
  const ref  = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return {
    ref,
    style: {
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section label
// ─────────────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: '#b8734a' }}>
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled,     setScrolled]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '#features',     label: 'Features'     },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#pricing',      label: 'Pricing'      },
    { href: '/portal/demo',  label: 'Portal'       },
  ]

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(250,248,244,0.95)' : 'transparent',
        backdropFilter:  scrolled ? 'blur(12px)'              : 'none',
        borderBottom:    scrolled ? '1px solid #e8e0d4'       : 'none',
        boxShadow:       scrolled ? '0 1px 16px rgba(26,23,20,0.06)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 select-none">
          <LedgerIcon />
          <span
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: 20,
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            <span style={{ color: '#1a1714' }}>Close</span>
            <span style={{ color: '#b8734a' }}>Books</span>
          </span>
        </a>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714'; e.currentTarget.style.backgroundColor = '#f0ece4' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560'; e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: '#c8c0b8', color: '#1a1714' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
          <Link
            href="/get-started"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ color: '#1a1714' }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-1"
          style={{ backgroundColor: 'rgba(250,248,244,0.98)', borderColor: '#e8e0d4', backdropFilter: 'blur(12px)' }}
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm"
              style={{ color: '#1a1714' }}
            >
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/dashboard" className="block text-center py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: '#c8c0b8', color: '#1a1714' }}>
              Sign In
            </Link>
            <Link href="/get-started" className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2d5a27' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative overflow-hidden pt-32 pb-24 px-5"
      style={{ backgroundColor: '#faf8f4' }}
    >
      {/* Subtle radial gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45,90,39,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'linear-gradient(#e8e0d4 1px, transparent 1px), linear-gradient(90deg, #e8e0d4 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">

        {/* Early access badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-8 text-sm"
          style={{ borderColor: '#c4d9c0', backgroundColor: '#f0f5ef', color: '#2d5a27' }}>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: '#2d5a27', animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          Now accepting early access firms
        </div>

        {/* Headline */}
        <h1
          className="mb-6"
          style={{
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: '#1a1714',
          }}
        >
          Close your clients&apos; books<br />
          <span style={{ color: '#2d5a27' }}>in hours, not days</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="mx-auto mb-10 text-lg leading-relaxed"
          style={{ maxWidth: 600, color: '#6b6560' }}
        >
          AI-powered month-end close that auto-categorizes transactions,
          reconciles accounts, and delivers review-ready financials —
          so your firm can serve <strong style={{ color: '#1a1714', fontWeight: 600 }}>3x more clients</strong> without hiring.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
          <Link
            href="/get-started"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md"
            style={{ backgroundColor: '#2d5a27', boxShadow: '0 4px 14px rgba(45,90,39,0.3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Start Free Trial
            <ArrowRightIcon />
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Try Live Demo
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: '#c8c0b8', color: '#1a1714', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            See How It Works
          </a>
        </div>

        {/* Trust note */}
        <p className="text-xs" style={{ color: '#a09a94' }}>
          No credit card required&nbsp;&nbsp;·&nbsp;&nbsp;50% off for early access firms
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats strip
// ─────────────────────────────────────────────────────────────────────────────

function Stats() {
  const fade = useFadeIn()
  const items = [
    { value: '85–95%',  label: 'Auto-categorized'     },
    { value: '50%',     label: 'Faster close'         },
    { value: '3×',      label: 'More clients served'  },
  ]
  return (
    <div ref={fade.ref} style={{ ...fade.style, backgroundColor: '#f0ece4', borderTop: '1px solid #e0dbd4', borderBottom: '1px solid #e0dbd4' }}>
      <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ '--tw-divide-opacity': 1, borderColor: '#e0dbd4' } as React.CSSProperties}>
        {items.map((s) => (
          <div key={s.label} className="flex flex-col items-center py-6 sm:py-0 gap-1">
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                color: '#2d5a27',
                lineHeight: 1,
              }}
            >
              {s.value}
            </span>
            <span className="text-sm font-medium" style={{ color: '#6b6560' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Problem
// ─────────────────────────────────────────────────────────────────────────────

function Problem() {
  const fade  = useFadeIn()
  const items = [
    { num: '40–70%', label: 'Of close time', body: 'spent on manual data entry and transaction categorization — work that adds no value to clients.' },
    { num: '300K',   label: 'Accountants lost', body: 'have left the profession since 2020, creating a talent crisis that\'s only getting worse.' },
    { num: '97%',    label: 'Of small firms', body: 'are not using AI or automation tools for routine close tasks, leaving massive efficiency gains on the table.' },
  ]
  return (
    <section id="problem" className="px-5 py-24" style={{ backgroundColor: '#faf8f4' }}>
      <div className="max-w-6xl mx-auto">
        <div ref={fade.ref} style={fade.style} className="max-w-2xl mb-16">
          <Label>The Problem</Label>
          <h2
            className="text-3xl sm:text-4xl mb-5"
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
            }}
          >
            Your firm is doing the same manual close work it did a decade ago
          </h2>
          <p style={{ color: '#6b6560' }}>
            The accounting profession is at an inflection point. An acute talent shortage, rising client expectations, and
            decades-old workflows have left most CPA firms stretched thin — doing the same tedious month-end work month after month
            with no way to scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <ProblemCard key={item.num} item={item} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PlanCard({ plan, delay }: { plan: typeof PLANS[number]; delay: number }) {
  const f = useFadeIn(delay)
  return (
    <div
      ref={f.ref}
      className="relative rounded-2xl border p-8 flex flex-col"
      style={{ ...f.style, borderColor: plan.popular ? plan.color : '#e8e0d4', backgroundColor: '#ffffff', boxShadow: plan.popular ? '0 8px 32px rgba(45,90,39,0.12)' : 'none', transition: [f.style.transition, 'transform 0.2s, box-shadow 0.2s'].join(', ') }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; if (!plan.popular) e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,23,20,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; if (!plan.popular) e.currentTarget.style.boxShadow = 'none' }}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap" style={{ backgroundColor: plan.color }}>
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: plan.color }}>{plan.name}</p>
        <div className="flex items-end gap-1.5">
          <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '2.6rem', lineHeight: 1, color: '#1a1714' }}>${plan.price}</span>
          <span className="text-sm mb-1.5" style={{ color: '#a09a94' }}>/mo</span>
        </div>
        <p className="text-sm mt-1.5" style={{ color: '#a09a94' }}>{plan.clients}</p>
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm" style={{ color: '#1a1714' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" fill={plan.color} opacity="0.12" />
              <path d="M5 8l2.5 2.5L11 5.5" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {feat}
          </li>
        ))}
      </ul>
      <Link href="/get-started" className="block text-center py-3 rounded-xl text-sm font-semibold text-white transition-opacity" style={{ backgroundColor: plan.color }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}>
        Start Free Trial
      </Link>
    </div>
  )
}

function FeatureCard({ feat, delay }: { feat: { icon: React.ReactNode; title: string; body: string }; delay: number }) {
  const f = useFadeIn(delay)
  return (
    <div
      ref={f.ref}
      style={{ ...f.style, backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '1.75rem', transition: [f.style.transition, 'border-color 0.2s, box-shadow 0.2s, transform 0.2s'].join(', ') }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2d5a27'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(45,90,39,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div className="mb-4 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e8f0e6' }}>
        {feat.icon}
      </div>
      <h3 className="font-semibold mb-2" style={{ color: '#1a1714' }}>{feat.title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{feat.body}</p>
    </div>
  )
}

function StepCard({ step, delay }: { step: { n: string; title: string; body: string; icon: React.ReactNode }; delay: number }) {
  const f = useFadeIn(delay)
  return (
    <div
      ref={f.ref}
      style={{ ...f.style, backgroundColor: '#ffffff', border: '1px solid #e0dbd4', borderRadius: 16, padding: '1.75rem', position: 'relative', overflow: 'hidden', transition: [f.style.transition, 'border-color 0.2s, box-shadow 0.2s, transform 0.2s'].join(', ') }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2d5a27'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,90,39,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0dbd4'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="absolute -top-3 -right-1 select-none pointer-events-none" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '4.5rem', color: '#f0ece4', lineHeight: 1 }}>
        {step.n}
      </div>
      <div className="mb-4 relative z-10" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#e8f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {step.icon}
      </div>
      <h3 className="font-semibold mb-2 text-base relative z-10" style={{ color: '#1a1714' }}>{step.title}</h3>
      <p className="text-sm leading-relaxed relative z-10" style={{ color: '#6b6560' }}>{step.body}</p>
    </div>
  )
}

function ProblemCard({ item, delay }: { item: { num: string; label: string; body: string }; delay: number }) {
  const f = useFadeIn(delay)
  return (
    <div
      ref={f.ref}
      style={{ ...f.style, backgroundColor: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '2rem', transition: [f.style.transition, 'border-color 0.2s, box-shadow 0.2s'].join(', ') }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#b8734a'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(184,115,74,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2.2rem, 4vw, 3rem)', color: '#b8734a', lineHeight: 1, marginBottom: 8 }}>{item.num}</div>
      <div className="text-sm font-semibold mb-2" style={{ color: '#1a1714' }}>{item.label}</div>
      <div className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{item.body}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// How It Works
// ─────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const fade  = useFadeIn()
  const steps = [
    {
      n: '01',
      title: 'Connect or upload',
      body:  'Link bank accounts directly or upload CSV/PDF statements. We handle messy real-world formats — multi-row headers, mixed currencies, all of it.',
      icon:  <UploadStepIcon />,
    },
    {
      n: '02',
      title: 'AI categorizes',
      body:  'Claude maps every transaction to your client\'s Chart of Accounts with 85–95% accuracy, citing its reasoning for every classification.',
      icon:  <BrainIcon />,
    },
    {
      n: '03',
      title: 'Auto-reconcile',
      body:  'Bank data is matched against GL entries automatically. Exceptions surface immediately — you only touch what actually needs attention.',
      icon:  <ReconcileIcon />,
    },
    {
      n: '04',
      title: 'Review & close',
      body:  'Approve AI\'s work in bulk or line-by-line, add notes, then export to QuickBooks, Xero, or generate financials with one click.',
      icon:  <CheckStepIcon />,
    },
  ]

  return (
    <section id="how-it-works" className="px-5 py-24" style={{ backgroundColor: '#f0ece4' }}>
      <div className="max-w-6xl mx-auto">
        <div ref={fade.ref} style={fade.style} className="text-center max-w-2xl mx-auto mb-16">
          <Label>How It Works</Label>
          <h2
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            From raw bank data to close-ready books in 4 steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <StepCard key={step.n} step={step} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo mockup
// ─────────────────────────────────────────────────────────────────────────────

// A 5-row preview used only in the homepage "See it in action" teaser
type PreviewStatus = 'approved' | 'pending' | 'flagged'
const PREVIEW_ROWS: { date: string; desc: string; cat: string; code: string; conf: number; amount: string; credit: boolean; status: PreviewStatus }[] = [
  { date: '03/31', desc: 'GUSTO PAYROLL MAR 16-31',       cat: 'Payroll & Wages',     code: '6010', conf: 99, amount: '14,250.00', credit: false, status: 'approved' },
  { date: '03/29', desc: 'DEPOSIT - CLIENT PMT ACME CORP', cat: 'Service Revenue',     code: '4010', conf: 97, amount: '8,500.00',  credit: true,  status: 'approved' },
  { date: '03/28', desc: 'COMCAST BUSINESS INTERNET',      cat: 'Internet & Phone',    code: '6120', conf: 96, amount: '189.99',    credit: false, status: 'approved' },
  { date: '03/15', desc: 'RESTAURANT - CLIENT DINNER',     cat: 'Meals & Entertainment',code: '6210',conf: 79, amount: '312.80',    credit: false, status: 'pending'  },
  { date: '03/05', desc: 'TRANSFER - UNKNOWN ORIGIN',      cat: 'Miscellaneous Expense',code: '6900',conf: 38, amount: '1,850.00',  credit: false, status: 'flagged'  },
]

const PREVIEW_STATUS: Record<PreviewStatus, { bg: string; text: string; dot: string; label: string }> = {
  approved: { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Approved' },
  pending:  { bg: '#fefce8', text: '#854d0e', dot: '#ca8a04', label: 'Pending'  },
  flagged:  { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444', label: 'Flagged'  },
}

function PreviewRow({ row, i }: { row: typeof PREVIEW_ROWS[number]; i: number }) {
  const s     = PREVIEW_STATUS[row.status]
  const color = row.conf >= 85 ? '#059669' : row.conf >= 70 ? '#d97706' : '#ef4444'
  const bg    = row.conf >= 85 ? '#d1fae5' : row.conf >= 70 ? '#fef3c7' : '#fee2e2'
  return (
    <tr style={{ borderTop: '1px solid #f0ece4', backgroundColor: i % 2 === 0 ? '#ffffff' : '#fdfcfb' }}>
      <td className="px-4 py-3 font-mono text-xs" style={{ color: '#a09a94' }}>{row.date}</td>
      <td className="px-4 py-3 font-medium text-xs" style={{ color: '#1a1714' }}>{row.desc}</td>
      <td className="px-4 py-3">
        <div className="text-xs" style={{ color: '#1a1714' }}>{row.cat}</div>
        <div className="font-mono text-xs" style={{ color: '#a09a94' }}>{row.code}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold w-8 text-right" style={{ color }}>{row.conf}%</span>
          <div className="w-14 h-1.5 rounded-full" style={{ backgroundColor: bg }}>
            <div className="h-full rounded-full" style={{ width: `${row.conf}%`, backgroundColor: color }} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: row.credit ? '#166534' : '#991b1b' }}>
        {row.credit ? '+' : '−'}{row.amount}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: s.bg, color: s.text }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
          {s.label}
        </span>
      </td>
    </tr>
  )
}

function Demo() {
  const fade = useFadeIn()
  return (
    <section id="demo" className="px-5 py-24" style={{ backgroundColor: '#faf8f4' }}>
      <div className="max-w-5xl mx-auto">
        <div ref={fade.ref} style={fade.style} className="text-center mb-12">
          <Label>Live Demo</Label>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            See it in action
          </h2>
          <p className="text-base" style={{ color: '#6b6560' }}>
            This is what your review dashboard looks like after AI categorizes a client&apos;s bank statement.
          </p>
        </div>

        {/* Interactive demo card — click through to /demo */}
        <Link
          href="/demo"
          className="block rounded-2xl overflow-hidden transition-all"
          style={{ border: '1px solid #e0dbd4', boxShadow: '0 20px 60px rgba(26,23,20,0.08)', backgroundColor: '#ffffff', textDecoration: 'none' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 28px 70px rgba(26,23,20,0.13)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(26,23,20,0.08)' }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ backgroundColor: '#f5f0ea', borderColor: '#e0dbd4' }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span className="ml-3 text-xs font-mono" style={{ color: '#a09a94' }}>closebooks.app/demo</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}>
              Live — click to interact
            </span>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f5f0ea', borderBottom: '1px solid #e0dbd4' }}>
                  {['Date', 'Description', 'Category', 'Confidence', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-left" style={{ color: '#6b6560' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROWS.map((row, i) => (
                  <PreviewRow key={i} row={row} i={i} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer CTA strip */}
          <div
            className="flex items-center justify-center gap-3 px-5 py-4 border-t"
            style={{ borderColor: '#f0ece4', backgroundColor: '#f5f0ea' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#2d5a27' }}>
              Try Live Demo →
            </span>
            <span className="text-xs" style={{ color: '#a09a94' }}>
              Approve, flag, edit, export — no sign-up required
            </span>
          </div>
        </Link>

        {/* Secondary CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ backgroundColor: '#2d5a27', boxShadow: '0 4px 14px rgba(45,90,39,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Start free trial — use your own data
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Features
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <SparkleIcon />,
    title: 'AI Transaction Categorization',
    body:  '85–95% auto-matched using your client\'s Chart of Accounts. Claude explains its reasoning for every classification, so you can trust or correct with confidence.',
  },
  {
    icon: <ReconcileIcon />,
    title: 'Smart Reconciliation',
    body:  'Bank data matched against GL entries automatically. Differences surface immediately — you only review what genuinely needs human judgment.',
  },
  {
    icon: <LinkFeatureIcon />,
    title: 'Client Portal',
    body:  'Clients upload bank statements through a simple shareable link — no login, no friction. You get the documents. They get a confirmation. Done.',
  },
  {
    icon: <ExportIcon />,
    title: 'QuickBooks & Xero Export',
    body:  'One-click export in compatible formats. Drop the CSV into QuickBooks, Xero, or any GL system. No manual reformatting, ever.',
  },
  {
    icon: <DashboardIcon />,
    title: 'Review Dashboard',
    body:  'See only the exceptions. Approve high-confidence transactions in bulk. Drill into anything flagged. Close faster without missing anything.',
  },
  {
    icon: <ClientsFeatureIcon />,
    title: 'Multi-Client Support',
    body:  'Manage all your clients from one dashboard. Track close status, review progress, and export — firm-wide visibility at a glance.',
  },
]

function Features() {
  const fade = useFadeIn()
  return (
    <section id="features" className="px-5 py-24" style={{ backgroundColor: '#f0ece4' }}>
      <div className="max-w-6xl mx-auto">
        <div ref={fade.ref} style={fade.style} className="text-center max-w-xl mx-auto mb-16">
          <Label>Features</Label>
          <h2
            className="text-3xl sm:text-4xl"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            Everything your firm needs to close faster
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <FeatureCard key={feat.title} feat={feat} delay={i * 60} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name:    'Starter',
    price:   99,
    clients: '20 clients',
    color:   '#6b6560',
    popular: false,
    features: ['Up to 20 clients', '1,000 transactions / mo', 'AI categorization', 'QuickBooks CSV export', 'Client portal', 'Email support'],
  },
  {
    name:    'Growth',
    price:   249,
    clients: '75 clients',
    color:   '#2d5a27',
    popular: true,
    features: ['Up to 75 clients', '10,000 transactions / mo', 'AI categorization', 'QuickBooks & Xero export', 'Client portal', 'Priority support', '5 team members', 'Confidence review dashboard'],
  },
  {
    name:    'Scale',
    price:   499,
    clients: 'Unlimited',
    color:   '#b8734a',
    popular: false,
    features: ['Unlimited clients', 'Unlimited transactions', 'AI categorization', 'All export formats', 'Client portal', 'Dedicated account manager', 'Unlimited team members', 'API access & custom integrations'],
  },
]

function Pricing() {
  const fade = useFadeIn()
  return (
    <section id="pricing" className="px-5 py-24" style={{ backgroundColor: '#faf8f4' }}>
      <div className="max-w-5xl mx-auto">
        <div ref={fade.ref} style={fade.style} className="text-center max-w-xl mx-auto mb-4">
          <Label>Pricing</Label>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            Simple, honest pricing
          </h2>
          <p className="text-base" style={{ color: '#6b6560' }}>
            14-day free trial on every plan. Cancel any time.
          </p>
        </div>

        {/* Early access callout */}
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: '#fdf2e9', color: '#b8734a', border: '1px solid #f0c8a8' }}
          >
            <span>🎉</span>
            Early access firms get <strong>50% off for life</strong> — limited to first 50 firms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Social proof
// ─────────────────────────────────────────────────────────────────────────────

function SocialProof() {
  const fade = useFadeIn()
  return (
    <section className="px-5 py-24" style={{ backgroundColor: '#2d5a27' }}>
      <div ref={fade.ref} style={fade.style} className="max-w-3xl mx-auto text-center">
        <div
          className="text-4xl mb-8 select-none"
          style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.3)', fontSize: '5rem', lineHeight: 1 }}
        >
          &ldquo;
        </div>
        <blockquote
          className="text-xl sm:text-2xl leading-relaxed mb-8"
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          If firms could just get the right documents and auto-categorize transactions,
          month-end close would be a breeze.
        </blockquote>
        <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
          — Common sentiment from CPA firm owners nationwide
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="text-center">
            <div style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '2.2rem', color: '#ffffff', lineHeight: 1 }}>46,000+</div>
            <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>small CPA firms in the US</div>
          </div>
          <div className="w-px h-12 hidden sm:block" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div className="text-center">
            <div style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '2.2rem', color: '#ffffff', lineHeight: 1 }}>NEU</div>
            <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Built at Northeastern University</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Waitlist
// ─────────────────────────────────────────────────────────────────────────────

function Waitlist() {
  const fade  = useFadeIn()
  const [email,     setEmail]     = useState('')
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('https://formspree.io/f/xdapwdpn', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
        notify('Waitlist signup', { email })
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error ?? 'Something went wrong. Try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section id="waitlist" className="px-5 py-24" style={{ backgroundColor: '#faf8f4' }}>
      <div className="max-w-lg mx-auto text-center">
        <div ref={fade.ref} style={fade.style}>
          <Label>Early Access</Label>
          <h2
            className="text-3xl sm:text-4xl mb-4"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714', letterSpacing: '-0.025em', lineHeight: 1.15 }}
          >
            Be one of the first 50 firms
          </h2>
          <p className="text-base mb-8" style={{ color: '#6b6560' }}>
            Early access firms get <strong style={{ color: '#b8734a' }}>50% off for life</strong> and direct input
            on what we build next. We&apos;re onboarding firms one by one.
          </p>

          {status === 'success' ? (
            <div
              className="rounded-2xl px-8 py-8 text-center"
              style={{ backgroundColor: '#f0f5ef', border: '1px solid #c4d9c0' }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e8f0e6' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                  <path d="M5 13l6 6L21 7" stroke="#2d5a27" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-semibold mb-1" style={{ color: '#1a1714' }}>You&apos;re on the list!</p>
              <p className="text-sm" style={{ color: '#6b6560' }}>We&apos;ll be in touch within 48 hours to set up your firm.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@firm.com"
                className="flex-1 px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: '#e0dbd4', backgroundColor: '#ffffff', color: '#1a1714' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e0dbd4' }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 whitespace-nowrap"
                style={{ backgroundColor: '#2d5a27' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                {status === 'loading' ? 'Joining…' : 'Join Waitlist'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="text-xs mt-2 text-center" style={{ color: '#dc2626' }}>{errorMsg}</p>
          )}

          <p className="text-xs mt-4" style={{ color: '#a09a94' }}>
            No spam, ever. Unsubscribe any time.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t px-5 py-12" style={{ backgroundColor: '#1a1714', borderColor: '#2a2520' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-10">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 select-none">
            <LedgerIconLight />
            <span style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 18, lineHeight: 1 }}>
              <span style={{ color: '#ffffff' }}>Close</span>
              <span style={{ color: '#c8906a' }}>Books</span>
            </span>
          </a>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              ['#features',       'Features'      ],
              ['#pricing',        'Pricing'        ],
              ['/dashboard',      'Dashboard'      ],
              ['/portal/demo',    'Client Portal'  ],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm transition-colors" style={{ color: '#6b6560' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560' }}>
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6" style={{ borderColor: '#2a2520' }}>
          <p className="text-xs" style={{ color: '#6b6560' }}>© 2026 CloseBooks. Built at Northeastern University.</p>
          <p className="text-xs" style={{ color: '#4a4540' }}>Made for CPAs who deserve better tools.</p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#faf8f4' }}>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Problem />
        <HowItWorks />
        <Demo />
        <Features />
        <Pricing />
        <SocialProof />
        <Waitlist />
      </main>
      <Footer />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

function LedgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#b8734a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#b8734a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#b8734a" opacity="0.15" />
      <path d="M14 7h3M14 10h3M14 13h2" stroke="#b8734a" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function LedgerIconLight() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="1" width="13" height="17" rx="2" stroke="#c8906a" strokeWidth="1.5" fill="none" />
      <path d="M6 6h5M6 10h5M6 14h3" stroke="#c8906a" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="13" y="4" width="5" height="13" rx="1.5" fill="#c8906a" opacity="0.15" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function UploadStepIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 13V5M7 8l3-3 3 3" stroke="#2d5a27" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3a3.5 3.5 0 00-3.5 3.5c0 .8.27 1.54.72 2.12A3.5 3.5 0 007 14.5V16h6v-1.5a3.5 3.5 0 00-.22-5.88c.45-.58.72-1.32.72-2.12A3.5 3.5 0 0010 3z" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
      <path d="M8 10h4M9 13h2" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function ReconcileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M4 6h8M4 14h6" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="14" r="3" stroke="#2d5a27" strokeWidth="1.4" />
      <path d="M13.5 14l1 1 2-1.5" stroke="#2d5a27" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckStepIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="3" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
      <path d="M7 10l2.5 2.5L13 7.5" stroke="#2d5a27" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3l1.5 4.5L16 10l-4.5 1.5L10 17l-1.5-5.5L4 10l4.5-1.5L10 3z" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function LinkFeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M8 12a4 4 0 005.66 0l2-2a4 4 0 00-5.66-5.66L9 5.5" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 8a4 4 0 00-5.66 0l-2 2a4 4 0 005.66 5.66L11 14.5" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M13 8l3 3-3 3" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 11H9a4 4 0 010-8H11" stroke="#2d5a27" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 15h12" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="#2d5a27" strokeWidth="1.4" fill="none" />
    </svg>
  )
}

function ClientsFeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="6" r="2.5" stroke="#2d5a27" strokeWidth="1.4" />
      <path d="M3 15c0-2.5 2-4.5 4.5-4.5S12 12.5 12 15" stroke="#2d5a27" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2" stroke="#2d5a27" strokeWidth="1.3" />
      <path d="M16 15c0-1.9-1.3-3.4-3-3.9" stroke="#2d5a27" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
