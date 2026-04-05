import Link from 'next/link'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const firmName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    title: `${firmName} invites you to try CloseBooks`,
    description: 'Your colleague thinks you\'d love CloseBooks — AI-powered month-end close for CPA firms. Start your free trial today.',
  }
}

export default function ReferralLandingPage({ params }: Props) {
  const firmName = params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const stats = [
    { value: '72%', label: 'of transactions auto-categorized on average' },
    { value: '3.5 hrs', label: 'saved per client per month' },
    { value: '94%', label: 'average AI categorization accuracy' },
  ]

  const features = [
    {
      icon: '🤖',
      title: 'AI categorization in minutes',
      desc: 'Upload a bank statement and watch the AI categorize every transaction — with confidence scores and reasoning.',
    },
    {
      icon: '📊',
      title: 'Industry benchmarks built-in',
      desc: 'See how your clients compare to industry peers on labor, rent, marketing, and more.',
    },
    {
      icon: '📄',
      title: 'One-click reports and exports',
      desc: 'Generate branded client summaries, close reports, and QuickBooks-ready CSV exports instantly.',
    },
    {
      icon: '🔍',
      title: 'Anomaly detection and audit trail',
      desc: 'CloseBooks flags unusual transactions and keeps a complete audit trail of every decision.',
    },
  ]

  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e8e0d4', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 13V6l5-4 5 4v7H3z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
              <rect x="6" y="9" width="4" height="4" rx="0.5" fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1714' }}>CloseBooks</span>
        </div>
        <Link
          href="/get-started"
          style={{
            backgroundColor: '#2d5a27', color: '#ffffff', borderRadius: 10,
            padding: '7px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          Start Free Trial
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '64px 24px 40px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '6px 14px', borderRadius: 99,
          backgroundColor: '#e8f0e6', color: '#2d5a27', fontSize: 13, fontWeight: 500, marginBottom: 20,
        }}>
          🎁 {firmName} thinks you&apos;d love this
        </div>

        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: '#1a1714', letterSpacing: '-0.03em', lineHeight: 1.15,
          margin: '0 0 16px',
        }}>
          AI-powered month-end close<br />for CPA firms
        </h1>

        <p style={{ fontSize: 16, color: '#6b6560', lineHeight: 1.7, margin: '0 0 32px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          CloseBooks categorizes your clients&apos; transactions automatically, generates branded reports, and cuts your close time by 72%. Your first month is free thanks to {firmName}.
        </p>

        <Link
          href="/get-started"
          style={{
            display: 'inline-block', backgroundColor: '#2d5a27', color: '#ffffff',
            borderRadius: 12, padding: '14px 32px', fontSize: 15, fontWeight: 700,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}
        >
          Start your free trial — first month free →
        </Link>
        <p style={{ fontSize: 12, color: '#a09a94', marginTop: 12 }}>No credit card required · Cancel anytime</p>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 700, margin: '0 auto 48px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {stats.map(({ value, label }) => (
            <div
              key={value}
              style={{
                backgroundColor: '#ffffff', border: '1px solid #e8e0d4',
                borderRadius: 12, padding: '20px 16px', textAlign: 'center',
              }}
            >
              <p style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: '#2d5a27', margin: '0 0 6px' }}>
                {value}
              </p>
              <p style={{ fontSize: 12, color: '#6b6560', margin: 0, lineHeight: 1.4 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 700, margin: '0 auto 64px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1714', letterSpacing: '-0.02em', margin: '0 0 24px', textAlign: 'center' }}>
          What CloseBooks does for you
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{
                backgroundColor: '#ffffff', border: '1px solid #e8e0d4',
                borderRadius: 12, padding: '20px',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1714', margin: '0 0 6px' }}>{title}</p>
              <p style={{ fontSize: 13, color: '#6b6560', margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 700, margin: '0 auto 64px', padding: '0 24px' }}>
        <div style={{
          backgroundColor: '#f6faf5', border: '1px solid #d4e8d0',
          borderRadius: 16, padding: '36px 32px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#2d5a27', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Referred by {firmName}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1714', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            Your first month is free
          </h2>
          <p style={{ fontSize: 14, color: '#6b6560', margin: '0 0 24px' }}>
            Sign up through this link and both you and {firmName} get a free month. No catch.
          </p>
          <Link
            href="/get-started"
            style={{
              display: 'inline-block', backgroundColor: '#2d5a27', color: '#ffffff',
              borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Start Free Trial →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e8e0d4', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#a09a94', margin: 0 }}>
          © 2025 CloseBooks · AI-Powered Month-End Close ·{' '}
          <Link href="/" style={{ color: '#2d5a27', textDecoration: 'none' }}>closebooks-app.vercel.app</Link>
        </p>
      </div>
    </div>
  )
}
