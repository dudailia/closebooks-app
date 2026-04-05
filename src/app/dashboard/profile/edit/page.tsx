'use client'

import { useState } from 'react'
import Link from 'next/link'

const ALL_INDUSTRIES = [
  'Construction', 'SaaS', 'Restaurant', 'Real Estate', 'Healthcare',
  'Manufacturing', 'Retail', 'Nonprofit', 'Legal', 'E-Commerce',
  'Hospitality', 'Transportation', 'Professional Services',
]

const ALL_SERVICES = [
  'Bookkeeping', 'Tax Prep', 'Audit', 'Advisory', 'Payroll', '1099 Filing',
]

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        backgroundColor: '#1a1714',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: 12,
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        transform: visible ? 'translateY(0)' : 'translateY(80px)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#2d5a27',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          flexShrink: 0,
        }}
      >
        ✓
      </span>
      {message}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 600,
        color: '#1a1714',
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #e8e0d4',
        backgroundColor: '#ffffff',
        color: '#1a1714',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = '#2d5a27' }}
      onBlur={(e) => { e.target.style.borderColor = '#e8e0d4' }}
    />
  )
}

export default function EditProfilePage() {
  const [toast, setToast] = useState(false)

  // Form fields
  const [firmName, setFirmName] = useState('Pinecrest Advisors')
  const [tagline, setTagline] = useState('SaaS-focused accounting built for growth.')
  const [foundedYear, setFoundedYear] = useState('2016')
  const [teamSize, setTeamSize] = useState('5–10')
  const [city, setCity] = useState('Austin')
  const [state, setState] = useState('TX')
  const [specialties, setSpecialties] = useState<string[]>(['SaaS', 'E-Commerce', 'Professional Services'])
  const [services, setServices] = useState<string[]>(['Bookkeeping', 'Tax Prep', 'Advisory', '1099 Filing'])
  const [rateMin, setRateMin] = useState(175)
  const [rateMax, setRateMax] = useState(350)
  const [bio, setBio] = useState(
    'We live and breathe SaaS metrics — ARR, churn, LTV. Pinecrest Advisors helps fast-growing software companies keep clean books while their teams focus on product.'
  )

  const BIO_MAX = 250

  function toggleSpecialty(ind: string) {
    setSpecialties((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    )
  }

  function toggleService(svc: string) {
    setServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    )
  }

  function handleSave() {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f4' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <Link href="/dashboard/profile" style={{ fontSize: '12px', color: '#b8734a', textDecoration: 'none' }}>
            ← Back to profile
          </Link>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '2rem',
              letterSpacing: '-0.02em',
              color: '#1a1714',
              marginTop: 6,
              marginBottom: 4,
            }}
          >
            Edit Firm Profile
          </h1>
          <p style={{ fontSize: '14px', color: '#a09a94' }}>
            This information appears on your public directory listing.
          </p>
        </div>

        {/* Firm Info */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a' }}>
            Firm Information
          </p>

          <div>
            <Label>Firm Name</Label>
            <Input value={firmName} onChange={setFirmName} placeholder="Your CPA firm name" />
          </div>

          <div>
            <Label>Tagline</Label>
            <Input value={tagline} onChange={setTagline} placeholder="One-sentence description of what you do" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Label>Founded Year</Label>
              <Input value={foundedYear} onChange={setFoundedYear} placeholder="e.g. 2015" type="number" />
            </div>
            <div>
              <Label>Team Size</Label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e8e0d4',
                  backgroundColor: '#ffffff',
                  color: '#1a1714',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {['1', '2–5', '5–10', '10–25', '25–50', '50+'].map((sz) => (
                  <option key={sz} value={sz}>{sz} people</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Label>City</Label>
              <Input value={city} onChange={setCity} placeholder="City" />
            </div>
            <div>
              <Label>State</Label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid #e8e0d4',
                  backgroundColor: '#ffffff',
                  color: '#1a1714',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '24px',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 14 }}>
            About Your Firm
          </p>
          <Label>Bio</Label>
          <textarea
            value={bio}
            onChange={(e) => {
              if (e.target.value.length <= BIO_MAX) setBio(e.target.value)
            }}
            placeholder="Describe your firm's expertise, specialties, and what sets you apart..."
            rows={5}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e8e0d4',
              backgroundColor: '#ffffff',
              color: '#1a1714',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#2d5a27' }}
            onBlur={(e) => { e.target.style.borderColor = '#e8e0d4' }}
          />
          <p
            style={{
              fontSize: '12px',
              textAlign: 'right',
              marginTop: 6,
              color: bio.length >= BIO_MAX - 20 ? '#dc2626' : '#a09a94',
            }}
          >
            {bio.length}/{BIO_MAX} characters
          </p>
        </div>

        {/* Specialties */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '24px',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 6 }}>
            Industries
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>
            Specialties
          </p>
          <p style={{ fontSize: '13px', color: '#6b6560', marginBottom: 14 }}>
            Select all industries you actively serve.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_INDUSTRIES.map((ind) => {
              const active = specialties.includes(ind)
              return (
                <button
                  key={ind}
                  onClick={() => toggleSpecialty(ind)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 20,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: active ? '#2d5a27' : '#f5f0ea',
                    color: active ? '#ffffff' : '#6b6560',
                    border: `1px solid ${active ? '#2d5a27' : '#e8e0d4'}`,
                  }}
                >
                  {active && <span style={{ marginRight: 4 }}>✓</span>}
                  {ind}
                </button>
              )
            })}
          </div>
        </div>

        {/* Services */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '24px',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 6 }}>
            Services
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1714', marginBottom: 14 }}>
            Services offered
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ALL_SERVICES.map((svc) => {
              const active = services.includes(svc)
              return (
                <label
                  key={svc}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <span
                    onClick={() => toggleService(svc)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${active ? '#2d5a27' : '#c8c0ba'}`,
                      backgroundColor: active ? '#2d5a27' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    {active && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    onClick={() => toggleService(svc)}
                    style={{ fontSize: '14px', color: '#1a1714', cursor: 'pointer' }}
                  >
                    {svc}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Hourly Rate */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 16,
            padding: '24px',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b8734a', marginBottom: 6 }}>
            Pricing
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1714', marginBottom: 4 }}>
            Hourly Rate Range
          </p>
          <p style={{ fontSize: '13px', color: '#6b6560', marginBottom: 18 }}>
            Shown as a range on your public profile. Drag to adjust.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '2rem',
                color: '#2d5a27',
                letterSpacing: '-0.02em',
                minWidth: 70,
              }}
            >
              ${rateMin}
            </span>
            <span style={{ color: '#a09a94' }}>—</span>
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '2rem',
                color: '#2d5a27',
                letterSpacing: '-0.02em',
                minWidth: 70,
              }}
            >
              ${rateMax}
            </span>
            <span style={{ fontSize: '14px', color: '#6b6560' }}>/ hr</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <Label>Minimum (${rateMin}/hr)</Label>
              <input
                type="range"
                min={50}
                max={rateMax - 25}
                step={25}
                value={rateMin}
                onChange={(e) => setRateMin(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2d5a27', cursor: 'pointer' }}
              />
            </div>
            <div>
              <Label>Maximum (${rateMax}/hr)</Label>
              <input
                type="range"
                min={rateMin + 25}
                max={500}
                step={25}
                value={rateMax}
                onChange={(e) => setRateMax(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2d5a27', cursor: 'pointer' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#a09a94', marginTop: 4 }}>
            <span>$50</span>
            <span>$500/hr</span>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Link
            href="/dashboard/profile"
            style={{
              padding: '11px 22px',
              borderRadius: 10,
              fontSize: '14px',
              fontWeight: 600,
              color: '#6b6560',
              backgroundColor: '#f5f0ea',
              border: '1px solid #e8e0d4',
              textDecoration: 'none',
            }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            style={{
              padding: '11px 28px',
              borderRadius: 10,
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: '#2d5a27',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            Save Profile
          </button>
        </div>

      </div>

      <Toast message="Profile saved successfully!" visible={toast} />
    </div>
  )
}
