'use client'

import { useEffect, useRef, useState } from 'react'
import type { DocumentFileType } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultSearchFilters {
  fileType?: DocumentFileType
  clientName?: string
  dateRange?: 'this-month' | 'last-3-months' | 'this-year' | 'all'
  uploadedBy?: 'firm' | 'client' | 'all'
}

interface Props {
  onSearch: (query: string, filters: VaultSearchFilters) => void
}

const FILE_TYPE_LABELS: Record<string, string> = {
  'bank-statement':    'Bank Statement',
  'tax-return':        'Tax Return',
  'report':            'Report',
  'receipt':           'Receipt',
  'engagement-letter': 'Engagement Letter',
  'payroll':           'Payroll',
  'other':             'Other',
}

const DATE_RANGE_LABELS: Record<string, string> = {
  'this-month':    'This Month',
  'last-3-months': 'Last 3 Months',
  'this-year':     'This Year',
  'all':           'All Time',
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function VaultSearchBar({ onSearch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query,      setQuery]      = useState('')
  const [filters,    setFilters]    = useState<VaultSearchFilters>({})
  const [showFilter, setShowFilter] = useState(false)

  // Keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function update(q: string, f: VaultSearchFilters) {
    setQuery(q)
    setFilters(f)
    onSearch(q, f)
  }

  function clearFilter(key: keyof VaultSearchFilters) {
    const next = { ...filters }
    delete next[key]
    update(query, next)
  }

  const activeFilterChips: { key: keyof VaultSearchFilters; label: string }[] = []
  if (filters.fileType) activeFilterChips.push({ key: 'fileType', label: FILE_TYPE_LABELS[filters.fileType] ?? filters.fileType })
  if (filters.dateRange && filters.dateRange !== 'all') activeFilterChips.push({ key: 'dateRange', label: DATE_RANGE_LABELS[filters.dateRange] })
  if (filters.uploadedBy && filters.uploadedBy !== 'all') activeFilterChips.push({ key: 'uploadedBy', label: filters.uploadedBy === 'firm' ? 'By Firm' : 'By Client' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Text input */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #e8e0d4',
            borderRadius: 10,
            backgroundColor: '#ffffff',
            padding: '0 12px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#a09a94" strokeWidth="1.2" />
            <path d="M9.5 9.5L12 12" stroke="#a09a94" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => update(e.target.value, filters)}
            placeholder="Search documents…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: '#1a1714',
              backgroundColor: 'transparent',
              padding: '9px 0',
            }}
          />
          <span style={{ fontSize: 11, color: '#c4bdb8', whiteSpace: 'nowrap', userSelect: 'none' }}>
            ⌘K
          </span>
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilter((v) => !v)}
          style={{
            padding: '0 14px',
            borderRadius: 10,
            border: `1px solid ${showFilter ? '#b8734a' : '#e8e0d4'}`,
            backgroundColor: showFilter ? 'rgba(184,115,74,0.06)' : '#ffffff',
            color: showFilter ? '#b8734a' : '#6b6560',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 3h11M3 6.5h7M5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Filters
          {activeFilterChips.length > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: '#b8734a',
                color: '#ffffff',
                borderRadius: 99,
                padding: '1px 6px',
              }}
            >
              {activeFilterChips.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter dropdowns */}
      {showFilter && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #e8e0d4',
            backgroundColor: '#faf8f4',
          }}
        >
          {/* File type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: '#6b6560', fontWeight: 500 }}>File Type</label>
            <select
              value={filters.fileType ?? ''}
              onChange={(e) => update(query, { ...filters, fileType: e.target.value as DocumentFileType || undefined })}
              style={{
                border: '1px solid #e8e0d4',
                borderRadius: 7,
                padding: '6px 10px',
                fontSize: 12,
                color: '#1a1714',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="">All types</option>
              {Object.entries(FILE_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <label style={{ fontSize: 11, color: '#6b6560', fontWeight: 500 }}>Date Range</label>
            <select
              value={filters.dateRange ?? 'all'}
              onChange={(e) => update(query, { ...filters, dateRange: e.target.value as VaultSearchFilters['dateRange'] })}
              style={{
                border: '1px solid #e8e0d4',
                borderRadius: 7,
                padding: '6px 10px',
                fontSize: 12,
                color: '#1a1714',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              {Object.entries(DATE_RANGE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Uploaded by */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <label style={{ fontSize: 11, color: '#6b6560', fontWeight: 500 }}>Uploaded By</label>
            <select
              value={filters.uploadedBy ?? 'all'}
              onChange={(e) => update(query, { ...filters, uploadedBy: e.target.value as VaultSearchFilters['uploadedBy'] })}
              style={{
                border: '1px solid #e8e0d4',
                borderRadius: 7,
                padding: '6px 10px',
                fontSize: 12,
                color: '#1a1714',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">Everyone</option>
              <option value="firm">Firm</option>
              <option value="client">Client</option>
            </select>
          </div>

          {/* Reset */}
          {activeFilterChips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => update(query, {})}
                style={{
                  fontSize: 12,
                  color: '#b8734a',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {activeFilterChips.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => clearFilter(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 99,
                border: '1px solid #b8734a',
                backgroundColor: 'rgba(184,115,74,0.08)',
                color: '#b8734a',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {label}
              <span style={{ fontSize: 12, lineHeight: 1 }}>×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
