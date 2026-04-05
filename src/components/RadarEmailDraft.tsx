'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// RadarEmailDraft
// Shows an editable AI-drafted client alert email with clipboard copy.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  subject: string
  body: string
  clientEmail: string
  onSend: () => void
  onEdit: (body: string) => void
}

export default function RadarEmailDraft({
  subject,
  body,
  clientEmail,
  onSend,
  onEdit,
}: Props) {
  const [copied, setCopied] = useState(false)
  const [editedBody, setEditedBody] = useState(body)
  const [showSubject, setShowSubject] = useState(false)

  // Keep in sync if parent passes new body (e.g. after AI regenerate)
  const currentBody = editedBody !== body && editedBody !== '' ? editedBody : body

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditedBody(e.target.value)
    onEdit(e.target.value)
  }

  async function handleCopyAndSend() {
    const fullEmail = `To: ${clientEmail}\nSubject: ${subject}\n\n${currentBody}`
    try {
      await navigator.clipboard.writeText(fullEmail)
    } catch {
      // Fallback for browsers that restrict clipboard
      const ta = document.createElement('textarea')
      ta.value = fullEmail
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    onSend()
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e8e0d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#faf8f4',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(184,115,74,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            ✉
          </span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1714' }}>
              AI-Drafted Alert Email
            </div>
            <div style={{ fontSize: '11px', color: '#6b6560' }}>
              To: {clientEmail || 'client@company.com'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSubject((v) => !v)}
          style={{
            fontSize: '11px',
            color: '#b8734a',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          {showSubject ? 'Hide' : 'Subject'}
        </button>
      </div>

      {/* Subject line */}
      {showSubject && (
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid #e8e0d4',
            fontSize: '13px',
            color: '#1a1714',
            backgroundColor: '#fffdf9',
          }}
        >
          <span style={{ color: '#6b6560', marginRight: '6px' }}>Subject:</span>
          {subject}
        </div>
      )}

      {/* Body textarea */}
      <textarea
        value={currentBody}
        onChange={handleBodyChange}
        rows={12}
        style={{
          width: '100%',
          padding: '16px 20px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#1a1714',
          backgroundColor: '#ffffff',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        placeholder="Email body will appear here..."
      />

      {/* Footer actions */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #e8e0d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#faf8f4',
        }}
      >
        <span style={{ fontSize: '11px', color: '#6b6560' }}>
          Copies email to clipboard for sending via your email client
        </span>

        <button
          onClick={handleCopyAndSend}
          style={{
            backgroundColor: copied ? '#2d5a27' : '#b8734a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? (
            <>
              <span style={{ fontSize: '14px' }}>✓</span>
              Copied!
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px' }}>📋</span>
              Send to Client
            </>
          )}
        </button>
      </div>
    </div>
  )
}
