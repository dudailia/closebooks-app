import Link from 'next/link'
import PublicShell from '@/components/landing/PublicShell'

const PHASES = [
  {
    title: 'Day 1: Firm setup',
    copy: 'Create the firm workspace, identify pilot clients, confirm security questions, and choose the first workflow.',
  },
  {
    title: 'First close: Prove the path',
    copy: 'Upload transactions and COA, run categorization, review exceptions, save rules, and export the first package.',
  },
  {
    title: 'Week 1: Repeat with more clients',
    copy: 'Run the same workflow across the pilot group and identify repeat vendors, client blockers, and rule opportunities.',
  },
  {
    title: 'Expansion: Operationalize',
    copy: 'Move the firm into the right subscription tier, add users, and expand into client portal or API workflows as needed.',
  },
] as const

const CHECKLIST = [
  'Firm name, owner, and billing contact',
  'Pilot client list and current close workflow',
  'Client chart of accounts or sample export',
  'Bank or credit card CSV sample',
  'Reviewer and preparer roles',
  'Security or DPA questions',
] as const

export default function ImplementationPage() {
  return (
    <PublicShell>
      <main style={{ padding: '128px 28px 94px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <section style={{ maxWidth: 850 }}>
            <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
              Implementation
            </p>
            <h1 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(46px, 8vw, 86px)', lineHeight: 0.95, letterSpacing: '-0.06em', fontWeight: 400 }}>
              Go from evaluation to first export without a consulting project.
            </h1>
            <p style={{ margin: '22px 0 0', color: '#A1A1A1', fontSize: 18, lineHeight: 1.7 }}>
              CloseBooks should prove value quickly. The implementation path is designed around one
              real close workflow first, then expanding once your firm sees where AI review fits.
            </p>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 46 }}>
            {PHASES.map((phase, index) => (
              <div key={phase.title} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.018))' }}>
                <span style={{ color: '#00C853', fontFamily: 'var(--font-mono)', fontSize: 12 }}>0{index + 1}</span>
                <h2 style={{ margin: '14px 0 8px', color: '#FAFAFA', fontSize: 21, letterSpacing: '-0.03em' }}>{phase.title}</h2>
                <p style={{ margin: 0, color: '#A1A1A1', fontSize: 14, lineHeight: 1.65 }}>{phase.copy}</p>
              </div>
            ))}
          </section>

          <section style={{ marginTop: 44, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="implementation-grid">
            <div style={{ border: '1px solid rgba(0,200,83,0.18)', borderRadius: 26, padding: 28, backgroundColor: 'rgba(0,200,83,0.04)' }}>
              <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                Bring to kickoff
              </p>
              <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                {CHECKLIST.map((item) => (
                  <li key={item} style={{ display: 'flex', gap: 8, color: '#A1A1A1', fontSize: 14, lineHeight: 1.55 }}>
                    <span style={{ color: '#00C853' }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, padding: 28, backgroundColor: 'rgba(255,255,255,0.025)' }}>
              <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                Best next step
              </p>
              <h2 style={{ margin: '12px 0 8px', color: '#FAFAFA', fontSize: 26, letterSpacing: '-0.035em' }}>Run a paid pilot.</h2>
              <p style={{ margin: 0, color: '#A1A1A1', fontSize: 14, lineHeight: 1.65 }}>
                A paid pilot gives your firm a structured way to validate CloseBooks on real client work,
                with clear success criteria and a subscription decision at the end.
              </p>
              <Link href="/pilot" style={{ display: 'inline-flex', marginTop: 20, padding: '13px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                See pilot plan
              </Link>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  )
}
