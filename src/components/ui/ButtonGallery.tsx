'use client'

import Button, { type ButtonSize, type ButtonVariant } from '@/components/ui/Button'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '0 0 var(--space-4)',
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h2>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 var(--space-2)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}

export default function ButtonGallery() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Card>
        <SectionTitle>Variants (md)</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Sizes (primary)</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              {size.toUpperCase()}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>States</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div>
            <Label>Loading</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} loading>
                  Loading
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Disabled</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} disabled>
                  Disabled
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Full width</Label>
            <Button fullWidth>Full width primary</Button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Matrix — variant × size</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
          {VARIANTS.map((variant) => (
            <div key={variant}>
              <Label>{variant}</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
                {SIZES.map((size) => (
                  <Button key={`${variant}-${size}`} variant={variant} size={size}>
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Keyboard & focus</SectionTitle>
        <p
          style={{
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          Tab through these buttons to verify <code>:focus-visible</code> rings (global base style uses{' '}
          <code>var(--ring-focus)</code>).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Button variant="primary">Tab stop 1</Button>
          <Button variant="secondary">Tab stop 2</Button>
          <Button variant="ghost">Tab stop 3</Button>
          <Button variant="danger">Tab stop 4</Button>
        </div>
      </Card>
    </div>
  )
}
