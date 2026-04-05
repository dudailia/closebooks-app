'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CloseTerminal from '@/components/autopilot/CloseTerminal'
import CloseReport from '@/components/autopilot/CloseReport'
import type { CloseResult } from '@/components/autopilot/CloseTerminal'

// ─── localStorage helpers ──────────────────────────────────────────────────────

interface Job {
  id?: string
  client?: string
  clientName?: string
}

function getClientName(clientId: string): string {
  if (typeof window === 'undefined') return clientId
  try {
    const raw = localStorage.getItem('closebooks_jobs') ?? localStorage.getItem('cb_jobs') ?? '[]'
    const jobs: Job[] = JSON.parse(raw)
    const job = jobs.find(j => {
      const name = j.clientName ?? j.client ?? ''
      return (
        name === clientId ||
        name.toLowerCase().replace(/\s+/g, '-') === clientId ||
        j.id === clientId
      )
    })
    return job?.clientName ?? job?.client ?? decodeURIComponent(clientId)
  } catch {
    return decodeURIComponent(clientId)
  }
}

function getPeriodLabel(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Phase = 'running' | 'transitioning' | 'complete'

export default function RunClosePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : (params.clientId ?? '')

  const [phase, setPhase] = useState<Phase>('running')
  const [result, setResult] = useState<CloseResult | null>(null)
  const [clientName, setClientName] = useState('')
  const period = getPeriodLabel()

  const terminalRef = useRef<HTMLDivElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setClientName(getClientName(clientId))
  }, [clientId])

  function handleComplete(closeResult: CloseResult) {
    setResult(closeResult)

    // Phase: start transition — fade terminal out
    setPhase('transitioning')

    // After terminal fades, show report sliding in
    setTimeout(() => {
      setPhase('complete')
    }, 350)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 w-full max-w-7xl mx-auto px-5 py-8">
        {/* Back nav */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push(`/dashboard/autopilot/${clientId}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '13px',
              color: '#6b6560',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1a1714')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6560')}
          >
            ← Back to {clientName || 'Client'}
          </button>
        </div>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '26px',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              margin: '0 0 4px 0',
            }}
          >
            {phase === 'complete' ? 'Close Report' : 'Running Month-End Close'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6b6560', margin: 0 }}>
            {clientName} · {period}
          </p>
        </div>

        {/* Terminal — fades out */}
        {(phase === 'running' || phase === 'transitioning') && (
          <div
            ref={terminalRef}
            style={{
              opacity: phase === 'transitioning' ? 0 : 1,
              transition: 'opacity 0.3s ease',
              pointerEvents: phase === 'transitioning' ? 'none' : 'auto',
            }}
          >
            <CloseTerminal
              clientName={clientName || decodeURIComponent(clientId)}
              period={period}
              onComplete={handleComplete}
            />
          </div>
        )}

        {/* Report — slides in */}
        {phase === 'complete' && result && (
          <div ref={reportRef}>
            <CloseReport
              result={result}
              clientName={clientName || decodeURIComponent(clientId)}
              period={period}
            />
          </div>
        )}
      </main>

    </div>
  )
}
