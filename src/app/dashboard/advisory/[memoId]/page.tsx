'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdvisoryMemoViewer from '@/components/AdvisoryMemoViewer'
import AdvisoryGenerateModal from '@/components/AdvisoryGenerateModal'
import {
  getAdvisoryMemo,
  saveAdvisoryMemo,
  updateAdvisoryMemoStatus,
  deleteAdvisoryMemo,
} from '@/lib/advisoryStorage'
import { getJobs } from '@/lib/storage'
import type { AdvisoryMemo, AdvisorySection } from '@/types/advisory'
import type { CategorizationJob } from '@/types'

// ─── Tone labels ──────────────────────────────────────────────────────────────

const TONE_LABELS: Record<AdvisoryMemo['tone'], string> = {
  executive: 'Executive Brief',
  detailed: 'Detailed Analysis',
  conversational: 'Conversational',
}

const STATUS_STYLES: Record<AdvisoryMemo['status'], { bg: string; color: string }> = {
  draft: { bg: '#fef3c7', color: '#92400e' },
  sent: { bg: '#dcfce7', color: '#166534' },
  archived: { bg: '#f3f4f6', color: '#6b7280' },
}

// ─── Memo detail page ─────────────────────────────────────────────────────────

export default function MemoDetailPage() {
  const { memoId } = useParams<{ memoId: string }>()
  const router = useRouter()

  const [memo, setMemo] = useState<AdvisoryMemo | null | undefined>(undefined)
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [job, setJob] = useState<CategorizationJob | null>(null)
  const [prevJob, setPrevJob] = useState<CategorizationJob | null>(null)

  useEffect(() => {
    const found = getAdvisoryMemo(memoId)
    setMemo(found)

    if (found) {
      const allJobs = getJobs()
      const jobForMemo = allJobs.find((j) => j.id === found.jobId) ?? null
      setJob(jobForMemo)

      if (jobForMemo) {
        const clientJobs = allJobs
          .filter((j) => j.client_name === jobForMemo.client_name && j.id !== jobForMemo.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setPrevJob(clientJobs[0] ?? null)
      }
    }
  }, [memoId])

  // Auto-save edited sections
  const handleSectionEdit = useCallback(
    (section: AdvisorySection, index: number, newBody: string) => {
      if (!memo) return
      const updated: AdvisoryMemo = {
        ...memo,
        sections: memo.sections.map((s, i) =>
          i === index ? { ...s, body: newBody } : s,
        ),
      }
      setMemo(updated)
      saveAdvisoryMemo(updated)
    },
    [memo],
  )

  function handleMarkSent() {
    if (!memo) return
    updateAdvisoryMemoStatus(memo.id, 'sent')
    setMemo({ ...memo, status: 'sent', sentAt: new Date().toISOString() })
  }

  function handleCopyText() {
    if (!memo) return
    const lines = [
      `Advisory Memo — ${memo.clientName}`,
      `Generated: ${new Date(memo.generatedAt).toLocaleDateString()}`,
      `Tone: ${TONE_LABELS[memo.tone]}`,
      '',
      memo.headline,
      '',
      ...memo.sections.flatMap((s) => [
        `## ${s.title}`,
        s.body,
        s.dataPoints.length > 0 ? s.dataPoints.join(' · ') : '',
        '',
      ]),
    ]
    navigator.clipboard.writeText(lines.filter((l) => l !== undefined).join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    window.print()
  }

  function handleDelete() {
    if (!memo) return
    deleteAdvisoryMemo(memo.id)
    router.push('/dashboard/advisory')
  }

  function handleRegenerated(newMemo: AdvisoryMemo) {
    saveAdvisoryMemo(newMemo)
    setMemo(newMemo)
    setShowRegenModal(false)
  }

  // Loading
  if (memo === undefined) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <main className="flex-1 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#e8e0d4', borderTopColor: '#2d5a27' }}
          />
        </main>
      </div>
    )
  }

  // 404
  if (memo === null) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-16 text-center">
          <div className="text-5xl mb-6">📭</div>
          <h1
            className="text-2xl mb-3"
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
              color: '#1a1714',
            }}
          >
            Memo Not Found
          </h1>
          <p className="text-sm mb-6" style={{ color: '#6b6560' }}>
            This advisory memo doesn't exist or may have been deleted.
          </p>
          <Link
            href="/dashboard/advisory"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#2d5a27', color: '#ffffff' }}
          >
            ← Back to Advisory Memos
          </Link>
        </main>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[memo.status]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard/advisory"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#6b6560' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Advisory Memos
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Memo header */}
            <div
              className="rounded-2xl border p-5 mb-5 flex flex-wrap items-center justify-between gap-3"
              style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
            >
              <div>
                <h1
                  className="text-xl"
                  style={{
                    fontFamily: 'var(--font-dm-serif), "DM Serif Display", Georgia, serif',
                    color: '#1a1714',
                  }}
                >
                  {memo.clientName}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: '#6b6560' }}>
                  Generated{' '}
                  {new Date(memo.generatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={{ borderColor: '#e8e0d4', color: '#6b6560', backgroundColor: '#faf8f4' }}
                >
                  {TONE_LABELS[memo.tone]}
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                >
                  {memo.status}
                </span>
              </div>
            </div>

            {/* Memo viewer */}
            <AdvisoryMemoViewer memo={memo} onEdit={handleSectionEdit} />
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-3">
            {/* Action card */}
            <div
              className="rounded-2xl border p-4 space-y-2"
              style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: '#a09a94' }}
              >
                Actions
              </p>

              {memo.status === 'draft' && (
                <button
                  onClick={handleMarkSent}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#bbf7d0' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Mark as Sent
                </button>
              )}

              <button
                onClick={handleCopyText}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-colors"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="4" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M10 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v8a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {copied ? 'Copied!' : 'Copy as Text'}
              </button>

              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-colors"
                style={{ borderColor: '#e8e0d4', color: '#1a1714' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#faf8f4' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Download / Print
              </button>

              {job && (
                <button
                  onClick={() => setShowRegenModal(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: '#e8e0d4', color: '#b8734a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2e9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7a5 5 0 009.9-1M12 7a5 5 0 00-9.9 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M12 3v3h-3M2 11V8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Regenerate
                </button>
              )}

              <div className="pt-1 border-t" style={{ borderColor: '#f0ece4' }}>
                {deleteConfirm ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-center py-1" style={{ color: '#dc2626' }}>
                      Delete this memo?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs border"
                        style={{ borderColor: '#e8e0d4', color: '#6b6560' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
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
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M11 3.5l-.7 8a.5.5 0 01-.5.5H4.2a.5.5 0 01-.5-.5L3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Delete Memo
                  </button>
                )}
              </div>
            </div>

            {/* Edit hint */}
            <div
              className="rounded-2xl border p-4"
              style={{ backgroundColor: '#faf8f4', borderColor: '#e8e0d4' }}
            >
              <p className="text-xs" style={{ color: '#6b6560' }}>
                <span className="font-medium" style={{ color: '#1a1714' }}>Tip:</span>{' '}
                Click the pencil icon on any section to edit the text. Changes are saved automatically.
              </p>
            </div>

            {/* Sent info */}
            {memo.sentAt && (
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: '#f0f9f0', borderColor: '#bbf7d0' }}
              >
                <p className="text-xs" style={{ color: '#166534' }}>
                  Sent on{' '}
                  {new Date(memo.sentAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>


      {/* Regenerate modal */}
      {showRegenModal && job && (
        <AdvisoryGenerateModal
          job={job}
          previousJob={prevJob}
          onGenerated={handleRegenerated}
          onClose={() => setShowRegenModal(false)}
        />
      )}
    </div>
  )
}
