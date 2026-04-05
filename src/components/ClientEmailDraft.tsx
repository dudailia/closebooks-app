'use client'

import { useState } from 'react'
import { loadFirmSettings } from '@/lib/firmSettings'
import type { CategorizationJob } from '@/types'

interface Props {
  job: CategorizationJob
  previousJob?: CategorizationJob | null
  onClose: () => void
}

type Tone = 'professional' | 'friendly' | 'brief'
type Step = 'loading' | 'edit' | 'sent' | 'error'

const TONE_LABELS: { value: Tone; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', desc: 'Formal & precise' },
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm & conversational' },
  { value: 'brief',        label: 'Brief',         desc: '3–5 sentences max' },
]

export default function ClientEmailDraft({ job, previousJob, onClose }: Props) {
  const [step, setStep]         = useState<Step>('loading')
  const [tone, setTone]         = useState<Tone>('friendly')
  const [subject, setSubject]   = useState('')
  const [bodyText, setBodyText] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [toEmail, setToEmail]   = useState('')
  const [copied, setCopied]     = useState(false)
  const [errMsg, setErrMsg]     = useState('')
  const [loading, setLoading]   = useState(false)

  // Auto-generate on mount
  useState(() => {
    generate('friendly')
  })

  async function generate(t: Tone) {
    setStep('loading')
    setLoading(true)
    try {
      const firmSettings = loadFirmSettings()
      const res = await fetch('/api/client-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, previousJob, firmSettings, tone: t }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Draft generation failed.')
      setSubject(data.subject)
      setBodyText(data.bodyText)
      setBodyHtml(data.bodyHtml)
      setStep('edit')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Failed to generate draft.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  function handleToneChange(t: Tone) {
    setTone(t)
    generate(t)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bodyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback: select the textarea
    }
  }

  function handleMailto() {
    const encoded = encodeURIComponent(bodyText)
    const subj    = encodeURIComponent(subject)
    const mailto  = `mailto:${toEmail}?subject=${subj}&body=${encoded}`
    window.open(mailto, '_blank')
    setStep('sent')
  }

  // Trigger generate on first render
  if (step === 'loading' && !loading) {
    generate(tone)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,23,20,0.55)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#ffffff', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-b"
          style={{ borderColor: '#f0ece4' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
              Draft Client Email
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#a09a94' }}>{job.client_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0ece4' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="#6b6560" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {step === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#2d5a27', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: '#6b6560' }}>Drafting your email…</p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-sm font-medium" style={{ color: '#991b1b' }}>Could not generate draft</p>
            <p className="text-xs" style={{ color: '#6b6560' }}>{errMsg}</p>
            <button
              onClick={() => generate(tone)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: '#2d5a27' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Sent */}
        {step === 'sent' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ecfdf5' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-base font-semibold" style={{ color: '#1a1714' }}>Email opened in your email client</p>
            <p className="text-sm" style={{ color: '#6b6560' }}>
              Review and send from your own inbox. The draft has been pre-filled.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#f0ece4', color: '#1a1714' }}
            >
              Close
            </button>
          </div>
        )}

        {/* Edit */}
        {step === 'edit' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tone selector */}
            <div className="px-6 py-3 border-b flex items-center gap-3 shrink-0" style={{ borderColor: '#f0ece4' }}>
              <span className="text-xs font-medium" style={{ color: '#6b6560' }}>Tone:</span>
              <div className="flex gap-1">
                {TONE_LABELS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleToneChange(t.value)}
                    disabled={loading}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: tone === t.value ? '#2d5a27' : '#f5f0ea',
                      color:           tone === t.value ? '#ffffff' : '#6b6560',
                    }}
                    title={t.desc}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => generate(tone)}
                disabled={loading}
                className="ml-auto text-xs flex items-center gap-1 disabled:opacity-40"
                style={{ color: '#b8734a' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6 1v3l2-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Regenerate
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: '#6b6560' }}>To</label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-xl border px-3.5 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: '#6b6560' }}>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border px-3.5 py-2 text-sm focus:outline-none"
                  style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: '#6b6560' }}>Email body</label>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={10}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none resize-none leading-relaxed"
                  style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4', color: '#1a1714' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2d5a27' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#e8e0d4' }}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div
              className="px-6 py-4 border-t flex items-center justify-between gap-3 shrink-0"
              style={{ borderColor: '#f0ece4' }}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: '#e8e0d4', color: '#6b6560', backgroundColor: copied ? '#ecfdf5' : '#ffffff' }}
              >
                {copied ? '✓ Copied' : 'Copy text'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ color: '#6b6560' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleMailto}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
                  style={{ backgroundColor: '#2d5a27' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                  title="Opens your email client with the draft pre-filled"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.3"/>
                    <path d="M1 4.5l6 4 6-4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Open in Email Client →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
