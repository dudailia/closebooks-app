'use client'

import { useEffect, useRef, useState } from 'react'

interface AgentTerminalProps {
  clientId: string
  isLive?: boolean
}

const SMITH_LOG_LINES = [
  '[09:02:14] ✓ Connected to Chase Bank ••••4821',
  '[09:02:18] ✓ Fetched 284 transactions (Nov 1–30)',
  '[09:02:19] ✓ Loaded 18 months of categorization history',
  '[09:02:21] ◉ Categorizing transactions... (this takes ~90 seconds)',
  '[09:02:22]   → Payroll $12,400 → Payroll Expense ✓ (99.2%)',
  '[09:02:23]   → Materials $3,847 → Cost of Goods Sold ✓ (97.8%)',
  '[09:02:25]   → AMZN*RT9K2 $247 → flagging for review ⚠',
  '[09:02:31]   → [+281 more transactions auto-categorized]',
  '[09:03:45] ✓ 281 of 284 transactions categorized (98.9%)',
  '[09:03:46] ⚠ 3 transactions require human review',
  '[09:04:01] ✓ Bank reconciliation complete — difference: $0.00',
  '[09:04:12] ✓ P&L generated — Revenue $284K, Net Income $47K',
  '[09:04:13] ✓ Balance Sheet generated',
  '[09:04:14] ✓ Cash Flow Statement generated',
  '[09:04:15] ◉ Composing client email...',
  '[09:04:18] ✓ Email sent to john@smithconstruction.com',
  '[09:04:19] ● COMPLETE — 4m 05s — awaiting exception review',
]

function getLineColor(line: string): string {
  if (line.includes('✓')) return '#4ade80'
  if (line.includes('⚠')) return '#fbbf24'
  if (line.includes('◉')) return '#60a5fa'
  if (line.includes('→')) return '#9ca3af'
  if (line.includes('● COMPLETE')) return '#4ade80'
  return '#d1d5db'
}

export default function AgentTerminal({ clientId, isLive = false }: AgentTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isLive) {
      setVisibleLines([])
      let idx = 0
      intervalRef.current = setInterval(() => {
        if (idx < SMITH_LOG_LINES.length) {
          const line = SMITH_LOG_LINES[idx]
          setVisibleLines(prev => [...prev, line])
          idx++
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      }, 80)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      setVisibleLines(SMITH_LOG_LINES)
    }
  }, [clientId, isLive])

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }, [visibleLines])

  const isComplete = !isLive || visibleLines.length === SMITH_LOG_LINES.length
  const headerText = isLive && !isComplete ? '● AGENT RUNNING' : '● LAST RUN COMPLETE'
  const headerColor = isLive && !isComplete ? '#4ade80' : '#4ade80'

  return (
    <div style={{
      backgroundColor: '#0f0e0d',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid #1f1e1c',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderBottom: '1px solid #1f1e1c',
        backgroundColor: '#141312',
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: headerColor,
          display: 'inline-block',
          animation: isLive && !isComplete ? 'terminalPulse 2s infinite' : 'none',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, color: '#e5e7eb', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>
          {headerText}
        </span>
      </div>

      {/* Log output */}
      <div
        ref={containerRef}
        style={{
          fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
          fontSize: 12,
          padding: 20,
          minHeight: 300,
          maxHeight: 500,
          overflowY: 'auto',
          lineHeight: 1.7,
        }}
      >
        {visibleLines.map((line, i) => (
          <div key={i} style={{ color: getLineColor(line), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line}
          </div>
        ))}
        {isLive && !isComplete && (
          <span style={{ color: '#4ade80', animation: 'terminalBlink 1s step-end infinite' }}>▋</span>
        )}
      </div>

      <style>{`
        @keyframes terminalPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes terminalBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
