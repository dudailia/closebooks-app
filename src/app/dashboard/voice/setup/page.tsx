'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function VoiceSetupPage() {
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 123-4567')
  const [pin, setPin] = useState('')
  const [requirePin, setRequirePin] = useState(false)
  const [notifyMethod, setNotifyMethod] = useState<'sms' | 'email' | 'both'>('both')
  const [smsNumber, setSmsNumber] = useState('+1 (555) 123-4567')
  const [voiceStyle, setVoiceStyle] = useState<'concise' | 'detailed'>('concise')
  const [saved, setSaved] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const cardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e8e0d4',
    borderRadius: 14,
    padding: 28,
    marginBottom: 20,
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

  return (
    <div style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      {/* Back link */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/voice"
          style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
        >
          ← Voice Assistant
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif)',
            fontSize: 28,
            color: '#1a1714',
            margin: '0 0 6px 0',
          }}
        >
          Voice Setup
        </h1>
        <p style={{ fontSize: 15, color: '#78716c', margin: 0 }}>
          Configure your CloseBooks voice line.
        </p>
      </div>

      {/* Section 1 — Your Phone Number */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Your Phone Number</h2>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 16px',
            borderRadius: 10,
            backgroundColor: '#f0f9ff',
            marginBottom: 20,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.14-1.85a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.72 15z"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
            Your voice line: +1 (844) 256-7326
          </span>
        </div>

        <label style={labelStyle}>Your phone number (to verify your identity):</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          style={inputStyle}
        />
        <p style={{ fontSize: 12, color: '#a09080', margin: '8px 0 0 0' }}>
          We only accept calls from this number.
        </p>
      </div>

      {/* Section 2 — Security PIN */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Security PIN</h2>
        <label style={labelStyle}>Set a 4-digit PIN for extra security:</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          maxLength={4}
          placeholder="••••"
          style={{ ...inputStyle, maxWidth: 120 }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 18,
          }}
        >
          <button
            role="switch"
            aria-checked={requirePin}
            onClick={() => setRequirePin(!requirePin)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              backgroundColor: requirePin ? '#2d5a27' : '#d4cfc8',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: requirePin ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
          <span style={{ fontSize: 14, color: '#1a1714' }}>Require PIN on every call</span>
        </div>
      </div>

      {/* Section 3 — Notification Preferences */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Notification Preferences</h2>
        <p style={{ fontSize: 14, color: '#57534e', margin: '0 0 16px 0' }}>
          After completing a voice-triggered action, notify me via:
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {(['sms', 'email', 'both'] as const).map((opt) => (
            <label
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: '1.5px solid',
                borderColor: notifyMethod === opt ? '#b8734a' : '#e8e0d4',
                backgroundColor: notifyMethod === opt ? '#fdf3ec' : '#ffffff',
                cursor: 'pointer',
                fontSize: 14,
                color: notifyMethod === opt ? '#b8734a' : '#1a1714',
                fontWeight: notifyMethod === opt ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="notify"
                value={opt}
                checked={notifyMethod === opt}
                onChange={() => setNotifyMethod(opt)}
                style={{ display: 'none' }}
              />
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </label>
          ))}
        </div>

        {(notifyMethod === 'sms' || notifyMethod === 'both') && (
          <div>
            <label style={labelStyle}>SMS number:</label>
            <input
              type="tel"
              value={smsNumber}
              onChange={(e) => setSmsNumber(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* Section 4 — Voice Response Style */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Voice Response Style</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              value: 'concise' as const,
              label: 'Concise',
              desc: 'Short answers. Best for quick checks while driving.',
            },
            {
              value: 'detailed' as const,
              label: 'Detailed',
              desc: 'Full context with numbers. Best for planning calls.',
            },
          ].map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: '1.5px solid',
                borderColor: voiceStyle === opt.value ? '#b8734a' : '#e8e0d4',
                backgroundColor: voiceStyle === opt.value ? '#fdf3ec' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="voiceStyle"
                value={opt.value}
                checked={voiceStyle === opt.value}
                onChange={() => setVoiceStyle(opt.value)}
                style={{ marginTop: 2, accentColor: '#b8734a' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', marginBottom: 2 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 13, color: '#78716c' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Save Settings */}
      <button
        onClick={handleSave}
        onMouseEnter={() => setHoveredBtn('save')}
        onMouseLeave={() => setHoveredBtn(null)}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          backgroundColor: saved ? '#2d5a27' : hoveredBtn === 'save' ? '#a36640' : '#b8734a',
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          marginBottom: 14,
        }}
      >
        {saved ? 'Voice settings saved ✓' : 'Save Settings'}
      </button>

      {/* Test voice line */}
      <a
        href="tel:+18442567326"
        onMouseEnter={() => setHoveredBtn('test')}
        onMouseLeave={() => setHoveredBtn(null)}
        style={{
          display: 'block',
          width: '100%',
          padding: '13px 0',
          borderRadius: 12,
          backgroundColor: hoveredBtn === 'test' ? '#234a1e' : '#2d5a27',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 600,
          textDecoration: 'none',
          textAlign: 'center',
          transition: 'background-color 0.2s',
          boxSizing: 'border-box',
        }}
      >
        Test Your Voice Line
      </a>
    </div>
  )
}
