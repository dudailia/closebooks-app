import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicShell from '@/components/landing/PublicShell'
import { getUseCase, USE_CASE_SLUGS } from '@/lib/landing/useCases'

interface UseCasePageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }))
}

export function generateMetadata({ params }: UseCasePageProps) {
  const useCase = getUseCase(params.slug)
  if (!useCase) return {}
  return {
    title: `${useCase.title} | CloseBooks`,
    description: useCase.description,
  }
}

export default function UseCasePage({ params }: UseCasePageProps) {
  const useCase = getUseCase(params.slug)
  if (!useCase) notFound()

  return (
    <PublicShell>
      <main style={{ padding: '128px 28px 92px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <section style={{ maxWidth: 820, marginBottom: 46 }}>
            <p style={{ margin: 0, color: '#00C853', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
              {useCase.eyebrow}
            </p>
            <h1 style={{ margin: '16px 0 0', color: '#FAFAFA', fontFamily: 'var(--font-display)', fontSize: 'clamp(46px, 8vw, 84px)', lineHeight: 0.95, letterSpacing: '-0.06em', fontWeight: 400 }}>
              {useCase.title}
            </h1>
            <p style={{ margin: '22px 0 0', color: '#A1A1A1', fontSize: 18, lineHeight: 1.7 }}>
              {useCase.description}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <Link href="/pilot" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: '#00C853', color: '#030303', textDecoration: 'none', fontSize: 14, fontWeight: 800 }}>
                Prove with pilot
              </Link>
              <Link href="/demo" style={{ padding: '13px 18px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.045)', border: '1px solid #1f1f1f', color: '#FAFAFA', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                See sample close
              </Link>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Panel title="What slows firms down" items={useCase.pains} tone="danger" />
            <Panel title="CloseBooks workflow" items={useCase.workflow} tone="accent" ordered />
            <Panel title="Expected outcomes" items={useCase.outcomes} tone="success" />
          </section>
        </div>
      </main>
    </PublicShell>
  )
}

function Panel({
  title,
  items,
  tone,
  ordered = false,
}: {
  title: string
  items: readonly string[]
  tone: 'danger' | 'accent' | 'success'
  ordered?: boolean
}) {
  const color = tone === 'danger' ? '#FB7185' : tone === 'accent' ? '#00C853' : '#38BDF8'
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.018))' }}>
      <h2 style={{ margin: 0, color: '#FAFAFA', fontSize: 22, letterSpacing: '-0.03em' }}>{title}</h2>
      <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
        {items.map((item, index) => (
          <li key={item} style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 10, color: '#A1A1A1', fontSize: 14, lineHeight: 1.58 }}>
            <span style={{ color, fontFamily: 'var(--font-mono)' }}>{ordered ? index + 1 : '•'}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
