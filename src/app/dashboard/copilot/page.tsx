'use client'

import { useEffect, useState } from 'react'
import {
  loadCopilotConfig,
  saveCopilotConfig,
  getCopilotRuns,
  DEFAULT_CONFIG,
} from '@/lib/copilotStorage'
import type { CopilotConfig, CopilotRun } from '@/types'

export default function CopilotPage() {
  const [mounted, setMounted]   = useState(false)
  const [config, setConfig]     = useState<CopilotConfig>({ ...DEFAULT_CONFIG })
  const [runs, setRuns]         = useState<CopilotRun[]>([])
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    setConfig(loadCopilotConfig())
    setRuns(getCopilotRuns())
    setMounted(true)
  }, [])

  function handleSave() {
    saveCopilotConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 space-y-8 page-enter">

        {/* Header */}
        <div>
          <p className="text-sm font-medium" style={{ color: '#2d5a27' }}>Automation</p>
          <h1
            className="text-3xl mt-0.5"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Close Copilot
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
            Configure how Copilot auto-approves transactions so you only review what truly needs your attention.
          </p>
        </div>

        {mounted ? (
          <>
            {/* Config card */}
            <div
              className="rounded-2xl border p-6 space-y-6"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Automation Rules</p>

              {/* Confidence threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium" style={{ color: '#1a1714' }}>
                    Auto-approve threshold
                  </label>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#2d5a27' }}>
                    {Math.round(config.confidenceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={97}
                  step={1}
                  value={Math.round(config.confidenceThreshold * 100)}
                  onChange={(e) => setConfig((c) => ({ ...c, confidenceThreshold: Number(e.target.value) / 100 }))}
                  className="w-full accent-green-700"
                />
                <div className="flex justify-between text-xs" style={{ color: '#a09a94' }}>
                  <span>70% — aggressive</span>
                  <span>97% — conservative</span>
                </div>
                <p className="text-xs" style={{ color: '#6b6560' }}>
                  Transactions with AI confidence above this threshold are auto-approved.
                  {config.confidenceThreshold >= 0.90
                    ? ' Conservative — only the most obvious transactions.'
                    : config.confidenceThreshold <= 0.75
                    ? ' Aggressive — Copilot approves most transactions.'
                    : ' Balanced — good for most firms.'}
                </p>
              </div>

              {/* Max auto-amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium" style={{ color: '#1a1714' }}>
                    Max auto-approve amount
                  </label>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#2d5a27' }}>
                    ${config.maxAutoAmount.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={25000}
                  step={500}
                  value={config.maxAutoAmount}
                  onChange={(e) => setConfig((c) => ({ ...c, maxAutoAmount: Number(e.target.value) }))}
                  className="w-full accent-green-700"
                />
                <p className="text-xs" style={{ color: '#6b6560' }}>
                  Transactions above this amount are never auto-approved, regardless of confidence.
                </p>
              </div>

              {/* Flag threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium" style={{ color: '#1a1714' }}>
                    Auto-flag threshold
                  </label>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#b8734a' }}>
                    {Math.round(config.autoFlagThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={80}
                  step={1}
                  value={Math.round(config.autoFlagThreshold * 100)}
                  onChange={(e) => setConfig((c) => ({ ...c, autoFlagThreshold: Number(e.target.value) / 100 }))}
                  className="w-full accent-orange-600"
                />
                <p className="text-xs" style={{ color: '#6b6560' }}>
                  Transactions with confidence below this are flagged for your attention.
                </p>
              </div>

              {/* Visual summary */}
              <div
                className="rounded-xl px-4 py-3 space-y-1.5 text-xs"
                style={{ backgroundColor: '#f5f0ea' }}
              >
                <p className="font-medium" style={{ color: '#1a1714' }}>Decision bands</p>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#059669' }} />
                  <span style={{ color: '#065f46' }}>≥ {Math.round(config.confidenceThreshold * 100)}% + ≤ ${config.maxAutoAmount.toLocaleString()} → Auto-approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#d97706' }} />
                  <span style={{ color: '#854d0e' }}>{Math.round(config.autoFlagThreshold * 100)}%–{Math.round(config.confidenceThreshold * 100) - 1}% → Pending (human reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#dc2626' }} />
                  <span style={{ color: '#991b1b' }}>&lt; {Math.round(config.autoFlagThreshold * 100)}% → Auto-flagged</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: saved ? '#059669' : '#2d5a27' }}
                onMouseEnter={(e) => { if (!saved) e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                onMouseLeave={(e) => { if (!saved) e.currentTarget.style.backgroundColor = '#2d5a27' }}
              >
                {saved ? '✓ Saved' : 'Save Configuration'}
              </button>
            </div>

            {/* Run history */}
            {runs.length > 0 && (
              <div
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <div className="px-5 py-4 border-b" style={{ borderColor: '#f0ece4' }}>
                  <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>Run History</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#faf8f4' }}>
                      {['Client', 'Date', 'Auto-approved', 'Flagged', 'Pending'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: '#6b6560', borderBottom: '1px solid #f0ece4' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run, i) => (
                      <tr
                        key={run.id}
                        style={{ borderBottom: i < runs.length - 1 ? '1px solid #f0ece4' : 'none' }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: '#1a1714' }}>
                          {run.clientName}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6b6560' }}>
                          {fmtDate(run.startedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium" style={{ color: '#059669' }}>
                            {run.autoApproved}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium" style={{ color: run.flagged > 0 ? '#dc2626' : '#a09a94' }}>
                            {run.flagged}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: '#a09a94' }}>
                            {run.leftPending}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {runs.length === 0 && (
              <div
                className="rounded-2xl border-2 border-dashed px-8 py-12 text-center"
                style={{ borderColor: '#e8e0d4' }}
              >
                <p className="text-sm" style={{ color: '#6b6560' }}>
                  No Copilot runs yet. Open any job and click &ldquo;Run Copilot&rdquo; to get started.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border p-6 animate-pulse space-y-4"
                style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
              >
                <div className="h-4 w-32 rounded" style={{ backgroundColor: '#f0ece4' }} />
                <div className="h-3 w-full rounded" style={{ backgroundColor: '#f0ece4' }} />
                <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#f0ece4' }} />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
