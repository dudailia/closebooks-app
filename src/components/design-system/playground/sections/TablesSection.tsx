'use client'

import { useState } from 'react'
import { CATALOG_SECTIONS } from '@/components/design-system/playground/catalog'
import PlaygroundBlock from '@/components/design-system/playground/PlaygroundBlock'
import PlaygroundSection from '@/components/design-system/playground/PlaygroundSection'
import Badge from '@/components/ui/Badge'

const entry = CATALOG_SECTIONS.find((s) => s.id === 'tables')!

type Row = { id: string; date: string; vendor: string; amount: string; status: 'approved' | 'review' | 'flagged' }

const ROWS: Row[] = [
  { id: '1', date: 'Jul 2', vendor: 'Stripe', amount: '$4,280.00', status: 'approved' },
  { id: '2', date: 'Jul 3', vendor: 'AWS', amount: '$892.14', status: 'review' },
  { id: '3', date: 'Jul 5', vendor: 'Gusto', amount: '$12,400.00', status: 'flagged' },
]

const statusTone = { approved: 'success', review: 'warning', flagged: 'danger' } as const

export default function TablesSection() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <PlaygroundSection entry={entry}>
      <PlaygroundBlock
        title="Reference data table"
        description="No Table primitive yet — this documents the token-based pattern used in review and dashboard lists."
        code={`<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead>
    <tr style={{ background: 'var(--surface-elevated)' }}>
      <th scope="col" style={{ textAlign: 'left', padding: 'var(--space-3)' }}>
        Vendor
      </th>
    </tr>
  </thead>
  <tbody>…</tbody>
</table>`}
        variants={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Dense vs comfortable row padding: --space-2 vs --space-3 vertical cell padding.
          </p>
        }
        states={
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Hover row, selected row (accent-soft), sticky header (--z-sticky).
          </p>
        }
        a11y={[
          'Use <table>, <thead>, <tbody>, scope="col" on headers.',
          'Sortable columns: aria-sort on <th> and button inside header.',
          'Row selection: checkbox in first column with aria-label per row.',
          'Numeric amounts: font-family var(--font-mono) + tabular-nums.',
        ]}
      >
        <div
          style={{
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            overflow: 'hidden',
            backgroundColor: 'var(--surface-raised)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                {['Date', 'Vendor', 'Amount', 'Status'].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    style={{
                      textAlign: col === 'Amount' ? 'right' : 'left',
                      padding: 'var(--space-3) var(--space-4)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const isSelected = selected === row.id
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row.id)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--accent-soft)' : undefined,
                      borderBottom: '1px solid var(--border-default)',
                    }}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-secondary)' }}>
                      {row.date}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-primary)' }}>
                      {row.vendor}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {row.amount}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge variant={statusTone[row.status]} compact>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </PlaygroundBlock>
    </PlaygroundSection>
  )
}
