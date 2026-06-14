import Link from 'next/link'
import PublicShell from '@/components/landing/PublicShell'

const SAMPLE_ROWS = [
  ['AWS', 'Cloud Infrastructure', '$412.09', 'Validated'],
  ['Stripe', 'Merchant Fees', '$128.44', 'Validated'],
  ['Gusto', 'Payroll & Wages', '$4,820.00', 'Validated'],
  ['Google Ads', 'Marketing', '$640.00', 'Review'],
] as const

const CHECKS = [
  'All exportable rows resolve to the client chart of accounts',
  'Pending and flagged rows excluded from export',
  'AI reasoning preserved for review context',
  'QuickBooks-ready CSV prepared after validation',
] as const

const EXCEPTIONS = [
  'Google Ads: confirm campaign should remain Marketing vs. Client Reimbursable',
  'Amazon Marketplace: request receipt before category approval',
  'ACH Deposit: confirm customer invoice source',
] as const

export default function SampleClosePackagePage() {
  return (
    <PublicShell>
      <main style={{ padding: '128px 28px 94px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <section style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 36, alignItems: 'center' }} className="sample-package-hero">
            <div>
              <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
                Sample close package
              </p>
              <h1 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(46px, 8vw, 86px)', lineHeight: 0.95, letterSpacing: '-0.06em', fontWeight: 400 }}>
                What a reviewed close can look like.
              </h1>
              <p style={{ margin: '22px 0 0', color: '#A1A1A1', fontSize: 18, lineHeight: 1.7 }}>
                This sample illustrates the CloseBooks output: validated rows, exceptions,
                export checks, and a client-ready narrative. Use it to understand the review model
                before running your own client files.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
                <Link href="/demo" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                  Walk through demo
                </Link>
                <Link href="/pilot" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                  Prove with pilot
                </Link>
              </div>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, background: 'linear-gradient(180deg, rgba(18,18,18,0.94), rgba(8,8,8,0.96))', padding: 20, boxShadow: '0 34px 110px rgba(0,0,0,0.42)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>Close package</p>
                  <h2 style={{ margin: '6px 0 0', color: '#FAFAFA', fontSize: 22, letterSpacing: '-0.03em' }}>Sunrise Advisory · March</h2>
                </div>
                <span style={{ padding: '5px 10px', borderRadius: 999, backgroundColor: 'rgba(0,200,83,0.1)', color: '#00C853', fontSize: 12, fontWeight: 700 }}>Ready with exceptions</span>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {SAMPLE_ROWS.map(([vendor, category, amount, status]) => (
                  <div key={vendor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid #181818', backgroundColor: '#090909', alignItems: 'center' }}>
                    <span style={{ color: '#FAFAFA', fontSize: 13 }}>{vendor}</span>
                    <span style={{ color: status === 'Review' ? '#F59E0B' : '#00C853', fontSize: 12 }}>{category}</span>
                    <span style={{ color: '#888', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{amount}</span>
                    <span style={{ color: status === 'Review' ? '#F59E0B' : '#00C853', fontSize: 11 }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 44 }}>
            <Panel title="Export checks" items={CHECKS} />
            <Panel title="Exception list" items={EXCEPTIONS} accent="#F59E0B" />
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, backgroundColor: 'rgba(255,255,255,0.025)' }}>
              <p style={{ margin: 0, color: '#00C853', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
                Client narrative
              </p>
              <p style={{ margin: '14px 0 0', color: '#A1A1A1', fontSize: 14, lineHeight: 1.7 }}>
                March expenses were led by payroll and cloud infrastructure. Three transactions remain
                in review pending client context. Once resolved, the QuickBooks-ready export can be
                delivered with the reviewed close summary.
              </p>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  )
}

function Panel({ title, items, accent = '#00C853' }: { title: string; items: readonly string[]; accent?: string }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, backgroundColor: 'rgba(255,255,255,0.025)' }}>
      <p style={{ margin: 0, color: accent, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800 }}>
        {title}
      </p>
      <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
        {items.map((item) => (
          <li key={item} style={{ display: 'flex', gap: 8, color: '#A1A1A1', fontSize: 14, lineHeight: 1.55 }}>
            <span style={{ color: accent }}>✓</span>{item}
          </li>
        ))}
      </ul>
    </div>
  )
}
