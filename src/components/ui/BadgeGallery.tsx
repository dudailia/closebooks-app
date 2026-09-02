'use client'

import Badge from '@/components/ui/Badge'
import type { BadgeAppearance, BadgeVariant } from '@/components/ui/badgeStyles'

const VARIANTS: BadgeVariant[] = ['success', 'warning', 'danger', 'info', 'neutral']
const APPEARANCES: BadgeAppearance[] = ['filled', 'outline']

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

function GalleryLabel({ children }: { children: React.ReactNode }) {
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

function Showcase({ children }: { children: React.ReactNode }) {
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

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 3v3.5M6 8.25h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const variantLabels: Record<BadgeVariant, string> = {
  success: 'Approved',
  warning: 'Pending',
  danger: 'Flagged',
  info: 'Edited',
  neutral: 'Draft',
}

export default function BadgeGallery() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Showcase>
        <SectionTitle>Variants (filled)</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variantLabels[variant]}
            </Badge>
          ))}
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Appearances</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {APPEARANCES.map((appearance) => (
            <div key={appearance}>
              <GalleryLabel>{appearance}</GalleryLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {VARIANTS.map((variant) => (
                  <Badge key={`${appearance}-${variant}`} variant={variant} appearance={appearance}>
                    {variantLabels[variant]}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Icons & status dot</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <Badge variant="success" icon={<CheckIcon />}>
            Approved
          </Badge>
          <Badge variant="warning" icon={<AlertIcon />}>
            Needs review
          </Badge>
          <Badge variant="danger" dot>
            Flagged
          </Badge>
          <Badge variant="info" appearance="outline" dot>
            Edited
          </Badge>
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Compact mode</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <GalleryLabel>Default size</GalleryLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <Badge variant="success">12 approved</Badge>
              <Badge variant="warning" icon={<AlertIcon />}>
                3 pending
              </Badge>
            </div>
          </div>
          <div>
            <GalleryLabel>Compact</GalleryLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <Badge variant="success" compact>
                12
              </Badge>
              <Badge variant="warning" compact icon={<AlertIcon />}>
                3
              </Badge>
              <Badge variant="danger" compact dot>
                Flagged
              </Badge>
              <Badge variant="neutral" compact appearance="outline">
                v2
              </Badge>
            </div>
          </div>
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Matrix — variant × appearance</SectionTitle>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {VARIANTS.map((variant) => (
            <div key={variant}>
              <GalleryLabel>{variant}</GalleryLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {APPEARANCES.map((appearance) => (
                  <Badge key={`${variant}-${appearance}`} variant={variant} appearance={appearance} dot>
                    {variantLabels[variant]}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase>
        <SectionTitle>Transaction status mapping</SectionTitle>
        <p
          style={{
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          Mirrors <code>TransactionRow</code> StatusPill semantics for future migration.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <Badge variant="success" dot>
            Approved
          </Badge>
          <Badge variant="warning" dot>
            Pending
          </Badge>
          <Badge variant="danger" dot>
            Flagged
          </Badge>
          <Badge variant="info" dot>
            Edited
          </Badge>
        </div>
      </Showcase>
    </div>
  )
}
