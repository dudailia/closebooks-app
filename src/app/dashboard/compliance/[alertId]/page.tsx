'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import RegulatoryLetterModal from '@/components/RegulatoryLetterModal'
import { getAlertById, loadAlertStatuses, saveAlertStatus } from '@/lib/regulatoryAlerts'
import { loadFirmSettings } from '@/lib/firmSettings'
import { getClients } from '@/lib/storage'
import type { ClientAlertStatus } from '@/types/compliance'
import type { Client } from '@/types'

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  critical:      { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  important:     { bg: '#fffbeb', border: '#fed7aa', text: '#92400e' },
  informational: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
}

export default function AlertDetailPage({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = use(params)
  const router = useRouter()
  const alert = getAlertById(alertId)

  const [clients, setClients] = useState<Client[]>([])
  const [statuses, setStatuses] = useState<ClientAlertStatus[]>([])
  const [firmName, setFirmName] = useState('CloseBooks')
  const [letterModal, setLetterModal] = useState<string | null>(null) // clientName

  useEffect(() => {
    setClients(getClients())
    setStatuses(loadAlertStatuses())
    const settings = loadFirmSettings()
    if (settings?.firmName) setFirmName(settings.firmName)
  }, [])

  if (!alert) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>
        <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-12 text-center">
          <p className="text-lg" style={{ color: '#6b6560' }}>Alert not found.</p>
          <button onClick={() => router.push('/dashboard/compliance')} className="mt-4 text-sm" style={{ color: '#2d5a27' }}>
            ← Back to Compliance
          </button>
        </main>
      </div>
    )
  }

  const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.informational

  function getStatusForClient(clientName: string): ClientAlertStatus | null {
    return statuses.find(s => s.alertId === alert!.id && s.clientName === clientName) ?? null
  }

  function handleNotifySent(clientName: string) {
    const status: ClientAlertStatus = {
      alertId: alert!.id,
      clientName,
      status: 'client-notified',
      notifiedAt: new Date().toISOString(),
    }
    saveAlertStatus(status)
    setStatuses(loadAlertStatuses())
    setLetterModal(null)
  }

  const affectedClients = clients.filter(c =>
    alert.affectedIndustries.length === 0 || alert.affectedIndustries.includes(c.industry)
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard/compliance')}
          className="flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{ color: '#6b6560' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1a1714' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6b6560' }}
        >
          ← Back to Compliance Monitor
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Alert header */}
            <div className="rounded-xl border p-5" style={{ backgroundColor: sev.bg, borderColor: sev.border }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded text-white" style={{ backgroundColor: sev.text }}>
                  {alert.severity.toUpperCase()}
                </span>
                <span className="text-xs font-medium" style={{ color: sev.text }}>{alert.source}</span>
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                  Published {new Date(alert.publishedDate).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: '#1a1714', fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
                {alert.title}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{alert.summary}</p>
            </div>

            {/* Full text */}
            <div className="rounded-xl border p-5" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#1a1714' }}>Full Details</h2>
              <p className="text-sm leading-relaxed" style={{ color: '#6b6560' }}>{alert.fullText}</p>
            </div>

            {/* Action required */}
            <div className="rounded-xl border p-5" style={{ backgroundColor: '#e8f0e6', borderColor: '#c3d9bb' }}>
              <h2 className="text-sm font-semibold mb-1" style={{ color: '#2d5a27' }}>Action Required</h2>
              <p className="text-sm" style={{ color: '#1a1714' }}>{alert.actionRequired}</p>
              <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: '#2d5a27' }}>
                <span>Effective: {new Date(alert.effectiveDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Tags */}
            {alert.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {alert.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f0ea', color: '#6b6560' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {alert.url && (
              <a href={alert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#b8734a' }}>
                View Official Source →
              </a>
            )}
          </div>

          {/* Sidebar: client actions */}
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1714' }}>
                Affected Clients ({affectedClients.length})
              </h3>
              {affectedClients.length === 0 ? (
                <p className="text-xs" style={{ color: '#6b6560' }}>No clients match this alert. Add clients to see recommendations.</p>
              ) : (
                <div className="space-y-2.5">
                  {affectedClients.map(client => {
                    const status = getStatusForClient(client.business_name)
                    const isNotified = status?.status === 'client-notified'
                    return (
                      <div key={client.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: '#1a1714' }}>{client.business_name}</span>
                          {isNotified && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Notified</span>
                          )}
                        </div>
                        {!isNotified && (
                          <button
                            onClick={() => setLetterModal(client.business_name)}
                            className="w-full px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                            style={{ backgroundColor: '#2d5a27' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3d1a' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2d5a27' }}
                          >
                            Draft Advisory Letter
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {alert.affectedIndustries.length > 0 && (
              <div className="rounded-xl border p-4" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#1a1714' }}>Affected Industries</h3>
                <div className="flex flex-wrap gap-1">
                  {alert.affectedIndustries.map(ind => (
                    <span key={ind} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fdf2e9', color: '#b8734a' }}>
                      {ind}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>


      {letterModal && (
        <RegulatoryLetterModal
          alert={alert}
          clientName={letterModal}
          firmName={firmName}
          onClose={() => setLetterModal(null)}
          onSent={() => handleNotifySent(letterModal)}
        />
      )}
    </div>
  )
}
