'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import AdvisoryGenerateModal from '@/components/AdvisoryGenerateModal'
import {
  getAdvisoryMemos,
  saveAdvisoryMemo,
  updateAdvisoryMemoStatus,
  deleteAdvisoryMemo,
} from '@/lib/advisoryStorage'
import { getJobs, getClients } from '@/lib/storage'
import type { AdvisoryMemo } from '@/types/advisory'
import type { CategorizationJob, Client } from '@/types'

// ─── Tone & status labels ─────────────────────────────────────────────────────

const TONE_LABELS: Record<AdvisoryMemo['tone'], string> = {
  executive: 'Executive',
  detailed: 'Detailed',
  conversational: 'Conversational',
}

const STATUS_STYLES: Record<AdvisoryMemo['status'], { bg: string; color: string }> = {
  draft: { bg: '#fef3c7', color: '#92400e' },
  sent: { bg: '#dcfce7', color: '#166534' },
  archived: { bg: '#f3f4f6', color: '#6b7280' },
}

// ─── Job+Client selector modal ────────────────────────────────────────────────

function JobSelectorModal({
  onSelect,
  onClose,
}: {
  onSelect: (job: CategorizationJob, prevJob: CategorizationJob | null) => void
  onClose: () => void
}) {
  const [jobs, setJobs] = useState<CategorizationJob[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setJobs(getJobs().filter((j) => j.status === 'completed' || j.status === 'review'))
  }, [])

  const filtered = jobs.filter((j) =>
    j.client_name.toLowerCase().includes(search.toLowerCase()),
  )

  function handleConfirm() {
    const job = jobs.find((j) => j.id === selected)
    if (!job) return
    // Find previous job for same client
    const clientJobs = jobs
      .filter((j) => j.client_name === job.client_name && j.id !== job.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    onSelect(job, clientJobs[0] ?? null)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}
        >
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            Select a Close
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border text-sm"
            style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
          />

          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {filtered.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: '#a09a94' }}>
                No completed closes found. Upload and review transactions first.
              </p>
            )}
            {filtered.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelected(job.id)}
                className="w-full text-left rounded-xl border p-3 transition-all"
                style={{
                  borderColor: selected === job.id ? '#2d5a27' : '#e8e0d4',
                  backgroundColor: selected === job.id ? '#f0f7ee' : '#ffffff',
                }}
              >
                <p className="text-sm font-medium" style={{ color: '#1a1714' }}>
                  {job.client_name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>
                  {new Date(job.created_at).toLocaleDateString()} · {job.total_transactions} transactions
                </p>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: '#2d5a27' }}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'draft' | 'sent' | 'archived'

export default function AdvisoryPage() {
  const [memos, setMemos] = useState<AdvisoryMemo[]>([])
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [showJobSelector, setShowJobSelector] = useState(false)
  const [pendingJob, setPendingJob] = useState<CategorizationJob | null>(null)
  const [pendingPrevJob, setPendingPrevJob] = useState<CategorizationJob | null>(null)
  const [showGenModal, setShowGenModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  function reload() {
    setMemos(getAdvisoryMemos())
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    return memos
      .filter((m) => tab === 'all' || m.status === tab)
      .filter(
        (m) =>
          !search || m.clientName.toLowerCase().includes(search.toLowerCase()),
      )
  }, [memos, tab, search])

  // Stats
  const total = memos.length
  const sent = memos.filter((m) => m.status === 'sent').length
  const draft = memos.filter((m) => m.status === 'draft').length
  const clients = new Set(memos.map((m) => m.clientName)).size

  function handleGenerated(memo: AdvisoryMemo) {
    saveAdvisoryMemo(memo)
    reload()
    setShowGenModal(false)
    setPendingJob(null)
    setPendingPrevJob(null)
  }

  function handleJobSelected(job: CategorizationJob, prevJob: CategorizationJob | null) {
    setPendingJob(job)
    setPendingPrevJob(prevJob)
    setShowJobSelector(false)
    setShowGenModal(true)
  }

  function handleSend(id: string) {
    updateAdvisoryMemoStatus(id, 'sent')
    reload()
  }

  function handleDelete(id: string) {
    deleteAdvisoryMemo(id)
    setDeleteConfirmId(null)
    reload()
  }

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'sent', label: 'Sent' },
    { id: 'archived', label: 'Archived' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
              }}
            >
              Advisory Memos
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b6560' }}>
              AI-generated client insights you can send in one click
            </p>
          </div>
          <button
            onClick={() => setShowJobSelector(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Generate New Memo
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Memos', value: total },
            { label: 'Sent', value: sent },
            { label: 'Draft', value: draft },
            { label: 'Clients with Memos', value: clients },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border p-4"
              style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
            >
              <p className="text-2xl font-semibold" style={{ color: '#1a1714' }}>
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6560' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-1 rounded-xl border p-1"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="px-3 py-1.5 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: tab === id ? '#2d5a27' : 'transparent',
                  color: tab === id ? '#ffffff' : '#6b6560',
                  fontWeight: tab === id ? 500 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4', color: '#1a1714' }}
          />
        </div>

        {/* Memo list */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border flex flex-col items-center justify-center py-16 px-8 text-center"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            <div className="text-4xl mb-4">📝</div>
            <p
              className="text-base font-medium mb-2"
              style={{
                fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                color: '#1a1714',
              }}
            >
              {memos.length === 0
                ? 'No advisory memos yet'
                : 'No memos match your filters'}
            </p>
            <p className="text-sm max-w-sm" style={{ color: '#6b6560' }}>
              {memos.length === 0
                ? 'Complete a close to generate your first memo.'
                : 'Try a different tab or clear the search.'}
            </p>
            {memos.length === 0 && (
              <button
                onClick={() => setShowJobSelector(true)}
                className="mt-5 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#2d5a27' }}
              >
                Generate First Memo
              </button>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e0d4', backgroundColor: '#faf8f4' }}>
                  {['Client', 'Headline', 'Tone', 'Status', 'Date', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: '#6b6560' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((memo, i) => {
                  const statusStyle = STATUS_STYLES[memo.status]
                  return (
                    <tr
                      key={memo.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? '1px solid #f0ece4' : 'none',
                      }}
                      className="group"
                    >
                      {/* Client */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/advisory/${memo.id}`}
                          className="font-medium text-sm hover:underline"
                          style={{ color: '#1a1714' }}
                        >
                          {memo.clientName}
                        </Link>
                        {memo.clientIndustry && (
                          <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>
                            {memo.clientIndustry}
                          </p>
                        )}
                      </td>

                      {/* Headline */}
                      <td className="px-4 py-3 max-w-xs">
                        <Link href={`/dashboard/advisory/${memo.id}`}>
                          <p
                            className="text-sm italic line-clamp-2 hover:text-opacity-80"
                            style={{
                              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                              color: '#3d3835',
                            }}
                          >
                            {memo.headline}
                          </p>
                        </Link>
                      </td>

                      {/* Tone */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full border"
                          style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                        >
                          {TONE_LABELS[memo.tone]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {memo.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <p className="text-xs" style={{ color: '#6b6560' }}>
                          {new Date(memo.generatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/advisory/${memo.id}`}
                            className="px-2.5 py-1 rounded-lg text-xs border transition-colors"
                            style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f5f0ea'
                              e.currentTarget.style.color = '#1a1714'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#6b6560'
                            }}
                          >
                            View
                          </Link>
                          {memo.status === 'draft' && (
                            <button
                              onClick={() => handleSend(memo.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                              style={{ backgroundColor: '#fdf2e9', color: '#b8734a' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fae4cc' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                            >
                              Send
                            </button>
                          )}
                          {deleteConfirmId === memo.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(memo.id)}
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded text-xs"
                                style={{ color: '#6b6560' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(memo.id)}
                              className="px-2 py-1 rounded-lg text-xs transition-colors"
                              style={{ color: '#a09a94' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#fee2e2'
                                e.currentTarget.style.color = '#dc2626'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#a09a94'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>


      {/* Job selector */}
      {showJobSelector && (
        <JobSelectorModal
          onSelect={handleJobSelected}
          onClose={() => setShowJobSelector(false)}
        />
      )}

      {/* Generate modal */}
      {showGenModal && pendingJob && (
        <AdvisoryGenerateModal
          job={pendingJob}
          previousJob={pendingPrevJob}
          onGenerated={handleGenerated}
          onClose={() => {
            setShowGenModal(false)
            setPendingJob(null)
            setPendingPrevJob(null)
          }}
        />
      )}
    </div>
  )
}
