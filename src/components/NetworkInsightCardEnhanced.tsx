'use client'

import { useState } from 'react'

interface Props {
  type: 'opportunity' | 'warning' | 'trend' | 'alert'
  title: string
  description: string
  impactValue?: string       // "$47K potential savings" or "3x audit risk"
  affectedClients?: number
  source: string             // "Based on 847 firms"
  actionLabel?: string
  onAction?: () => void
}

const TYPE_CONFIG = {
  opportunity: {
    border: '#f59e0b',
    iconBg: '#fefce8',
    iconColor: '#f59e0b',
    badge: '#fef3c7',
    badgeText: '#92400e',
    badgeLabel: 'Opportunity',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.128L8 10.557l-3.708 2.023L5 8.452 2 5.528l4.146-.772L8 1z"
          fill="#f59e0b" />
      </svg>
    ),
  },
  warning: {
    border: '#ef4444',
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    badge: '#fee2e2',
    badgeText: '#991b1b',
    badgeLabel: 'Warning',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L1.5 13.5h13L8 1.5z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v3.5M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  trend: {
    border: '#3b82f6',
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    badge: '#dbeafe',
    badgeText: '#1e40af',
    badgeLabel: 'Trend',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l4-5 3 2 5-6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 3h3v3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  alert: {
    border: '#f97316',
    iconBg: '#fff7ed',
    iconColor: '#f97316',
    badge: '#ffedd5',
    badgeText: '#9a3412',
    badgeLabel: 'Alert',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="#f97316" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 10.5v.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

export default function NetworkInsightCardEnhanced({
  type,
  title,
  description,
  impactValue,
  affectedClients,
  source,
  actionLabel,
  onAction,
}: Props) {
  const [toastVisible, setToastVisible] = useState(false)
  const cfg = TYPE_CONFIG[type]

  function handleAction() {
    onAction?.()
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3200)
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e8e0d4',
        borderLeft: `4px solid ${cfg.border}`,
        borderRadius: 12,
        padding: '16px 18px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Toast */}
      {toastVisible && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: '#1a1714',
            color: '#ffffff',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          Applied to client queue
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: cfg.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: cfg.badgeText,
                backgroundColor: cfg.badge,
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              {cfg.badgeLabel}
            </span>
            {impactValue && (
              <span style={{ fontSize: 11, fontWeight: 600, color: cfg.iconColor }}>
                {impactValue}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1714', margin: 0, lineHeight: 1.4 }}>
            {title}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#4a443f', margin: 0, lineHeight: 1.6 }}>
        {description}
      </p>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: '#6b6560' }}>{source}</span>
          {affectedClients !== undefined && affectedClients > 0 && (
            <span
              style={{
                fontSize: 11,
                color: '#2d5a27',
                backgroundColor: '#e8f0e6',
                borderRadius: 4,
                padding: '2px 6px',
                fontWeight: 600,
              }}
            >
              {affectedClients} client{affectedClients !== 1 ? 's' : ''} affected
            </span>
          )}
        </div>

        {actionLabel && (
          <button
            onClick={handleAction}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#2d5a27',
              backgroundColor: '#e8f0e6',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d4e8d0' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8f0e6' }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
