'use client'

import Link from 'next/link'
import { getAllAlerts } from '@/lib/regulatoryAlerts'

export default function ComplianceFeedWidget() {
  const alerts = getAllAlerts()
  const critical = alerts.filter(a => a.severity === 'critical')
  const important = alerts.filter(a => a.severity === 'important')

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e8e0d4', backgroundColor: '#ffffff' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#e8e0d4' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>Regulatory Alerts</span>
          {critical.length > 0 && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: '#dc2626' }}>
              {critical.length} Critical
            </span>
          )}
        </div>
        <Link href="/dashboard/compliance" className="text-xs font-medium transition-colors" style={{ color: '#2d5a27' }}>
          View all →
        </Link>
      </div>

      <div className="divide-y" style={{ divideColor: '#f5f0ea' }}>
        {alerts.slice(0, 3).map(alert => {
          const color = alert.severity === 'critical' ? '#dc2626' : alert.severity === 'important' ? '#d97706' : '#3b82f6'
          return (
            <Link key={alert.id} href="/dashboard/compliance" className="flex items-start gap-3 px-4 py-3 block transition-colors hover:bg-[#faf8f4]">
              <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: '#1a1714' }}>
                  {alert.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                  {alert.source} · Effective {new Date(alert.effectiveDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: '#e8e0d4', backgroundColor: '#faf8f4' }}>
        <p className="text-xs" style={{ color: '#6b6560' }}>
          {alerts.length} alerts tracked · {important.length} require action
        </p>
      </div>
    </div>
  )
}
