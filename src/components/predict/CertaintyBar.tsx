'use client'
import { useEffect, useState } from 'react'

export default function CertaintyBar({ value, showLabel = true, height = 8 }: { value: number, showLabel?: boolean, height?: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const color = value >= 90 ? '#2d5a27' : value >= 75 ? '#86efac' : value >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, backgroundColor: '#e8e0d4', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, backgroundColor: color, borderRadius: height / 2, transition: 'width 0.8s ease-out' }} />
      </div>
      {showLabel && <span style={{ fontSize: 12, color: color, fontWeight: 700, minWidth: 36 }}>{value}%</span>}
    </div>
  )
}
