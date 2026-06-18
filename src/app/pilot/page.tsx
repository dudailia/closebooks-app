import Link from 'next/link'
import PublicShell from '@/components/landing/PublicShell'
import PilotOffer from '@/components/landing/PilotOffer'
import { PILOT_DELIVERABLES } from '@/lib/landing/pilot'

const SUCCESS_CRITERIA = [
  'At least one client reaches reviewed export',
  'Your team creates or applies firm rules during review',
  'COA Guard blocks or validates account mappings before export',
  'You identify the next batch of clients worth onboarding',
] as const

export default function PilotPage() {
  return (
    <PublicShell>
      <main style={{ padding: '126px 28px 92px' }}>
        <section style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
            Paid pilot program
          </p>
          <h1 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(46px, 8vw, 86px)', lineHeight: 0.95, letterSpacing: '-0.06em', fontWeight: 400 }}>
            Put CloseBooks on your real close workflow.
          </h1>
          <p style={{ margin: '22px auto 0', color: '#A1A1A1', fontSize: 18, lineHeight: 1.7, maxWidth: 760 }}>
            The pilot is for firms ready to evaluate CloseBooks with real client samples,
            real review controls, and a concrete subscription decision at the end.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
            <Link href="/contact?topic=pilot" style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
              Request pilot setup
            </Link>
            <Link href="/security" style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Review security
            </Link>
          </div>
        </section>

        <PilotOffer compact />

        <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 26, backgroundColor: 'rgba(255,255,255,0.025)' }}>
            <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
              Success criteria
            </p>
            <h2 style={{ margin: '10px 0 14px', color: '#FAFAFA', fontSize: 24, letterSpacing: '-0.03em' }}>What “worked” means</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {SUCCESS_CRITERIA.map((item) => (
                <li key={item} style={{ display: 'flex', gap: 8, color: '#A1A1A1', fontSize: 14, lineHeight: 1.55 }}>
                  <span style={{ color: '#00C853' }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 26, backgroundColor: 'rgba(255,255,255,0.025)' }}>
            <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
              Deliverables
            </p>
            <h2 style={{ margin: '10px 0 14px', color: '#FAFAFA', fontSize: 24, letterSpacing: '-0.03em' }}>What your firm receives</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
              {PILOT_DELIVERABLES.slice(0, 4).map((item) => (
                <li key={item} style={{ display: 'flex', gap: 8, color: '#A1A1A1', fontSize: 14, lineHeight: 1.55 }}>
                  <span style={{ color: '#00C853' }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}
