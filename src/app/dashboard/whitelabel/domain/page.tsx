'use client'

import { useState } from 'react'

type VerifyResult = 'success' | 'pending' | null

const DNS_LINES = [
  { label: 'Type:', value: 'CNAME' },
  { label: 'Name:', value: 'books' },
  { label: 'Value:', value: 'portal.closebooks.app' },
  { label: 'TTL:', value: '3600' },
]

export default function WhitelabelDomainPage() {
  const [domain, setDomain] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyResult>(null)
  const [sslDone, setSslDone] = useState(false)
  const [copiedLine, setCopiedLine] = useState<string | null>(null)
  const [faqOpen, setFaqOpen] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)

  const handleDomainSubmit = () => {
    if (domain.trim()) setSubmitted(true)
  }

  const handleVerify = async () => {
    setVerifying(true)
    setVerifyResult(null)
    setSslDone(false)
    await new Promise((r) => setTimeout(r, 2000))
    const success = Math.random() > 0.3
    setVerifyResult(success ? 'success' : 'pending')
    setVerifying(false)
    if (success) {
      await new Promise((r) => setTimeout(r, 2000))
      setSslDone(true)
    }
  }

  const handleCopyLine = (value: string) => {
    navigator.clipboard.writeText(value).catch(() => {})
    setCopiedLine(value)
    setTimeout(() => setCopiedLine(null), 2000)
  }

  const currentDomain = domain.trim() || 'books.millercpa.com'

  return (
    <div style={{ padding: 32, maxWidth: 680, margin: '0 auto' }}>
      <h1
        style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: 28,
          color: '#1a1714',
          margin: '0 0 8px 0',
        }}
      >
        Custom Domain
      </h1>
      <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 28px 0' }}>
        Give your clients a domain they'll never forget.
      </p>

      {/* Current status card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e8e0d4',
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Current Status
        </div>
        <div style={{ fontSize: 14, color: '#57534e', marginBottom: 6 }}>
          Your current URL:{' '}
          <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f5f0', padding: '2px 8px', borderRadius: 4 }}>
            closebooks.app/portal/millercpa
          </span>
        </div>
        <div style={{ fontSize: 14, color: '#57534e' }}>
          Target:{' '}
          <span style={{ fontFamily: 'monospace', backgroundColor: '#f8f5f0', padding: '2px 8px', borderRadius: 4 }}>
            {currentDomain}
          </span>
        </div>
        {sslDone && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              padding: '6px 12px',
              borderRadius: 8,
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ {currentDomain} is live!
          </div>
        )}
      </div>

      {/* 3-step wizard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Step 1 */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e8e0d4',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: submitted ? '#dcfce7' : '#2d5a27',
                color: submitted ? '#166534' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {submitted ? '✓' : '1'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714', margin: 0 }}>
              Enter your domain
            </h2>
          </div>

          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleDomainSubmit() }}
            placeholder="books.millercpa.com"
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: 10,
              border: '1px solid #e8e0d4',
              fontSize: 14,
              color: '#1a1714',
              backgroundColor: '#faf8f4',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
          <p style={{ fontSize: 12, color: '#a09080', margin: '0 0 12px 0' }}>
            This will be your clients' bookmark forever.
          </p>

          <button
            onClick={handleDomainSubmit}
            onMouseEnter={() => setHoveredBtn('continue')}
            onMouseLeave={() => setHoveredBtn(null)}
            disabled={!domain.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: domain.trim()
                ? hoveredBtn === 'continue' ? '#a36640' : '#b8734a'
                : '#e8e0d4',
              color: domain.trim() ? '#ffffff' : '#a09080',
              fontSize: 14,
              fontWeight: 600,
              cursor: domain.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
            }}
          >
            Continue
          </button>
        </div>

        {/* Step 2 — DNS */}
        {submitted && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#2d5a27',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714', margin: 0 }}>
                Configure DNS
              </h2>
            </div>

            <p style={{ fontSize: 14, color: '#57534e', margin: '0 0 16px 0' }}>
              Add this DNS record at your domain registrar:
            </p>

            {/* Code block */}
            <div
              style={{
                backgroundColor: '#1a1714',
                borderRadius: 10,
                padding: 20,
                marginBottom: 16,
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              {DNS_LINES.map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.45)', marginRight: 8 }}>{label}</span>
                    {value}
                  </div>
                  <button
                    onClick={() => handleCopyLine(value)}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 5,
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: copiedLine === value ? '#2d5a27' : 'rgba(255,255,255,0.08)',
                      color: copiedLine === value ? '#86efac' : 'rgba(255,255,255,0.6)',
                      fontSize: 10,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {copiedLine === value ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            {/* Registrar links */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {['GoDaddy guide →', 'Namecheap →', 'Cloudflare →'].map((link) => (
                <a
                  key={link}
                  href="#"
                  style={{ fontSize: 13, color: '#b8734a', textDecoration: 'none', fontWeight: 500 }}
                >
                  {link}
                </a>
              ))}
            </div>

            {/* FAQ dropdown */}
            <button
              onClick={() => setFaqOpen(!faqOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e8e0d4',
                backgroundColor: '#faf8f4',
                cursor: 'pointer',
                fontSize: 13,
                color: '#57534e',
                fontWeight: 500,
              }}
            >
              How long does this take?
              <span style={{ transform: faqOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
            </button>
            {faqOpen && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '0 0 8px 8px',
                  backgroundColor: '#f8f5f0',
                  fontSize: 13,
                  color: '#57534e',
                  borderTop: 'none',
                  border: '1px solid #e8e0d4',
                }}
              >
                DNS typically propagates within 24–48 hours. Some registrars are faster (Cloudflare often takes minutes).
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Verify */}
        {submitted && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e0d4',
              borderRadius: 14,
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: sslDone ? '#dcfce7' : '#2d5a27',
                  color: sslDone ? '#166534' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {sslDone ? '✓' : '3'}
              </div>
              <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: 18, color: '#1a1714', margin: 0 }}>
                Verify
              </h2>
            </div>

            <button
              onClick={handleVerify}
              onMouseEnter={() => setHoveredBtn('check')}
              onMouseLeave={() => setHoveredBtn(null)}
              disabled={verifying}
              style={{
                padding: '11px 24px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: verifying
                  ? '#4a7a44'
                  : hoveredBtn === 'check' ? '#234a1e' : '#2d5a27',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: verifying ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {verifying && (
                <svg
                  width="16"
                  height="16"
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
              {verifying ? 'Checking DNS...' : 'Check DNS'}
            </button>

            {verifyResult === 'success' && !sslDone && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>✓</span>
                Domain verified! SSL certificate provisioning...
              </div>
            )}

            {verifyResult === 'success' && sslDone && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>✓</span>
                {currentDomain} is live!
              </div>
            )}

            {verifyResult === 'pending' && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⏳</span>
                Still propagating. Check again in a few hours.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
