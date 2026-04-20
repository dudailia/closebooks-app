'use client'

const PROMPTS = [
  "Summarize this month's close status",
  'What transactions need my attention?',
  'Draft all standard month-end accruals',
  'Compare revenue to last month',
  'Find potential duplicate entries',
  'Find anomalies in my transactions',
]

interface Props { onSelect: (prompt: string) => void }

export default function SuggestedPrompts({ onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1714', margin: 0 }}>CloseBooks Copilot</h2>
        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6, maxWidth: 360 }}>Ask anything about this client&apos;s financials, or draft accounting actions with one-click approval.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 560, width: '100%' }}>
        {PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            style={{ textAlign: 'left', padding: '12px 14px', background: '#ffffff', border: '1px solid #e8e0d4', borderRadius: 10, fontSize: 13, color: '#1a1714', cursor: 'pointer', lineHeight: 1.4, transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#2d5a27')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e8e0d4')}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
