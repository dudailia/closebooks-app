'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  listPipeline,
  upsertPipeline,
  deletePipeline,
  seedFromEngagementLetters,
  type PipelineEntry,
  type PipelineStage,
} from '@/lib/engagementPipeline'
import { getEngagementLetters } from '@/lib/billingStorage'

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'signed', label: 'Signed' },
  { id: 'lost', label: 'Lost' },
]

function newId(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export default function PipelinePage() {
  const [rows, setRows] = useState<PipelineEntry[]>([])
  const [clientName, setClientName] = useState('')
  const [value, setValue] = useState('5000')

  const reload = useCallback(() => {
    const letters = getEngagementLetters()
    seedFromEngagementLetters(letters)
    setRows(listPipeline())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  function addRow() {
    const name = clientName.trim()
    if (!name) return
    const v = Math.max(0, parseFloat(value) || 0)
    upsertPipeline({
      id: newId(),
      clientName: name,
      stage: 'draft',
      value: v,
    })
    setClientName('')
    reload()
  }

  function setStage(id: string, stage: PipelineStage) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    upsertPipeline({ ...row, stage })
    reload()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 space-y-8 page-enter">
        <div>
          <Link href="/dashboard" className="text-xs transition-colors" style={{ color: '#b8734a' }}>
            ← Dashboard
          </Link>
          <h1
            className="text-3xl mt-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
              letterSpacing: '-0.02em',
            }}
          >
            Engagement pipeline
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#6b6560' }}>
            Track proposals and engagement letters from draft through signed — integrated with Billing → Engagement Letters when you create them there.
          </p>
        </div>

        <div
          className="rounded-2xl border p-5 flex flex-col sm:flex-row gap-3 sm:items-end"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium" style={{ color: '#6b6560' }}>
              Client name
            </label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Northgate Auto Parts"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
            />
          </div>
          <div className="w-full sm:w-36 space-y-1">
            <label className="text-xs font-medium" style={{ color: '#6b6560' }}>
              Est. annual $
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm font-mono"
              style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
            />
          </div>
          <button
            type="button"
            onClick={addRow}
            className="py-2.5 px-5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: '#2d5a27' }}
          >
            Add deal
          </button>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}
        >
          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm" style={{ color: '#6b6560' }}>
              No pipeline rows yet. Add a deal above or create engagement letters under Billing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#faf8f4', color: '#6b6560' }}>
                    <th className="text-left px-4 py-3 font-medium">Client</th>
                    <th className="text-left px-4 py-3 font-medium">Stage</th>
                    <th className="text-right px-4 py-3 font-medium">Value</th>
                    <th className="text-right px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t" style={{ borderColor: '#f0ebe3' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1a1714' }}>
                        {r.clientName}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.stage}
                          onChange={(e) => setStage(r.id, e.target.value as PipelineStage)}
                          className="rounded-lg border text-xs px-2 py-1"
                          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {r.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            deletePipeline(r.id)
                            reload()
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs" style={{ color: '#a09a94' }}>
          For legally binding e-signatures, connect DocuSign or Adobe Sign in your production stack; this board tracks status for your firm&apos;s workflow.
        </p>
      </main>
    </div>
  )
}
