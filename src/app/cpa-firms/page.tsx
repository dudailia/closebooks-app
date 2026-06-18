import Link from 'next/link'
import PublicShell from '@/components/landing/PublicShell'
import PilotOffer from '@/components/landing/PilotOffer'

const WORKFLOWS = [
  {
    title: 'Monthly bookkeeping close',
    copy: 'Upload statements, classify transactions, review exceptions, and export QuickBooks-ready files.',
  },
  {
    title: 'Partner review',
    copy: 'Give reviewers confidence scores, COA validation flags, AI reasoning, and a clean exception queue.',
  },
  {
    title: 'Client questions',
    copy: 'Turn ambiguous transactions and missing documents into focused client requests instead of long email threads.',
  },
  {
    title: 'Firm standardization',
    copy: 'Use correction memory and firm rules so preparers apply the same judgment across similar clients.',
  },
] as const

const OUTCOMES = [
  'Review exceptions instead of every row',
  'Keep QuickBooks workflows your clients already use',
  'Own the AI workflow instead of outsourcing client margin',
  'Package close output for review, export, and client delivery',
] as const

export default function CpaFirmsPage() {
  return (
    <PublicShell>
      <main>
        <section style={{ padding: '132px 28px 92px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 8%, rgba(0,200,83,0.13), transparent 38%)' }} />
          <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: 860 }}>
              <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
                For CPA and CAS firms
              </p>
              <h1 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 8vw, 92px)', lineHeight: 0.94, letterSpacing: '-0.065em', fontWeight: 400 }}>
                The AI close layer your firm controls.
              </h1>
              <p style={{ margin: '24px 0 0', color: '#A1A1A1', fontSize: 18, lineHeight: 1.72, maxWidth: 760 }}>
                CloseBooks is built for firms that manage recurring client books. It is not a
                generic chatbot, not a managed-service replacement, and not an enterprise checklist.
                It is a review-first close workflow for firms that want AI speed with CPA control.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
                <Link href="/pilot" style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                  Start paid pilot
                </Link>
                <Link href="/demo" style={{ padding: '14px 20px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                  Try sample close
                </Link>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 48 }}>
              {OUTCOMES.map((outcome) => (
                <div key={outcome} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, background: 'rgba(255,255,255,0.025)', color: '#CFCFCF', fontSize: 14, lineHeight: 1.55 }}>
                  <span style={{ color: '#00C853', marginRight: 8 }}>✓</span>{outcome}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '26px 28px 88px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>
                Firm workflows
              </p>
              <h2 style={{ margin: '10px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 5vw, 58px)', fontWeight: 400, letterSpacing: '-0.045em' }}>
                Built around the work firms repeat every month.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {WORKFLOWS.map((workflow, index) => (
                <div key={workflow.title} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.018))' }}>
                  <span style={{ color: '#00C853', fontFamily: 'var(--font-mono)', fontSize: 12 }}>0{index + 1}</span>
                  <h3 style={{ margin: '14px 0 8px', color: '#FAFAFA', fontSize: 21, letterSpacing: '-0.03em' }}>{workflow.title}</h3>
                  <p style={{ margin: 0, color: '#A1A1A1', fontSize: 14, lineHeight: 1.66 }}>{workflow.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PilotOffer />
      </main>
    </PublicShell>
  )
}
