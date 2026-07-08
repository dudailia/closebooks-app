import type { CSSProperties } from 'react'

export const showcase: CSSProperties = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
}

export const labelCaps: CSSProperties = {
  margin: 0,
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-medium)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

export const sectionGap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
}
