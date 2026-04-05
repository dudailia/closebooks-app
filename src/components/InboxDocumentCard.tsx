'use client'

import { useRef, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface InboxDocumentCardProps {
  id: string
  source: 'email' | 'sms' | 'upload'
  documentType: 'receipt' | 'invoice' | 'statement' | 'unknown'
  title: string
  amount?: number
  date: string
  clientName?: string
  status: 'processing' | 'matched' | 'unmatched' | 'review' | 'archived'
  matchConfidence?: number
  processingDuration?: number
  onClick: () => void
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ReceiptIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
      <line x1="8" y1="8" x2="16" y2="8"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="16" x2="12" y2="16"/>
    </svg>
  )
}

function InvoiceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

function StatementIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="10" y2="15"/>
      <line x1="14" y1="15" x2="18" y2="15"/>
    </svg>
  )
}

function UnknownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}

function SmsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InboxDocumentCardProps['status'] }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    matched:    { bg: '#dcfce7', color: '#166534', label: 'Matched' },
    unmatched:  { bg: '#fef3c7', color: '#92400e', label: 'Unmatched' },
    processing: { bg: '#f1f5f9', color: '#475569', label: 'Processing…' },
    review:     { bg: '#dbeafe', color: '#1e40af', label: 'Review' },
    archived:   { bg: '#f5f5f4', color: '#78716c', label: 'Archived' },
  }

  const s = styles[status] ?? styles.archived

  if (status === 'processing') {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          background: 'linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%)',
          backgroundSize: '200% 100%',
          color: '#475569',
          animation: 'shimmer 1.5s infinite',
        }}
      >
        Processing…
      </span>
    )
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  )
}

// ─── Document type icon wrapper ───────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  receipt:   { bg: '#fdf4ff', color: '#7e22ce' },
  invoice:   { bg: '#eff6ff', color: '#1d4ed8' },
  statement: { bg: '#f0fdf4', color: '#15803d' },
  unknown:   { bg: '#f5f5f4', color: '#78716c' },
}

function DocTypeIcon({ type }: { type: InboxDocumentCardProps['documentType'] }) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS.unknown
  const Icon =
    type === 'receipt' ? ReceiptIcon :
    type === 'invoice' ? InvoiceIcon :
    type === 'statement' ? StatementIcon :
    UnknownIcon

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.bg,
        color: colors.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon />
    </div>
  )
}

function SourcePill({ source }: { source: InboxDocumentCardProps['source'] }) {
  const Icon = source === 'email' ? EmailIcon : source === 'sms' ? SmsIcon : UploadIcon
  const labels = { email: 'Email', sms: 'SMS', upload: 'Upload' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '1px 7px',
        borderRadius: 9999,
        fontSize: 10,
        fontWeight: 500,
        backgroundColor: '#f5f0ea',
        color: '#6b6560',
      }}
    >
      <Icon />
      {labels[source]}
    </span>
  )
}

// ─── Shimmer keyframe injection ───────────────────────────────────────────────

function useShimmerStyle() {
  useEffect(() => {
    const id = 'inbox-shimmer-style'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes cardShimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `
    document.head.appendChild(style)
  }, [])
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function InboxDocumentCard(props: InboxDocumentCardProps) {
  const {
    source, documentType, title, amount, date, clientName,
    status, matchConfidence, processingDuration, onClick,
  } = props

  useShimmerStyle()
  const cardRef = useRef<HTMLDivElement>(null)

  const isProcessing = status === 'processing'
  const isMatched    = status === 'matched'

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const formattedAmount = amount != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : null

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        border: '1px solid #e8e0d4',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        overflow: 'hidden',
        borderLeft: isMatched ? '4px solid #22c55e' : '1px solid #e8e0d4',
        ...(isProcessing ? {
          backgroundImage: 'linear-gradient(90deg, #ffffff 25%, #f8fafc 50%, #ffffff 75%)',
          backgroundSize: '200% 100%',
          animation: 'cardShimmer 2s infinite',
        } : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = isMatched ? '#22c55e' : '#d4c9bc'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = isMatched ? '#22c55e' : '#e8e0d4'
      }}
    >
      {/* Left: icon */}
      <DocTypeIcon type={documentType} />

      {/* Center: info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#1a1714',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 260,
            }}
          >
            {title}
          </span>
          <SourcePill source={source} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6b6560' }}>{formattedDate}</span>
          {clientName && (
            <>
              <span style={{ fontSize: 12, color: '#d4c9bc' }}>·</span>
              <span style={{ fontSize: 12, color: '#6b6560' }}>{clientName}</span>
            </>
          )}
          {matchConfidence != null && status === 'matched' && (
            <>
              <span style={{ fontSize: 12, color: '#d4c9bc' }}>·</span>
              <span style={{ fontSize: 12, color: '#15803d', fontWeight: 500 }}>
                {Math.round(matchConfidence * 100)}% confidence
              </span>
            </>
          )}
          {processingDuration != null && status !== 'processing' && (
            <>
              <span style={{ fontSize: 12, color: '#d4c9bc' }}>·</span>
              <span style={{ fontSize: 12, color: '#6b6560' }}>
                {processingDuration < 1000
                  ? `${processingDuration}ms`
                  : `${(processingDuration / 1000).toFixed(1)}s`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: amount + status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {formattedAmount && (
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1714' }}>
            {formattedAmount}
          </span>
        )}
        <StatusBadge status={status} />
      </div>
    </div>
  )
}
