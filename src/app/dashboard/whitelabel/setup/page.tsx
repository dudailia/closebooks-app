'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface ToggleItem {
  key: string
  label: string
  comingSoon?: boolean
}

const FEATURE_TOGGLES: ToggleItem[] = [
  { key: 'cash', label: 'Cash position dashboard' },
  { key: 'txn', label: 'Transaction feed' },
  { key: 'ai', label: 'AI CFO chat' },
  { key: 'upcoming', label: 'Upcoming obligations' },
  { key: 'charts', label: 'Revenue charts', comingSoon: true },
  { key: 'tax', label: 'Tax alerts', comingSoon: true },
]

export default function WhitelabelSetupPage() {
  const [firmName, setFirmName] = useState('Miller CPA')
  const [tagline, setTagline] = useState('Financial clarity for growing businesses')
  const [logoUploaded, setLogoUploaded] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#2d5a27')
  const [accentColor, setAccentColor] = useState('#b8734a')
  const [bgColor, setBgColor] = useState('#faf8f4')
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to your financial dashboard. Here you can view your cash position, upcoming obligations, and get AI-powered insights.')
  const [supportEmail, setSupportEmail] = useState('support@millercpa.com')
  const [footerText, setFooterText] = useState('© 2025 Miller CPA. Powered by CloseBooks.')
  const [features, setFeatures] = useState<Record<string, boolean>>({
    cash: true, txn: true, ai: true, upcoming: true, charts: false, tax: false,
  })
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePublish = async () => {
    setPublishing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setPublishing(false)
    setPublished(true)
    setTimeout(() => setPublished(false), 4000)
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#57534e',
    marginBottom: 8,
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid #e8e0d4',
    fontSize: 14,
    color: '#1a1714',
    backgroundColor: '#faf8f4',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const sectionTitleStyle = {
    fontFamily: 'var(--font-dm-serif)',
    fontSize: 17,
    color: '#1a1714',
    margin: '0 0 18px 0',
  }

  const cardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0d4',
    borderRadius: 14,
    padding: 24,
    marginBottom: 20,
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Back link + header */}
      <div style={{ marginBottom: 8 }}>
        <Link href="/dashboard/whitelabel" style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}>
          ← White-Label Platform
        </Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 28, color: '#1a1714', margin: '0 0 28px 0' }}>
        Brand Configuration
      </h1>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* LEFT FORM — 55% */}
        <div style={{ flex: '0 0 55%', minWidth: 0 }}>

          {/* Section 1 — Identity */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Identity</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Firm name</label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Tagline <span style={{ fontWeight: 400, color: '#a09080' }}>(optional)</span></label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Logo upload */}
            <label style={labelStyle}>Logo</label>
            <div
              onClick={() => setLogoUploaded(true)}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); setLogoUploaded(true) }}
              style={{
                border: `2px dashed ${dragOver ? '#b8734a' : '#d4cfc8'}`,
                borderRadius: 10,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? '#fdf3ec' : '#faf8f4',
                transition: 'all 0.15s',
                gap: 12,
              }}
            >
              {logoUploaded ? (
                <>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {firmName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: '#2d5a27', fontWeight: 500 }}>Logo uploaded ✓</span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: '#a09080' }}>
                  Click or drag & drop your logo here
                </span>
              )}
            </div>
          </div>

          {/* Section 2 — Colors */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Colors</h2>

            {[
              { label: 'Primary color', value: primaryColor, setter: setPrimaryColor },
              { label: 'Accent color', value: accentColor, setter: setAccentColor },
              { label: 'Background', value: bgColor, setter: setBgColor },
            ].map(({ label, value, setter }) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}
              >
                <label style={{ fontSize: 13, fontWeight: 500, color: '#57534e', flex: '0 0 140px' }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: value,
                      border: '1px solid #e8e0d4',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 32,
                      height: 32,
                      opacity: 0,
                      cursor: 'pointer',
                      padding: 0,
                      border: 'none',
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setter(e.target.value)
                  }}
                  style={{
                    ...inputStyle,
                    fontFamily: 'monospace',
                    maxWidth: 110,
                    padding: '8px 12px',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Section 3 — Client Experience */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Client Experience</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Welcome message</label>
              <textarea
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Support email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Footer text</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Section 4 — Feature Toggles */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Feature Toggles</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {FEATURE_TOGGLES.map((feat) => (
                <div
                  key={feat.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e8e0d4',
                    backgroundColor: '#faf8f4',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: '#1a1714', fontWeight: 500 }}>{feat.label}</div>
                    {feat.comingSoon && (
                      <div style={{ fontSize: 11, color: '#a09080' }}>Coming in v2</div>
                    )}
                  </div>
                  <button
                    onClick={() => !feat.comingSoon && toggleFeature(feat.key)}
                    disabled={feat.comingSoon}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      border: 'none',
                      backgroundColor: features[feat.key] ? '#2d5a27' : '#d4cfc8',
                      cursor: feat.comingSoon ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      transition: 'background-color 0.2s',
                      flexShrink: 0,
                      opacity: feat.comingSoon ? 0.5 : 1,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: features[feat.key] ? 21 : 3,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            onMouseEnter={() => setHoveredBtn('publish')}
            onMouseLeave={() => setHoveredBtn(null)}
            disabled={publishing}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 12,
              border: 'none',
              backgroundColor: published
                ? '#2d5a27'
                : publishing
                ? '#c4956a'
                : hoveredBtn === 'publish'
                ? '#a36640'
                : '#b8734a',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 600,
              cursor: publishing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            {publishing && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ animation: 'spin 0.8s linear infinite' }}
              >
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {published ? 'Your branded portal is live! ✓' : publishing ? 'Publishing...' : 'Publish Branding'}
          </button>
        </div>

        {/* RIGHT PREVIEW — 45%, sticky */}
        <div
          style={{
            flex: '0 0 45%',
            minWidth: 0,
            position: 'sticky',
            top: 24,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#a09080', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Live Preview
          </div>

          <div
            style={{
              border: '1px solid #e8e0d4',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            {/* Mini top nav */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e8e0d4',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {firmName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 14, color: '#1a1714' }}>
                  {firmName || 'Your Firm'}
                </span>
              </div>
              <button
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: primaryColor,
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Ask your CFO
              </button>
            </div>

            {/* Mini hero card */}
            <div style={{ backgroundColor: bgColor, padding: 20 }}>
              <div
                style={{
                  background: `linear-gradient(135deg, #1a1714, #2d2520)`,
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  Cash Position
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-dm-serif)',
                    fontSize: 28,
                    color: '#ffffff',
                    marginBottom: 6,
                  }}
                >
                  $847,293
                </div>
                <div style={{ fontSize: 11, color: accentColor }}>
                  Managed by {firmName || 'Your Firm'}
                </div>
              </div>

              {tagline && (
                <p style={{ fontSize: 12, color: '#78716c', margin: '16px 0 0 0', textAlign: 'center' }}>
                  {tagline}
                </p>
              )}
            </div>

            {/* Mini footer */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e8e0d4',
                padding: '10px 20px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 10, color: '#a09080' }}>{footerText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
