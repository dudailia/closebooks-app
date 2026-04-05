'use client'

import type { RegulatoryAlert, ClientAlertStatus } from '@/types/compliance'

interface Props {
  alert: RegulatoryAlert
  status?: ClientAlertStatus | null
  onMarkReviewed?: () => void
  onGenerateLetter?: () => void
  onDismiss?: () => void
  compact?: boolean
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  critical:      { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626', label: 'Critical' },
  important:     { bg: '#fffbeb', border: '#fed7aa', text: '#92400e', dot: '#d97706', label: 'Important' },
  informational: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6', label: 'Info' },
}

const SOURCE_BADGE: Record<string, { bg: string; text: string }> = {
  IRS:      { bg: '#e8f0e6', text: '#2d5a27' },
  DOL:      { bg: '#fdf2e9', text: '#b8734a' },
  State:    { bg: '#eff6ff', text: '#1e40af' },
  Industry: { bg: '#f5f3ff', text: '#6d28d9' },
  SEC:      { bg: '#fef2f2', text: '#991b1b' },
  CFPB:     { bg: '#f0fdf4', text: '#166534' },
}

export default function ComplianceAlertCard({ alert, status, onMarkReviewed, onGenerateLetter, onDismiss, compact = false }: Props) {
  const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.informational
  const src = SOURCE_BADGE[alert.source] ?? SOURCE_BADGE.Industry
  const isDismissed = status?.status === 'dismissed'
  const isNotified = status?.status === 'client-notified'
  const isReviewed = status?.status === 'reviewed' || isNotified

  return (
    <div
      className="rounded-xl border p-4 transition-all"
      style={{
        backgroundColor: isDismissed ? '#faf8f4' : sev.bg,
        borderColor: isDismissed ? '#e8e0d4' : sev.border,
        opacity: isDismissed ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span
            className="mt-0.5 w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: isDismissed ? '#9ca3af' : sev.dot, marginTop: 6 }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: isDismissed ? '#e5e7eb' : src.bg, color: isDismissed ? '#6b7280' : src.text }}
              >
                {alert.source}
              </span>
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded"
                style={{ backgroundColor: isDismissed ? '#e5e7eb' : sev.bg, color: isDismissed ? '#6b7280' : sev.text, border: `1px solid ${isDismissed ? '#d1d5db' : sev.border}` }}
              >
                {sev.label}
              </span>
              {isNotified && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                  Client Notified
                </span>
              )}
              {isReviewed && !isNotified && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#e8f0e6', color: '#2d5a27' }}>
                  Reviewed
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-sm font-semibold leading-snug" style={{ color: '#1a1714' }}>
              {alert.title}
            </h3>
            {!compact && (
              <p className="mt-1 text-xs leading-relaxed" style={{ color: '#6b6560' }}>
                {alert.summary}
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs" style={{ color: '#9ca3af' }}>Effective</p>
          <p className="text-xs font-medium" style={{ color: '#1a1714' }}>
            {new Date(alert.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Action required */}
      {!compact && (
        <div className="mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
          <p className="text-xs font-medium" style={{ color: '#1a1714' }}>
            <span style={{ color: '#6b6560' }}>Action: </span>
            {alert.actionRequired}
          </p>
        </div>
      )}

      {/* Tags */}
      {!compact && alert.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {alert.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f5f0ea', color: '#6b6560' }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {(onMarkReviewed || onGenerateLetter || onDismiss) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {onGenerateLetter && !isDismissed && (
            <button
              onClick={onGenerateLetter}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
            >
              Draft Client Letter
            </button>
          )}
          {onMarkReviewed && !isReviewed && !isDismissed && (
            <button
              onClick={onMarkReviewed}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ borderColor: '#e0dbd4', color: '#6b6560', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f0ea' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              Mark Reviewed
            </button>
          )}
          {onDismiss && !isDismissed && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ color: '#9ca3af', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#6b7280' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af' }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  )
}
