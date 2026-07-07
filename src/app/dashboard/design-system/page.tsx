'use client'

import ButtonGallery from '@/components/ui/ButtonGallery'
import CardGallery from '@/components/ui/CardGallery'
import DialogGallery from '@/components/ui/DialogGallery'
import InputGallery from '@/components/ui/InputGallery'

export default function DesignSystemPage() {
  return (
    <div
      className="page-enter"
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: 'var(--space-8) var(--space-6)',
      }}
    >
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <p
          style={{
            margin: '0 0 var(--space-2)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Internal only
        </p>
        <h1
          style={{
            margin: '0 0 var(--space-3)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          Design System
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
            maxWidth: 640,
          }}
        >
          Primitive gallery for manual QA. All styles read from CSS custom properties in{' '}
          <code>globals.css</code>. No production pages consume these components yet (except login Button
          migration).
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
        <section>
          <h2
            style={{
              margin: '0 0 var(--space-6)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Button
          </h2>
          <ButtonGallery />
        </section>

        <section>
          <h2
            style={{
              margin: '0 0 var(--space-6)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Input system
          </h2>
          <InputGallery />
        </section>

        <section>
          <h2
            style={{
              margin: '0 0 var(--space-6)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Card system
          </h2>
          <CardGallery />
        </section>

        <section>
          <h2
            style={{
              margin: '0 0 var(--space-6)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Dialog system
          </h2>
          <DialogGallery />
        </section>
      </div>
    </div>
  )
}
