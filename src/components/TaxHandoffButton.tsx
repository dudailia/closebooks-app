'use client'

import { useState } from 'react'
import { loadFirmSettings } from '@/lib/firmSettings'
import type { CategorizationJob } from '@/types'

interface Props {
  job: CategorizationJob
  allClientJobs: CategorizationJob[]
  onError: (msg: string) => void
}

export default function TaxHandoffButton({ job, allClientJobs, onError }: Props) {
  const [loading, setLoading] = useState(false)

  // Determine available years
  const years = [...new Set(
    allClientJobs.map((j) => new Date(j.created_at).getFullYear())
  )].sort((a, b) => b - a)

  const currentYear = new Date(job.created_at).getFullYear()

  async function handleGenerate() {
    setLoading(true)
    try {
      const firmSettings = loadFirmSettings()
      const taxYear = currentYear
      const jobsForYear = allClientJobs.filter(
        (j) => new Date(j.created_at).getFullYear() === taxYear
      )

      const res = await fetch('/api/tax-handoff', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: jobsForYear, taxYear, firmSettings }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to generate tax package.')
      }

      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Tax handoff generation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50"
      style={{ borderColor: '#e8e0d4', color: '#1a1714', backgroundColor: '#ffffff' }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = '#b45309' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e0d4' }}
      title={`Generate ${currentYear} tax prep handoff for ${job.client_name}`}
    >
      {loading ? (
        <>
          <Spinner />
          Generating…
        </>
      ) : (
        <>
          <TaxIcon />
          Tax Handoff
          {years.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium ml-0.5"
              style={{ backgroundColor: '#fef9c3', color: '#854d0e' }}
            >
              {currentYear}
            </span>
          )}
        </>
      )}
    </button>
  )
}

function TaxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1" width="11" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 5h6M4 7.5h6M4 10h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M9.5 9.5l2 2" stroke="#b45309" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10" cy="9" r="1.5" stroke="#b45309" strokeWidth="1.1" />
    </svg>
  )
}

function Spinner() {
  return (
    <span
      className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin inline-block"
      style={{ borderColor: '#1a1714', borderTopColor: 'transparent' }}
    />
  )
}
