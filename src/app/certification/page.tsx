'use client'

import Link from 'next/link'

const MODULES = [
  {
    num: 1,
    title: 'AI Transaction Categorization',
    hours: 2,
    desc: 'Master how CloseBooks AI works under the hood. Learn to review, validate, and override AI categorizations with confidence. Understand the 85-95% accuracy guarantee and how to handle edge cases.',
    topics: ['How transformer models classify transactions', 'Reading confidence scores and flags', 'Handling ambiguous and split transactions', 'Building custom rules and overrides'],
  },
  {
    num: 2,
    title: 'Month-End Close Mastery',
    hours: 2,
    desc: 'Run complete month-end closes for any client type. Handle exceptions gracefully, communicate with clients about anomalies, and export audit-ready packages in minutes.',
    topics: ['The 5-step CloseBooks close workflow', 'Exception management and escalation', 'Client communication templates', 'Exporting to QuickBooks, Xero, and PDF'],
  },
  {
    num: 3,
    title: 'Tax Strategy with AI',
    hours: 2,
    desc: 'Leverage TaxDraft and the 5-year planning tools to identify opportunities your clients didn\'t know existed. Learn to model scenarios and build multi-year strategies that differentiate your practice.',
    topics: ['TaxDraft annotation review workflow', 'Identifying QBI, cost segregation, and S-Corp opportunities', 'Building 5-year projection models', 'Presenting strategies to business owner clients'],
  },
  {
    num: 4,
    title: 'Client Success Practices',
    hours: 2,
    desc: 'Use Radar, Inbox, and Advisory tools to turn your CloseBooks data into client retention and revenue. Learn how top CloseBooks advisors are adding $50K-$200K in advisory revenue annually.',
    topics: ['Setting up Radar alerts for proactive client outreach', 'Using the AI Advisory memo generator', 'Building an advisory service menu', 'Measuring and communicating your value to clients'],
  },
]

function BadgeAnimation() {
  return (
    <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
      {/* Outer ring */}
      <svg width="200" height="200" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b8734a" />
            <stop offset="50%" stopColor="#d4956a" />
            <stop offset="100%" stopColor="#8b5e3c" />
          </linearGradient>
        </defs>
        {/* Outer decorative ring */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="url(#badgeGrad)" strokeWidth="3" opacity="0.4" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="url(#badgeGrad)" strokeWidth="1" opacity="0.3" />
        {/* Main badge circle */}
        <circle cx="100" cy="100" r="80" fill="#1a1714" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="url(#badgeGrad)" strokeWidth="2" />
        {/* Star decorations */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = 100 + 70 * Math.cos(rad)
          const y = 100 + 70 * Math.sin(rad)
          return <circle key={i} cx={x} cy={y} r="3" fill="#b8734a" opacity="0.6" />
        })}
      </svg>
      {/* Badge content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 4 }}>CloseBooks</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 6 }}>Certified<br />Advisor</div>
        <div style={{ width: 30, height: 1, backgroundColor: '#b8734a', marginBottom: 6 }} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>8 CPE Credits</div>
        <div style={{ fontSize: 9, color: '#b8734a', marginTop: 4, fontWeight: 600 }}>NASBA Approved</div>
      </div>
      <style>{`
        @keyframes rotateBadge {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .badge-ring { animation: rotateBadge 20s linear infinite; transform-origin: center; }
      `}</style>
    </div>
  )
}

export default function CertificationPage() {
  return (
    <div style={{ backgroundColor: '#faf8f4', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e0d4', padding: '0 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>C</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1714' }}>CloseBooks</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/cpa-council" style={{ fontSize: 14, color: '#6b6560', textDecoration: 'none' }}>CPA Council</Link>
            <Link href="/dashboard" style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#2d5a27', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ backgroundColor: '#1a1714', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <BadgeAnimation />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 12 }}>
            NASBA-Approved · 8 CPE Credits
          </div>
          <h1 style={{ fontSize: 50, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Become a CloseBooks<br />Certified Advisor
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 32 }}>
            8 NASBA-approved CPE credits. Prove your mastery of AI-powered accounting to clients, employers, and peers.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/dashboard/certification"
              style={{ padding: '14px 36px', borderRadius: 10, backgroundColor: '#b8734a', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
            >
              Start Certification →
            </Link>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Early access — advisor stories publish with permission only
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>

        {/* Certification Modules */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 10 }}>Curriculum</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1a1714', letterSpacing: '-0.02em' }}>4 Certification Modules</h2>
            <p style={{ fontSize: 15, color: '#6b6560', marginTop: 10 }}>2 hours each · Complete at your own pace · Knowledge checks required to advance</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {MODULES.map(mod => (
              <div key={mod.num} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, padding: 28, display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 24, alignItems: 'start' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#1a1714', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <span style={{ color: '#b8734a', fontSize: 20, fontWeight: 800 }}>{mod.num}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#6b6560', fontWeight: 600 }}>{mod.hours} hrs</div>
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1714', marginBottom: 8 }}>{mod.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.6, marginBottom: 12 }}>{mod.desc}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {mod.topics.map((t, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 12, backgroundColor: '#faf8f4', color: '#6b6560', border: '1px solid #e8e0d4' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#a09a94', marginBottom: 4 }}>CPE Credits</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#2d5a27' }}>2.0</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 80, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ backgroundColor: '#fff', border: '2px solid #2d5a27', borderRadius: 16, padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#2d5a27', textTransform: 'uppercase', marginBottom: 10 }}>For Subscribers</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#1a1714', marginBottom: 4 }}>Free</div>
            <div style={{ fontSize: 14, color: '#6b6560', marginBottom: 24 }}>Included with any CloseBooks plan</div>
            <Link
              href="/dashboard/certification"
              style={{ display: 'block', padding: '12px 24px', borderRadius: 10, backgroundColor: '#2d5a27', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Start Now →
            </Link>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 10 }}>Non-Subscribers</div>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#1a1714', marginBottom: 4 }}>$299</div>
            <div style={{ fontSize: 14, color: '#6b6560', marginBottom: 24 }}>One-time · 8 NASBA CPE credits included</div>
            <Link
              href="/dashboard/certification"
              style={{ display: 'block', padding: '12px 24px', borderRadius: 10, backgroundColor: '#b8734a', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Enroll for $299 →
            </Link>
          </div>
        </div>

        {/* Program facts — no fabricated enrollment counts */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={{ display: 'inline-block', backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 16, padding: '24px 48px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1714', marginBottom: 8 }}>CloseBooks Certified Advisor</div>
            <div style={{ fontSize: 15, color: '#6b6560', maxWidth: 420, lineHeight: 1.6 }}>
              Certification is available to subscribers and non-subscribers. We do not publish enrollment totals or advisor quotes until participants opt in.
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['NASBA Approved', '8 CPE Credits', 'Knowledge checks required'].map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 10, backgroundColor: '#f0fdf4', color: '#2d5a27', fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Early access — customer quotes coming with permission */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: '#1a1714' }}>Advisor stories coming soon</h2>
            <p style={{ fontSize: 15, color: '#6b6560', marginTop: 10, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              We&apos;re onboarding pilot firms now. Certified advisor testimonials will appear here only with written permission.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { title: '4 modules', copy: '2 CPE hours each — categorization, close workflow, tax strategy, and client success.' },
              { title: 'Knowledge checks', copy: 'Advance by passing module quizzes — not click-through completion.' },
              { title: 'Included for subscribers', copy: 'Free with any CloseBooks plan, or $299 one-time for non-subscribers.' },
            ].map((item) => (
              <div key={item.title} style={{ backgroundColor: '#fff', border: '1px solid #e8e0d4', borderRadius: 14, padding: 28, textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1714', marginBottom: 8 }}>{item.title}</div>
                <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.7, margin: 0 }}>{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA Footer */}
      <div style={{ backgroundColor: '#1a1714', padding: '60px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Ready to get certified?</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 28 }}>Start the curriculum in your dashboard — included with your plan or available as a one-time purchase.</p>
        <Link
          href="/dashboard/certification"
          style={{ display: 'inline-block', padding: '14px 40px', borderRadius: 10, backgroundColor: '#b8734a', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
        >
          Start Certification →
        </Link>
        <div style={{ marginTop: 32, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          © 2024 CloseBooks, Inc. · <Link href="/cpa-council" style={{ color: '#b8734a', textDecoration: 'none' }}>CPA Council</Link> · <Link href="/dashboard" style={{ color: '#b8734a', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
