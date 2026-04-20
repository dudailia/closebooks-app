'use client'

import { useState } from 'react'

interface Props {
  rows: Record<string, unknown>[]
  maxRows?: number
}

export default function DataTable({ rows, maxRows = 10 }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [expanded, setExpanded] = useState(false)

  if (rows.length === 0) return <p style={{ fontSize: 13, color: '#9ca3af' }}>No results.</p>

  const cols = Object.keys(rows[0])

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
        return sortAsc ? String(av ?? '').localeCompare(String(bv ?? '')) : String(bv ?? '').localeCompare(String(av ?? ''))
      })
    : rows

  const visible = expanded ? sorted : sorted.slice(0, maxRows)

  const handleSort = (col: string) => {
    if (sortKey === col) setSortAsc(a => !a)
    else { setSortKey(col); setSortAsc(true) }
  }

  const fmt = (v: unknown): string => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'number') return v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)
    return String(v)
  }

  return (
    <div style={{ overflowX: 'auto', fontSize: 12 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 400 }}>
        <thead>
          <tr>
            {cols.map(col => (
              <th key={col} onClick={() => handleSort(col)} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #e8e0d4', color: '#6b6560', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                {col.replace(/_/g, ' ')} {sortKey === col ? (sortAsc ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0ece4' }}>
              {cols.map(col => (
                <td key={col} style={{ padding: '6px 10px', color: '#1a1714', whiteSpace: 'nowrap' }}>{fmt(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <button onClick={() => setExpanded(e => !e)} style={{ marginTop: 6, fontSize: 12, color: '#2d5a27', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {expanded ? 'Show less' : `Show all ${rows.length} rows`}
        </button>
      )}
    </div>
  )
}
