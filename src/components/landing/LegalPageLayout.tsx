import PublicShell from '@/components/landing/PublicShell'

interface LegalPageLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

export default function LegalPageLayout({ eyebrow, title, description, children }: LegalPageLayoutProps) {
  return (
    <PublicShell>
      <main style={{ padding: '128px 28px 88px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <p style={{ margin: '0 0 14px', color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
            {eyebrow}
          </p>
          <h1 style={{ margin: 0, color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 7vw, 72px)', lineHeight: 0.98, letterSpacing: '-0.055em', fontWeight: 400 }}>
            {title}
          </h1>
          <p style={{ margin: '20px 0 44px', color: '#A1A1A1', fontSize: 17, lineHeight: 1.72, maxWidth: 760 }}>
            {description}
          </p>
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 26,
              background: 'linear-gradient(180deg, rgba(18,18,18,0.92), rgba(8,8,8,0.96))',
              padding: '34px min(5vw, 44px)',
              color: '#CFCFCF',
              fontSize: 15,
              lineHeight: 1.75,
              boxShadow: '0 34px 110px rgba(0,0,0,0.38)',
            }}
          >
            {children}
          </div>
        </div>
      </main>
    </PublicShell>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 30 }}>
      <h2 style={{ margin: '0 0 10px', color: '#FAFAFA', fontSize: 22, letterSpacing: '-0.025em' }}>
        {title}
      </h2>
      <div style={{ color: '#A1A1A1' }}>{children}</div>
    </section>
  )
}
