import PublicShell from '@/components/landing/PublicShell'

const STEPS_IOS = [
  {
    n: '01',
    title: 'Open in Safari',
    body: "iOS installs PWAs only from Safari. Chrome and other browsers won't show the install option.",
  },
  {
    n: '02',
    title: 'Tap the Share button',
    body: 'Tap the share icon in the Safari bottom bar (the square with an upward arrow).',
  },
  {
    n: '03',
    title: 'Add to Home Screen',
    body: 'Scroll down inside the share sheet and tap "Add to Home Screen". Confirm with "Add".',
  },
]

const STEPS_ANDROID = [
  {
    n: '01',
    title: 'Open in Chrome',
    body: "Android's install prompt works in Chrome and Microsoft Edge.",
  },
  {
    n: '02',
    title: 'Tap the menu',
    body: 'Open the three-dot menu in the top-right corner.',
  },
  {
    n: '03',
    title: 'Install app',
    body: 'Tap "Install app" or "Add to Home screen". Confirm when prompted.',
  },
]

function StepGrid({ label, steps }: { label: string; steps: typeof STEPS_IOS }) {
  return (
    <div>
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#00D97E',
          margin: 0,
          marginBottom: 16,
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {steps.map((s) => (
          <div
            key={s.n}
            style={{
              padding: 22,
              backgroundColor: '#111118',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                color: '#00D97E',
                letterSpacing: '0.18em',
              }}
            >
              {s.n}
            </span>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#F0F0F5',
                margin: '10px 0 6px',
                letterSpacing: '-0.02em',
              }}
            >
              {s.title}
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: '#A8A8BC', margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InstallPage() {
  return (
    <PublicShell>
      <main style={{ padding: '120px 24px 80px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#00D97E',
              margin: 0,
              marginBottom: 16,
            }}
          >
            Install
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(40px, 6vw, 64px)',
              letterSpacing: '-0.03em',
              color: '#F0F0F5',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.05,
            }}
          >
            Install CloseBooks
          </h1>
          <p
            style={{
              fontSize: 17,
              color: '#A8A8BC',
              margin: '16px auto 0',
              maxWidth: 540,
              lineHeight: 1.55,
            }}
          >
            Add CloseBooks to your home screen for one-tap access on iOS and Android.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 48 }}>
          <StepGrid label="iPhone / iPad" steps={STEPS_IOS} />
          <StepGrid label="Android" steps={STEPS_ANDROID} />
        </div>
      </main>
    </PublicShell>
  )
}
