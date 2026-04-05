'use client'

import { useEffect, useState } from 'react'
import DashboardNav from '@/components/DashboardNav'
import AppFooter from '@/components/AppFooter'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Job {
  client?: string
  clientName?: string
  transactions?: Array<{
    status?: string
    confidence?: number
  }>
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

const LS_ENABLED        = 'cb_autopilot_enabled'
const LS_THRESHOLD      = 'cb_autopilot_threshold'
const LS_FLAG_LOW       = 'cb_autopilot_flag_low'
const LS_EMAIL_DIGEST   = 'cb_autopilot_email_digest'
const LS_DEFAULT_CLIENT = 'cb_autopilot_default_client'
const LS_JOBS           = 'cb_jobs'

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const v = localStorage.getItem(key)
  if (v === null) return fallback
  return v === 'true'
}

function readInt(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const v = localStorage.getItem(key)
  if (v === null) return fallback
  const n = parseInt(v, 10)
  return isNaN(n) ? fallback : n
}

function readStr(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return localStorage.getItem(key) ?? fallback
}

function readJobs(): Job[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LS_JOBS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function deriveStats(jobs: Job[]) {
  let approved = 0
  let totalConfidence = 0
  let confidenceCount = 0

  for (const job of jobs) {
    if (!Array.isArray(job.transactions)) continue
    for (const tx of job.transactions) {
      if (tx.status === 'approved') {
        approved++
        if (typeof tx.confidence === 'number') {
          totalConfidence += tx.confidence
          confidenceCount++
        }
      }
    }
  }

  const hoursSaved = (approved * 2) / 60
  const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0

  return { approved, hoursSaved, avgConfidence }
}

function extractClients(jobs: Job[]): string[] {
  const names = new Set<string>()
  for (const job of jobs) {
    const name = job.clientName ?? job.client
    if (name && typeof name === 'string' && name.trim()) {
      names.add(name.trim())
    }
  }
  return Array.from(names).sort()
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle component
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  size = 'sm',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'lg'
}) {
  const isLg = size === 'lg'
  const trackW = isLg ? 56 : 36
  const trackH = isLg ? 30 : 20
  const thumbD = isLg ? 22 : 14
  const thumbOff = isLg ? 4 : 3
  const thumbOn = isLg ? trackW - thumbD - thumbOff : trackW - thumbD - thumbOff

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: trackW,
        height: trackH,
        borderRadius: trackH / 2,
        backgroundColor: checked ? '#2d5a27' : '#d1ccc5',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s ease',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: thumbOff,
          left: checked ? thumbOn : thumbOff,
          width: thumbD,
          height: thumbD,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AutopilotPage() {
  const [mounted, setMounted]           = useState(false)
  const [enabled, setEnabled]           = useState(false)
  const [threshold, setThreshold]       = useState(92)
  const [flagLow, setFlagLow]           = useState(true)
  const [emailDigest, setEmailDigest]   = useState(false)
  const [defaultClient, setDefaultClient] = useState('')
  const [clients, setClients]           = useState<string[]>([])
  const [stats, setStats]               = useState({ approved: 0, hoursSaved: 0, avgConfidence: 0 })

  useEffect(() => {
    const jobs = readJobs()
    setEnabled(readBool(LS_ENABLED, false))
    setThreshold(readInt(LS_THRESHOLD, 92))
    setFlagLow(readBool(LS_FLAG_LOW, true))
    setEmailDigest(readBool(LS_EMAIL_DIGEST, false))
    setDefaultClient(readStr(LS_DEFAULT_CLIENT, ''))
    setClients(extractClients(jobs))
    setStats(deriveStats(jobs))
    setMounted(true)
  }, [])

  function setAndSaveEnabled(v: boolean) {
    setEnabled(v)
    localStorage.setItem(LS_ENABLED, String(v))
  }

  function setAndSaveThreshold(v: number) {
    setThreshold(v)
    localStorage.setItem(LS_THRESHOLD, String(v))
  }

  function setAndSaveFlagLow(v: boolean) {
    setFlagLow(v)
    localStorage.setItem(LS_FLAG_LOW, String(v))
  }

  function setAndSaveEmailDigest(v: boolean) {
    setEmailDigest(v)
    localStorage.setItem(LS_EMAIL_DIGEST, String(v))
  }

  function setAndSaveDefaultClient(v: string) {
    setDefaultClient(v)
    localStorage.setItem(LS_DEFAULT_CLIENT, v)
  }

  const settingsDisabled = !enabled

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <DashboardNav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 48, height: 48, backgroundColor: '#e8f0e6' }}
          >
            <RocketIcon />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '28px',
                color: '#1a1714',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              AI Autopilot
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b6560', maxWidth: 480 }}>
              Let CloseBooks automatically categorize and close your books — no manual review required for high-confidence transactions.
            </p>
          </div>
        </div>

        {/* ── Status card ── */}
        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: '#ffffff',
            borderColor: enabled ? '#a3c99e' : '#e8e0d4',
            boxShadow: enabled ? '0 0 0 3px rgba(45,90,39,0.08)' : 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Pulsing dot */}
              <span style={{ position: 'relative', display: 'inline-flex', width: 12, height: 12 }}>
                {enabled && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      backgroundColor: '#2d5a27',
                      opacity: 0.35,
                      animation: 'cb-pulse 1.8s ease-out infinite',
                    }}
                  />
                )}
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: enabled ? '#2d5a27' : '#c5bdb4',
                    transition: 'background-color 0.3s',
                  }}
                />
              </span>

              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                    fontSize: '20px',
                    color: '#1a1714',
                    lineHeight: 1.2,
                  }}
                >
                  Autopilot is {mounted ? (enabled ? 'ON' : 'OFF') : '…'}
                </p>
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                  style={{
                    backgroundColor: enabled ? '#e8f0e6' : '#f0ebe3',
                    color: enabled ? '#2d5a27' : '#6b6560',
                  }}
                >
                  {mounted ? (enabled ? 'Active' : 'Inactive') : ''}
                </span>
              </div>
            </div>

            <Toggle
              checked={mounted ? enabled : false}
              onChange={setAndSaveEnabled}
              size="lg"
            />
          </div>

          {enabled && (
            <p className="text-xs mt-4 pt-4 border-t" style={{ borderColor: '#e8f0e6', color: '#6b6560' }}>
              Autopilot is actively monitoring new uploads. Transactions above{' '}
              <strong style={{ color: '#2d5a27' }}>{threshold}%</strong> confidence will be approved automatically.
            </p>
          )}
        </div>

        {/* ── Settings panel ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e8e0d4',
            opacity: settingsDisabled ? 0.55 : 1,
            transition: 'opacity 0.3s',
            pointerEvents: settingsDisabled ? 'none' : undefined,
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: '#e8e0d4' }}>
            <h2
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                fontSize: '16px',
                color: '#1a1714',
              }}
            >
              Autopilot Settings
            </h2>
            {settingsDisabled && (
              <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                Enable Autopilot above to configure these settings.
              </p>
            )}
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Confidence threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: '#1a1714' }}>
                  Auto-approve transactions above{' '}
                  <span
                    className="font-semibold"
                    style={{ color: '#2d5a27' }}
                  >
                    {threshold}%
                  </span>{' '}
                  confidence
                </label>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs w-8 text-right shrink-0" style={{ color: '#6b6560' }}>85%</span>
                <input
                  type="range"
                  min={85}
                  max={99}
                  step={1}
                  value={threshold}
                  onChange={(e) => setAndSaveThreshold(Number(e.target.value))}
                  disabled={settingsDisabled}
                  className="flex-1"
                  style={{
                    accentColor: '#2d5a27',
                    cursor: settingsDisabled ? 'not-allowed' : 'pointer',
                  }}
                />
                <span className="text-xs w-8 shrink-0" style={{ color: '#6b6560' }}>99%</span>
              </div>
            </div>

            {/* Flag low confidence */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                  Auto-flag transactions below 65% confidence
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                  Low-confidence transactions will be marked for manual review.
                </p>
              </div>
              <Toggle
                checked={flagLow}
                onChange={setAndSaveFlagLow}
                disabled={settingsDisabled}
              />
            </div>

            {/* Email digest */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                  Send email digest after each completed close
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                  Receive a summary email when Autopilot finishes processing a job.
                </p>
              </div>
              <Toggle
                checked={emailDigest}
                onChange={setAndSaveEmailDigest}
                disabled={settingsDisabled}
              />
            </div>

            {/* Default client */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: '#1a1714' }}>
                Default client
              </label>
              <p className="text-xs mb-2" style={{ color: '#6b6560' }}>
                Autopilot will apply this client when processing unassigned statements.
              </p>
              <select
                value={defaultClient}
                onChange={(e) => setAndSaveDefaultClient(e.target.value)}
                disabled={settingsDisabled}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: '#e8e0d4',
                  backgroundColor: '#faf8f4',
                  color: '#1a1714',
                  cursor: settingsDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">— No default —</option>
                {clients.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#a09a94' }}>
                  No clients found. Upload a job first to populate this list.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats panel ── */}
        <div>
          <h2
            className="text-base font-medium mb-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              fontSize: '16px',
            }}
          >
            Autopilot Activity
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Transactions auto-approved"
              value={mounted ? String(stats.approved) : '—'}
              accent="#2d5a27"
            />
            <StatCard
              label="Hours saved"
              value={mounted ? `${stats.hoursSaved.toFixed(1)} hrs` : '—'}
              accent="#b8734a"
            />
            <StatCard
              label="Average confidence"
              value={mounted && stats.avgConfidence > 0 ? `${stats.avgConfidence}%` : '—'}
              accent="#2d5a27"
            />
          </div>
        </div>

        {/* ── How it works ── */}
        <div
          className="rounded-2xl border p-6"
          style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
        >
          <h2
            className="mb-5"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              fontSize: '16px',
              color: '#1a1714',
            }}
          >
            How it works
          </h2>
          <div className="space-y-5">
            <HowItWorksStep
              number={1}
              title="Upload a bank statement"
              description="Autopilot processes it immediately and runs confidence scoring on every transaction."
            />
            <HowItWorksStep
              number={2}
              title="High-confidence transactions are approved automatically"
              description="Transactions above your confidence threshold are categorized and closed without any manual input."
            />
            <HowItWorksStep
              number={3}
              title="Low-confidence transactions are flagged for your review"
              description="Anything below your threshold (or below 65% if flagging is enabled) lands in your review queue."
            />
          </div>
        </div>

      </main>

      <AppFooter />

      {/* Pulse animation */}
      <style>{`
        @keyframes cb-pulse {
          0%   { transform: scale(1);   opacity: 0.35; }
          70%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-1"
      style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
    >
      <p
        className="text-2xl font-semibold"
        style={{
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
          color: accent,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p className="text-xs leading-snug" style={{ color: '#6b6560' }}>
        {label}
      </p>
    </div>
  )
}

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="flex items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
        style={{
          width: 28,
          height: 28,
          backgroundColor: '#2d5a27',
          fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
        }}
      >
        {number}
      </span>
      <div>
        <p className="text-sm font-medium" style={{ color: '#1a1714' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{description}</p>
      </div>
    </div>
  )
}

function RocketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C12 2 7 6 7 13l2 2c1-3 2-5 3-6 1 1 2 3 3 6l2-2c0-7-5-11-5-11z"
        stroke="#2d5a27"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9 15l-3 3M15 15l3 3"
        stroke="#2d5a27"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="13" r="1.5" fill="#2d5a27" />
    </svg>
  )
}
