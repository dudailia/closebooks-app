'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChartOfAccounts } from '@/types'

interface Props {
  anchor: { top: number; left: number } | null
  chartOfAccounts: ChartOfAccounts[]
  onSelect: (accountCode: string, categoryName: string) => void
  onClose: () => void
}

export default function InlineCategoryPicker({ anchor, chartOfAccounts, onSelect, onClose }: Props) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (anchor) {
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [anchor])

  useEffect(() => {
    if (!anchor) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [anchor, onClose])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return chartOfAccounts.slice(0, 8)
    return chartOfAccounts
      .filter((a) => a.name.toLowerCase().includes(needle) || a.code.toLowerCase().includes(needle))
      .slice(0, 8)
  }, [q, chartOfAccounts])

  if (!anchor) return null

  // Clamp to viewport
  const top = Math.max(8, Math.min(anchor.top, (typeof window !== 'undefined' ? window.innerHeight : 800) - 320))
  const left = Math.max(8, Math.min(anchor.left, (typeof window !== 'undefined' ? window.innerWidth : 800) - 340))

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 999,
        backgroundColor: '#fff',
        border: '1px solid #e0dbd4',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: 6,
        width: 320,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setIdx(0)
        }}
        placeholder="Type to find a category…"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIdx((i) => Math.min(i + 1, filtered.length - 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setIdx((i) => Math.max(i - 1, 0))
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            const a = filtered[idx]
            if (a) onSelect(a.code, a.name)
          }
        }}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 13,
          border: '1px solid #e0dbd4',
          borderRadius: 6,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ marginTop: 4 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 8, fontSize: 12, color: '#a09a94' }}>No matches.</div>
        )}
        {filtered.map((a, i) => (
          <button
            key={a.code}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(a.code, a.name)
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '6px 8px',
              borderRadius: 6,
              border: 'none',
              background: i === idx ? '#f5f0ea' : 'transparent',
              color: '#1a1714',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6560', marginRight: 6 }}>
              {a.code}
            </span>
            {a.name}
          </button>
        ))}
      </div>
    </div>
  )
}
