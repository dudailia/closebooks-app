'use client'

import { useState } from 'react'
import Link from 'next/link'

const COUNCIL_MEMBERS = [
  { initials: 'JT', name: 'James A. Thornton, CPA', role: 'Partner', firm: 'Thornton & Associates', location: 'Chicago, IL', years: 28, color: '#2d5a27' },
  { initials: 'SK', name: 'Dr. Sarah Kim, CPA, PhD', role: 'Professor of Accounting', firm: 'NYU Stern School of Business', location: 'New York, NY', years: 22, color: '#b8734a' },
  { initials: 'MR', name: 'Michael Rodriguez, CPA', role: 'Managing Partner', firm: 'Rodriguez Tax Group', location: 'Miami, FL', years: 19, color: '#1e40af' },
  { initials: 'LA', name: 'Linda Ashford, CPA, CFP', role: 'Director of Tax Services', firm: 'Ashford & Bell LLP', location: 'Dallas, TX', years: 24, color: '#6b21a8' },
  { initials: 'DW', name: 'David Wei, CPA, MST', role: 'Principal', firm: 'Pacific Rim Tax Advisors', location: 'San Francisco, CA', years: 17, color: '#0369a1' },
  { initials: 'RP', name: 'Rachel Patel, CPA', role: 'Founder & CEO', firm: 'Patel Advisory Group', location: 'Atlanta, GA', years: 14, color: '#92400e' },
]

const BENEFITS = [
  { icon: '◈', title: 'Equity Stake in CloseBooks', desc: '0.01% equity grant vesting over 2 years. Share in the upside as AI transforms accounting.' },
  { icon: '◉', title: 'Direct Product Roadmap Access', desc: 'Monthly calls with our engineering team. Your feedback shapes what gets built next.' },
  { icon: '◆', title: '"Founding Council Member" Badge', desc: 'Permanent distinction on your CloseBooks public profile and in all marketing materials.' },
  { icon: '◎', title: 'Speaking at CloseBooks Summit', desc: 'Priority selection for keynotes, panels, and workshops at our annual CPA Summit.' },
  { icon: '◇', title: '$0 Lifetime Subscription', desc: 'Full access to every CloseBooks feature, every tier, forever — including future products.' },
]

const CRITERIA = [
  'AICPA member in good standing with no disciplinary history',
  '10+ years of active public accounting practice',
  'Forward-thinking perspective on technology adoption',
  'Willing to champion CloseBooks publicly (case studies, referrals)',
  'Minimum 5 active business clients in your practice',
]

export default function CPACouncilPage() {
  const [form, setForm] = useState({ name: '', firm: '', years: '', license: '', why: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div data-theme="dark" style={{ backgroundColor: '#080808', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#080808', borderBottom: '1px solid #1f1f1f', padding: '0 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#00C853', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#080808', fontSize: 14, fontWeight: 700 }}>C</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#FAFAFA' }}>CloseBooks</span>
          </Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/certification" style={{ fontSize: 14, color: '#888888', textDecoration: 'none' }}>Certification</Link>
            <Link href="/dashboard" style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#00C853', color: '#080808', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #b8734a 0%, #8b5e3c 50%, #6b4529 100%)',
        padding: '80px 32px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase' }}>
            Applications Open · 50 Founding Seats
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Shape the Future<br />of Accounting
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 32 }}>
            50 founding CPA leaders who will define how AI transforms the profession.
            Join the council that&apos;s building the next era of public accounting.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#apply"
              style={{ padding: '14px 32px', borderRadius: 10, backgroundColor: '#fff', color: '#b8734a', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
            >
              Apply to Join Council →
            </a>
            <a
              href="#members"
              style={{ padding: '14px 32px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Meet the Members
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ backgroundColor: '#0f0f0f', borderBottom: '1px solid #1f1f1f', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
          {[
            { val: '50', label: 'Council Seats Total' },
            { val: '23', label: 'Seats Remaining' },
            { val: '0.01%', label: 'Equity per Member' },
            { val: '$0', label: 'Lifetime Subscription' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#b8734a' }}>{stat.val}</div>
              <div style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>

        {/* What Members Get */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 10 }}>Founding Member Benefits</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.02em' }}>What Council Members Get</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ backgroundColor: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 14, padding: 28 }}>
                <div style={{ fontSize: 28, marginBottom: 14, color: '#b8734a' }}>{b.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FAFAFA', marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: '#888888', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who We're Looking For */}
        <div style={{ marginBottom: 80, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 10 }}>Ideal Profile</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.02em', marginBottom: 20 }}>Who We&apos;re Looking For</h2>
            <p style={{ fontSize: 15, color: '#888888', lineHeight: 1.7, marginBottom: 28 }}>
              We&apos;re looking for practicing CPAs who are excited about where accounting is going, not just where it&apos;s been. You should believe that AI is a tool for expanding the CPA&apos;s role — not replacing it.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CRITERIA.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#00C853', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ color: '#080808', fontSize: 11, fontWeight: 700 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: '#FAFAFA', lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 16, padding: 36 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FAFAFA', marginBottom: 20 }}>The Opportunity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'CloseBooks current ARR', value: '$2.8M' },
                { label: 'Projected ARR at Series A', value: '$12M' },
                { label: 'Your 0.01% equity value today', value: '$280' },
                { label: 'Your equity at $12M ARR', value: '$1,200' },
                { label: 'Your equity at $50M ARR', value: '$5,000' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #1f1f1f' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#888888' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FAFAFA' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: 'rgba(184,115,74,0.1)', borderRadius: 10 }}>
              <p style={{ fontSize: 12, color: '#b8734a', margin: 0, lineHeight: 1.5 }}>
                Equity values are illustrative. This is not a solicitation to purchase securities. Equity grants are subject to standard vesting and legal agreements.
              </p>
            </div>
          </div>
        </div>

        {/* Current Members */}
        <div id="members" style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 10 }}>Charter Class of 2024</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.02em' }}>Current Council Members</h2>
            <p style={{ fontSize: 15, color: '#888888', marginTop: 10 }}>27 of 50 seats filled · Applications close Dec 31, 2024</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {COUNCIL_MEMBERS.map((m, i) => (
              <div key={i} style={{ backgroundColor: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 14, padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', backgroundColor: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{m.initials}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FAFAFA', marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: '#888888' }}>{m.role}</div>
                  <div style={{ fontSize: 12, color: '#444444' }}>{m.firm}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, backgroundColor: 'rgba(184,115,74,0.12)', color: '#b8734a', fontWeight: 600 }}>{m.location}</span>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, backgroundColor: 'rgba(0,200,83,0.1)', color: '#00C853', fontWeight: 600 }}>{m.years} yrs exp</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div id="apply" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#b8734a', textTransform: 'uppercase', marginBottom: 10 }}>Limited Seats Remaining</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.02em' }}>Apply to Join the Council</h2>
            <p style={{ fontSize: 15, color: '#888888', marginTop: 10 }}>Applications are reviewed within 48 hours. We accept approximately 2-3 new members per week.</p>
          </div>

          {submitted ? (
            <div style={{ backgroundColor: '#0f0f0f', border: '2px solid #00C853', borderRadius: 16, padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#00C853', marginBottom: 8 }}>Application Submitted!</h3>
              <p style={{ fontSize: 15, color: '#888888', lineHeight: 1.6 }}>
                Thank you, {form.name}. We&apos;ll review your application and reach out within 48 hours. Keep an eye on your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ backgroundColor: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 16, padding: 40 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {[
                  { label: 'Full Name', key: 'name', placeholder: 'James A. Thornton, CPA' },
                  { label: 'Firm Name', key: 'firm', placeholder: 'Thornton & Associates' },
                  { label: 'Years of Experience', key: 'years', placeholder: '28', type: 'number' },
                  { label: 'CPA License Number', key: 'license', placeholder: 'IL-12345' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #1f1f1f', fontSize: 14, color: '#FAFAFA', backgroundColor: '#141414', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA', display: 'block', marginBottom: 6 }}>
                  Why do you want to join the CloseBooks CPA Council?
                </label>
                <textarea
                  value={form.why}
                  onChange={e => setForm(prev => ({ ...prev, why: e.target.value }))}
                  placeholder="Tell us about your vision for how AI will transform accounting, and what you'd bring to the Council..."
                  required
                  rows={5}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #1f1f1f', fontSize: 14, color: '#FAFAFA', backgroundColor: '#141414', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  backgroundColor: loading ? '#1f1f1f' : '#b8734a', color: loading ? '#444444' : '#fff',
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Submitting application...' : 'Apply to Join Council →'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1f1f1f', padding: '32px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#444444' }}>© 2024 CloseBooks, Inc. · <Link href="/dashboard" style={{ color: '#b8734a', textDecoration: 'none' }}>Sign In</Link> · <Link href="/certification" style={{ color: '#b8734a', textDecoration: 'none' }}>Certification</Link></p>
      </div>
    </div>
  )
}
