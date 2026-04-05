'use client'

import { useState } from 'react'
import type { RegulatoryAlert } from '@/types/compliance'

interface Props {
  alert: RegulatoryAlert
  clientName: string
  firmName: string
  onClose: () => void
  onSent: () => void
}

export default function RegulatoryLetterModal({ alert, clientName, firmName, onClose, onSent }: Props) {
  const [loading, setLoading] = useState(false)
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const defaultLetter = alert.draftLetterTemplate
    .replace(/\[CLIENT_NAME\]/g, clientName)
    .replace(/\[FIRM_NAME\]/g, firmName)

  const [letterText, setLetterText] = useState(defaultLetter)

  async function generateWithAI() {
    setLoading(true)
    try {
      const res = await fetch('/api/regulatory/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          clientName,
          firmName,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedLetter(data.letter)
        setLetterText(data.letter)
      }
    } catch {
      // Fallback to template
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(letterText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const SEVERITY_COLOR: Record<string, string> = {
    critical: '#dc2626',
    important: '#d97706',
    informational: '#3b82f6',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#e8e0d4' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: SEVERITY_COLOR[alert.severity] }}>
                  {alert.severity.toUpperCase()}
                </span>
                <span className="text-xs font-medium" style={{ color: '#6b6560' }}>{alert.source}</span>
              </div>
              <h2 className="text-base font-semibold" style={{ color: '#1a1714' }}>Draft Client Advisory Letter</h2>
              <p className="text-xs mt-0.5" style={{ color: '#6b6560' }}>{alert.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: '#6b6560' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: '#6b6560' }}>Letter to: <span style={{ color: '#1a1714' }}>{clientName}</span></p>
            <button
              onClick={generateWithAI}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ borderColor: '#b8734a', color: '#b8734a', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#fdf2e9' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>✨ Enhance with AI</>
              )}
            </button>
          </div>

          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            className="w-full rounded-xl border p-4 text-sm leading-relaxed resize-none focus:outline-none"
            style={{
              borderColor: '#e8e0d4',
              color: '#1a1714',
              backgroundColor: '#faf8f4',
              minHeight: 320,
              fontFamily: 'Georgia, serif',
            }}
            rows={16}
          />

          {generatedLetter && (
            <p className="mt-2 text-xs" style={{ color: '#2d5a27' }}>✓ Letter enhanced with AI based on client context</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-3" style={{ borderColor: '#e8e0d4' }}>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={onSent}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#2d5a27' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
          >
            Mark as Sent to Client
          </button>
        </div>
      </div>
    </div>
  )
}
