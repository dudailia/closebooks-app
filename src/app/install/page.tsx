import type { CSSProperties } from 'react'
import Link from 'next/link'

const stepStyle: CSSProperties = {
  border: '1px solid #e1d7ca',
  borderRadius: 24,
  background: '#fffdf9',
  padding: '20px 20px 18px',
  boxShadow: '0 18px 40px rgba(26, 23, 20, 0.06)',
}

export default function InstallPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(45,90,39,0.08), transparent 32%), linear-gradient(180deg, #faf8f4 0%, #f4efe8 100%)',
        color: '#1a1714',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 72px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 999,
            border: '1px solid #cfe0cc',
            background: '#f0f5ef',
            color: '#2d5a27',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Mobile Install
        </div>

        <h1
          style={{
            marginTop: 20,
            marginBottom: 16,
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          }}
        >
          Put CloseBooks on your iPhone home screen today
        </h1>

        <p
          style={{
            maxWidth: 700,
            fontSize: 18,
            lineHeight: 1.7,
            color: '#5f5750',
            marginBottom: 28,
          }}
        >
          The fastest reliable mobile path right now is the live CloseBooks web app installed from Safari.
          It opens full-screen, uses your production Vercel app, and feels much closer to a native product than a normal browser tab.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <Link
            href="/login"
            style={{
              borderRadius: 999,
              background: '#2d5a27',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              padding: '14px 20px',
            }}
          >
            Open CloseBooks
          </Link>
          <Link
            href="/pricing"
            style={{
              borderRadius: 999,
              border: '1px solid #d7cec2',
              color: '#1a1714',
              textDecoration: 'none',
              fontWeight: 700,
              padding: '14px 20px',
              background: '#fff',
            }}
          >
            View Plans
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          <section style={stepStyle}>
            <div style={{ color: '#b8734a', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Step 1
            </div>
            <h2 style={{ marginTop: 10, marginBottom: 8, fontSize: 22 }}>Open Safari</h2>
            <p style={{ margin: 0, color: '#625951', lineHeight: 1.6 }}>
              On your iPhone, open <strong>Safari</strong> and go to{' '}
              <span style={{ color: '#2d5a27', fontWeight: 700 }}>closebooks-app.vercel.app/login</span>.
            </p>
          </section>

          <section style={stepStyle}>
            <div style={{ color: '#b8734a', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Step 2
            </div>
            <h2 style={{ marginTop: 10, marginBottom: 8, fontSize: 22 }}>Tap Share</h2>
            <p style={{ margin: 0, color: '#625951', lineHeight: 1.6 }}>
              Tap the <strong>Share</strong> button in Safari, then scroll until you see{' '}
              <strong>Add to Home Screen</strong>.
            </p>
          </section>

          <section style={stepStyle}>
            <div style={{ color: '#b8734a', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Step 3
            </div>
            <h2 style={{ marginTop: 10, marginBottom: 8, fontSize: 22 }}>Install CloseBooks</h2>
            <p style={{ margin: 0, color: '#625951', lineHeight: 1.6 }}>
              Save it to your home screen. CloseBooks will launch in standalone mode with your branded app icon.
            </p>
          </section>
        </div>

        <section
          style={{
            marginTop: 28,
            border: '1px solid #e1d7ca',
            borderRadius: 28,
            background: 'rgba(255,253,249,0.9)',
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 24 }}>What works right now on mobile</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#5f5750', lineHeight: 1.8 }}>
            <li>Live production auth, dashboard, and client workflows</li>
            <li>Home-screen install with standalone display mode</li>
            <li>Branded icon and Apple touch icon</li>
            <li>Fast access while we finish full native distribution</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
