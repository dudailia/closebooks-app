import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicShell from '@/components/landing/PublicShell'
import { COMPARISON_SLUGS, getComparison } from '@/lib/landing/comparisons'

interface ComparePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return COMPARISON_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata(props: ComparePageProps) {
  const params = await props.params;
  const comparison = getComparison(params.slug)
  if (!comparison) return {}
  return {
    title: `${comparison.title} | CloseBooks`,
    description: comparison.description,
  }
}

export default async function ComparePage(props: ComparePageProps) {
  const params = await props.params;
  const comparison = getComparison(params.slug)
  if (!comparison) notFound()

  return (
    <PublicShell>
      <main style={{ padding: '128px 28px 92px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <section style={{ maxWidth: 850, marginBottom: 42 }}>
            <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
              Comparison guide
            </p>
            <h1 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 8vw, 82px)', lineHeight: 0.96, letterSpacing: '-0.06em', fontWeight: 400 }}>
              {comparison.title}
            </h1>
            <p style={{ margin: '22px 0 0', color: '#A1A1A1', fontSize: 18, lineHeight: 1.7 }}>
              {comparison.description}
            </p>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
            <InfoCard title={`${comparison.name} is often best for`} copy={comparison.bestFor} />
            <InfoCard title="CloseBooks angle" copy={comparison.closeBooksAngle} accent />
          </section>

          <section style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 26, background: 'linear-gradient(180deg, rgba(18,18,18,0.94), rgba(8,8,8,0.96))', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1fr', backgroundColor: 'rgba(255,255,255,0.025)', borderBottom: '1px solid #161616' }}>
              {['Dimension', comparison.name, 'CloseBooks'].map((header) => (
                <div key={header} style={{ padding: 16, color: header === 'CloseBooks' ? '#00C853' : '#777', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800 }}>
                  {header}
                </div>
              ))}
            </div>
            {comparison.rows.map(([dimension, other, closebooks], index) => (
              <div key={dimension} style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr 1fr', borderBottom: index < comparison.rows.length - 1 ? '1px solid #141414' : 'none' }}>
                <div style={{ padding: 16, color: '#FAFAFA', fontSize: 13, fontWeight: 700 }}>{dimension}</div>
                <div style={{ padding: 16, color: '#8D8D8D', fontSize: 13, lineHeight: 1.55, borderLeft: '1px solid #141414' }}>{other}</div>
                <div style={{ padding: 16, color: '#CFEFDC', fontSize: 13, lineHeight: 1.55, borderLeft: '1px solid rgba(0,200,83,0.16)', backgroundColor: 'rgba(0,200,83,0.025)' }}>{closebooks}</div>
              </div>
            ))}
          </section>

          <section style={{ marginTop: 34, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/pilot" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
              Prove CloseBooks with pilot
            </Link>
            <Link href="/cpa-firms" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              See CPA firm workflow
            </Link>
          </section>
        </div>
      </main>
    </PublicShell>
  )
}

function InfoCard({ title, copy, accent = false }: { title: string; copy: string; accent?: boolean }) {
  return (
    <div style={{ border: `1px solid ${accent ? 'rgba(0,200,83,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 22, padding: 22, backgroundColor: accent ? 'rgba(0,200,83,0.045)' : 'rgba(255,255,255,0.025)' }}>
      <h2 style={{ margin: 0, color: accent ? '#00C853' : '#FAFAFA', fontSize: 18, letterSpacing: '-0.025em' }}>{title}</h2>
      <p style={{ margin: '9px 0 0', color: '#A1A1A1', fontSize: 14, lineHeight: 1.65 }}>{copy}</p>
    </div>
  )
}
