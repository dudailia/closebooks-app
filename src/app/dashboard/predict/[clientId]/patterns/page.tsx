'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pattern {
  id: string
  vendor: string
  amount: string
  frequency: string
  category: string
  reliability: number
  learnedFrom: string
  canEdit: boolean
  paused?: boolean
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const INITIAL_PATTERNS: Pattern[] = [
  { id: 'p1', vendor: 'ADP Payroll Processing', amount: '$12,400', frequency: 'Bi-weekly Fridays', category: 'Payroll Expense', reliability: 99.2, learnedFrom: '18 months', canEdit: true },
  { id: 'p2', vendor: 'Wells Fargo · Rent', amount: '$4,200', frequency: 'Monthly (1st)', category: 'Rent Expense', reliability: 100, learnedFrom: '18 months', canEdit: true },
  { id: 'p3', vendor: 'Mesa Supplies Inc', amount: '$2,800–$4,500', frequency: 'Monthly (Net-30)', category: 'COGS', reliability: 94.1, learnedFrom: '16 months', canEdit: true },
  { id: 'p4', vendor: 'Stripe Payout', amount: '$6,000–$12,000', frequency: 'Weekly Wednesdays', category: 'Revenue', reliability: 96.8, learnedFrom: '52 weeks', canEdit: true },
  { id: 'p5', vendor: 'Adobe Creative Cloud', amount: '$54.99', frequency: 'Monthly (12th)', category: 'Software', reliability: 91.3, learnedFrom: '11 months', canEdit: true },
  { id: 'p6', vendor: 'AT&T Business', amount: '$320–$360', frequency: 'Monthly (15th)', category: 'Utilities', reliability: 88.0, learnedFrom: '14 months', canEdit: true },
  { id: 'p7', vendor: 'Office Depot', amount: '$140–$280', frequency: 'Weekly (irregular)', category: 'Office Supplies', reliability: 73.4, learnedFrom: '6 months', canEdit: true },
]

const CATEGORIES = [
  'Payroll Expense', 'Rent Expense', 'COGS', 'Revenue', 'Software',
  'Utilities', 'Insurance', 'Equipment', 'Office Supplies', 'Other',
]

const FREQUENCIES = [
  'Daily', 'Weekly', 'Bi-weekly Fridays', 'Weekly Wednesdays', 'Weekly (irregular)',
  'Monthly (1st)', 'Monthly (15th)', 'Monthly (12th)', 'Monthly (Net-30)', 'Quarterly', 'Annual',
]

const CLIENT_NAMES: Record<string, string> = {
  'smith-2024': 'Smith Construction LLC',
  'bella-2024': 'Bella Vista Restaurant',
  'chen-2024': 'Chen Medical Practice',
  'techflow-2024': 'TechFlow Inc',
  'greenvalley-2024': 'Green Valley Farms',
  'meridian-2024': 'Meridian Consulting',
}

// ─── Reliability color ────────────────────────────────────────────────────────

function relColor(r: number): string {
  if (r >= 90) return '#2d5a27'
  if (r >= 70) return '#f59e0b'
  return '#ef4444'
}

// ─── Edit Row ─────────────────────────────────────────────────────────────────

function EditableRow({ pattern, onSave, onCancel }: {
  pattern: Pattern
  onSave: (updated: Pattern) => void
  onCancel: () => void
}) {
  const [amount, setAmount] = useState(pattern.amount)
  const [category, setCategory] = useState(pattern.category)

  return (
    <tr style={{ backgroundColor: '#fffbf0' }}>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1a1714', fontWeight: 500 }}>{pattern.vendor}</td>
      <td style={{ padding: '10px 14px' }}>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            border: '1px solid #e8e0d4',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 13,
            width: 120,
            color: '#1a1714',
            backgroundColor: '#ffffff',
          }}
        />
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b6560' }}>{pattern.frequency}</td>
      <td style={{ padding: '10px 14px' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            border: '1px solid #e8e0d4',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 13,
            color: '#1a1714',
            backgroundColor: '#ffffff',
          }}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: relColor(pattern.reliability) }}>
        {pattern.reliability}%
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b6560' }}>{pattern.learnedFrom}</td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onSave({ ...pattern, amount, category })}
            style={{ backgroundColor: '#2d5a27', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{ backgroundColor: '#f1efeb', color: '#6b6560', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Pattern Row ─────────────────────────────────────────────────────────────

function PatternRow({ pattern, onTogglePause, onEdit }: {
  pattern: Pattern
  onTogglePause: (id: string) => void
  onEdit: (id: string) => void
}) {
  return (
    <tr style={{ opacity: pattern.paused ? 0.5 : 1 }}>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1a1714', fontWeight: 500 }}>
        <span>{pattern.vendor}</span>
        {pattern.paused && (
          <span style={{
            marginLeft: 8,
            fontSize: 10,
            backgroundColor: '#e8e0d4',
            color: '#6b6560',
            borderRadius: 4,
            padding: '2px 6px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>PAUSED</span>
        )}
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#1a1714' }}>{pattern.amount}</td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b6560' }}>{pattern.frequency}</td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b6560' }}>{pattern.category}</td>
      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: relColor(pattern.reliability) }}>
        {pattern.reliability}%
      </td>
      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6b6560' }}>{pattern.learnedFrom}</td>
      <td style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onEdit(pattern.id)}
            style={{
              backgroundColor: '#f1efeb',
              color: '#1a1714',
              border: '1px solid #e8e0d4',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onTogglePause(pattern.id)}
            style={{
              backgroundColor: pattern.paused ? '#e8f0e6' : '#fff8ed',
              color: pattern.paused ? '#2d5a27' : '#f59e0b',
              border: `1px solid ${pattern.paused ? '#2d5a27' : '#f59e0b'}`,
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {pattern.paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Add Pattern Form ─────────────────────────────────────────────────────────

function AddPatternForm({ onAdd }: { onAdd: (p: Pattern) => void }) {
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [range, setRange] = useState('')
  const [frequency, setFrequency] = useState(FREQUENCIES[0])
  const [day, setDay] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountStr = range ? `${amount}–${range}` : amount
    onAdd({
      id: `custom-${Date.now()}`,
      vendor,
      amount: amountStr,
      frequency,
      category,
      reliability: 0,
      learnedFrom: 'Manual',
      canEdit: true,
    })
    setVendor(''); setAmount(''); setRange(''); setDay('')
  }

  const inputStyle = {
    border: '1px solid #e8e0d4',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: '#1a1714',
    backgroundColor: '#ffffff',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e8e0d4',
      borderRadius: 12,
      padding: 24,
      marginTop: 24,
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1714', margin: '0 0 16px 0' }}>Add Manual Pattern</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Vendor Name</label>
            <input required value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Acme Corp" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Expected Amount</label>
            <input required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. $1,200" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>± Range (optional)</label>
            <input value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. $1,400" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={inputStyle}>
              {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Day / Date</label>
            <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="e.g. 1st, Friday" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6560', display: 'block', marginBottom: 4 }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#2d5a27',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add Pattern
        </button>
      </form>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternsPage() {
  const params = useParams()
  const clientId = typeof params.clientId === 'string' ? params.clientId : 'smith-2024'
  const clientName = CLIENT_NAMES[clientId] ?? 'Smith Construction LLC'

  const [patterns, setPatterns] = useState<Pattern[]>(INITIAL_PATTERNS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = patterns.filter((p) =>
    p.vendor.toLowerCase().includes(search.toLowerCase())
  )

  function togglePause(id: string) {
    setPatterns((prev) => prev.map((p) => p.id === id ? { ...p, paused: !p.paused } : p))
  }

  function saveEdit(updated: Pattern) {
    setPatterns((prev) => prev.map((p) => p.id === updated.id ? updated : p))
    setEditingId(null)
  }

  function addPattern(p: Pattern) {
    setPatterns((prev) => [...prev, p])
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Back link */}
      <Link href={`/dashboard/predict/${clientId}`} style={{ fontSize: 13, color: '#6b6560', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>
        ← {clientName} Predictions
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: 28,
          fontWeight: 400,
          color: '#1a1714',
          margin: '0 0 6px 0',
        }}>
          Learned Patterns
        </h1>
        <p style={{ fontSize: 14, color: '#6b6560', margin: 0 }}>{clientName}</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vendor name..."
          style={{
            border: '1px solid #e8e0d4',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 14,
            color: '#1a1714',
            backgroundColor: '#ffffff',
            width: 320,
          }}
        />
      </div>

      {/* Patterns Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e0d4', backgroundColor: '#faf8f4' }}>
              {['Vendor', 'Predicted Amount', 'Frequency', 'Category', 'Reliability', 'Learned From', 'Actions'].map((h) => (
                <th key={h} style={{
                  padding: '12px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((pattern) =>
              editingId === pattern.id ? (
                <EditableRow
                  key={pattern.id}
                  pattern={pattern}
                  onSave={saveEdit}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <PatternRow
                  key={pattern.id}
                  pattern={pattern}
                  onTogglePause={togglePause}
                  onEdit={setEditingId}
                />
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add Manual Pattern */}
      <AddPatternForm onAdd={addPattern} />
    </div>
  )
}
