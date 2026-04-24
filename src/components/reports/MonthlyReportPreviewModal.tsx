'use client'
import { useEffect, useState } from 'react'
import type { CategorizationJob } from '@/types'

interface Props {
  job: CategorizationJob
  priorJob: CategorizationJob | null
  initialEmail?: string
  onClose: () => void
}

export default function MonthlyReportPreviewModal({
  job,
  priorJob,
  initialEmail,
  onClose,
}: Props) {
  const [html, setHtml] = useState<string | null>(null)
  const [email, setEmail] = useState(initialEmail ?? '')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [statusOk, setStatusOk] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/reports/send-monthly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            preview: true,
            jobPayload: job,
            priorJobPayload: priorJob,
          }),
        })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setStatus(data.error ?? 'Preview failed')
          setStatusOk(false)
        } else {
          setHtml(data.html ?? null)
          setPreviewOnly(!!data.previewOnly)
        }
      } catch (err) {
        if (cancelled) return
        setStatus(err instanceof Error ? err.message : 'Preview failed')
        setStatusOk(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [job, priorJob])

  async function send() {
    setSending(true)
    setStatus(null)
    try {
      const res = await fetch('/api/reports/send-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          clientEmailOverride: email,
          jobPayload: job,
          priorJobPayload: priorJob,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setStatus(`Sent to ${email}`)
      setStatusOk(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Send failed')
      setStatusOk(false)
    } finally {
      setSending(false)
    }
  }

  async function copyHtml() {
    if (!html) return
    try {
      await navigator.clipboard.writeText(html)
      setStatus('HTML copied to clipboard')
      setStatusOk(true)
      setTimeout(() => {
        setStatus(null)
        setStatusOk(false)
      }, 1500)
    } catch {
      setStatus('Could not access clipboard')
      setStatusOk(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 1000,
          maxWidth: '95vw',
          height: '85vh',
          backgroundColor: '#fff',
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e0dbd4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1714' }}>
              ✦ Monthly report preview
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b6560' }}>
              {job.client_name} · {new Date(job.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'none',
              fontSize: 20,
              color: '#6b6560',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f5f1ea' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: 48, color: '#6b6560' }}>
              Rendering preview…
            </p>
          ) : html ? (
            <iframe
              title="Email preview"
              srcDoc={html}
              sandbox=""
              style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#f5f1ea' }}
            />
          ) : (
            <p style={{ textAlign: 'center', padding: 48, color: '#991b1b' }}>
              Could not render preview.
            </p>
          )}
        </div>

        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid #e0dbd4',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            style={{
              flex: 1,
              minWidth: 180,
              padding: '9px 12px',
              border: '1px solid #e0dbd4',
              borderRadius: 8,
              fontSize: 13,
              color: '#1a1714',
              backgroundColor: '#faf8f4',
            }}
          />
          {previewOnly ? (
            <>
              <span style={{ fontSize: 12, color: '#6b6560' }}>
                Resend not configured · preview only
              </span>
              <button
                type="button"
                onClick={copyHtml}
                disabled={!html}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid #e0dbd4',
                  backgroundColor: '#fff',
                  color: '#1a1714',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: html ? 'pointer' : 'not-allowed',
                  opacity: html ? 1 : 0.5,
                }}
              >
                Copy HTML
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={sending || !email.includes('@')}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#2d5a27',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: sending ? 'wait' : 'pointer',
                opacity: sending || !email.includes('@') ? 0.55 : 1,
              }}
            >
              {sending ? 'Sending…' : `Send to ${email || 'client'}`}
            </button>
          )}
        </div>
        {status && (
          <p
            style={{
              margin: 0,
              padding: '8px 18px',
              fontSize: 12,
              color: statusOk ? '#166534' : '#991b1b',
              borderTop: '1px solid #f0ece4',
              textAlign: 'center',
              backgroundColor: statusOk ? '#ecfdf5' : '#fef2f2',
            }}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  )
}
