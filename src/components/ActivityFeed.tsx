'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getActivity, relativeTime } from '@/lib/activity'
import type { ActivityEvent, ActivityEventType } from '@/lib/activity'

// ---------------------------------------------------------------------------
// Event config — icon, colours, label per type
// ---------------------------------------------------------------------------

interface EventConfig {
  icon: React.ReactNode
  iconBg: string
  dotColor: string
}

function getConfig(type: ActivityEventType): EventConfig {
  switch (type) {
    case 'close_started':
      return {
        iconBg: '#fdf2e9',
        dotColor: '#b8734a',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 2.5l6 3.5-6 3.5V2.5z" fill="#b8734a" />
          </svg>
        ),
      }
    case 'close_completed':
      return {
        iconBg: '#ecfdf5',
        dotColor: '#059669',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      }
    case 'transactions_categorized':
      return {
        iconBg: '#eff6ff',
        dotColor: '#3b82f6',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="#3b82f6" strokeWidth="1.2" />
            <path d="M3 5.5h6M3 7.5h4" stroke="#3b82f6" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      }
    case 'csv_exported':
      return {
        iconBg: '#f5f0ea',
        dotColor: '#6b6560',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5" stroke="#6b6560" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.5 10h9" stroke="#6b6560" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      }
    case 'report_generated':
      return {
        iconBg: '#f5f0ea',
        dotColor: '#6b6560',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="1" width="7" height="9.5" rx="1.2" stroke="#6b6560" strokeWidth="1.2" fill="none" />
            <path d="M3.5 4h4M3.5 6h4M3.5 8h2" stroke="#6b6560" strokeWidth="1" strokeLinecap="round" />
            <path d="M8 7l1.5 1.5L12 6" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      }
    case 'pdf_uploaded':
      return {
        iconBg: '#eff6ff',
        dotColor: '#3b82f6',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 1.5h5l3 3V10a.5.5 0 01-.5.5h-7A.5.5 0 011.5 10V2a.5.5 0 01.5-.5z" stroke="#3b82f6" strokeWidth="1.2" fill="none" />
            <path d="M7 1.5v3h3" stroke="#3b82f6" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      }
    case 'client_created':
      return {
        iconBg: '#ecfdf5',
        dotColor: '#059669',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="4" r="2" stroke="#059669" strokeWidth="1.2" />
            <path d="M1 10c0-2.209 1.791-4 4-4s4 1.791 4 4" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M9.5 3.5v3M8 5h3" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      }
    case 'client_deleted':
      return {
        iconBg: '#fef2f2',
        dotColor: '#ef4444',
        icon: (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="4" r="2" stroke="#ef4444" strokeWidth="1.2" />
            <path d="M1 10c0-2.209 1.791-4 4-4s4 1.791 4 4" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M8 5h3" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      }
  }
}

// ---------------------------------------------------------------------------
// ActivityFeed
// ---------------------------------------------------------------------------

interface Props {
  /** If provided, only show events for this client */
  clientName?: string
  /** Max events to show initially */
  limit?: number
  /** Compact layout — no section heading, tighter spacing */
  compact?: boolean
}

export default function ActivityFeed({ clientName, limit = 10, compact = false }: Props) {
  const [events, setEvents]   = useState<ActivityEvent[]>([])
  const [mounted, setMounted] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setEvents(getActivity(clientName))
    setMounted(true)
  }, [clientName])

  if (!mounted) {
    // Loading skeleton
    return (
      <div className="space-y-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full shrink-0" style={{ backgroundColor: '#f0ece4' }} />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 rounded w-3/4" style={{ backgroundColor: '#f0ece4' }} />
              <div className="h-2.5 rounded w-1/3" style={{ backgroundColor: '#f0ece4' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs" style={{ color: '#c4bdb8' }}>
          {clientName ? 'No activity for this client yet.' : 'No activity yet — start a close to see events here.'}
        </p>
      </div>
    )
  }

  const displayed  = showAll ? events : events.slice(0, limit)
  const hasMore    = events.length > limit && !showAll

  return (
    <div>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#a09a94' }}>
            Recent Activity
          </h2>
          <span className="text-xs" style={{ color: '#a09a94' }}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-3.5 top-0 bottom-0 w-px"
          style={{ backgroundColor: '#e8e0d4' }}
          aria-hidden="true"
        />

        <div className="space-y-0">
          {displayed.map((event, i) => {
            const cfg = getConfig(event.type)
            const isLast = i === displayed.length - 1

            return (
              <div
                key={event.id}
                className={`relative flex gap-4 ${isLast ? 'pb-0' : 'pb-4'}`}
              >
                {/* Icon circle */}
                <div
                  className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2"
                  style={{
                    backgroundColor: cfg.iconBg,
                    borderColor: '#faf8f4',
                    boxShadow: `0 0 0 1px ${cfg.dotColor}22`,
                  }}
                >
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm leading-snug" style={{ color: '#1a1714' }}>
                    {event.description}
                  </p>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {event.clientName && !clientName && (
                      <Link
                        href="/dashboard/clients"
                        className="text-xs font-medium px-1.5 py-0.5 rounded transition-colors"
                        style={{ backgroundColor: '#f0ece4', color: '#6b4c32' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.clientName}
                      </Link>
                    )}
                    <span className="text-xs" style={{ color: '#c4bdb8' }}>
                      {relativeTime(event.timestamp)}
                    </span>
                    {event.jobId && (
                      <Link
                        href={`/dashboard/review/${event.jobId}`}
                        className="text-xs transition-colors"
                        style={{ color: '#b8734a' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#8a4f2e' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#b8734a' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-xs transition-colors"
          style={{ color: '#b8734a' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#8a4f2e' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#b8734a' }}
        >
          Show {events.length - limit} more →
        </button>
      )}
    </div>
  )
}
