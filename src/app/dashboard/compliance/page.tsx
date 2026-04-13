'use client'

import { useState, useEffect } from 'react'
import { SkeletonBlock, SkeletonTable, StatsSkeleton } from '@/components/Skeleton'
import ComplianceAlertCard from '@/components/ComplianceAlertCard'
import RegulatoryLetterModal from '@/components/RegulatoryLetterModal'
import { getAllAlerts, loadAlertStatuses, saveAlertStatus } from '@/lib/regulatoryAlerts'
import { loadFirmSettings } from '@/lib/firmSettings'
import type { RegulatoryAlert, ClientAlertStatus } from '@/types/compliance'
import type { Client } from '@/types'

function getClientsFromStorage(): Client[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('cb_clients')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

type FilterSeverity = 'all' | 'critical' | 'important' | 'informational'
type FilterSource = 'all' | 'IRS' | 'DOL' | 'State' | 'Industry' | 'SEC' | 'CFPB'

export default function CompliancePage() {
  const [alerts] = useState<RegulatoryAlert[]>(getAllAlerts())
  const [statuses, setStatuses] = useState<ClientAlertStatus[]>([])
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'reviewed' | 'notified'>('all')
  const [letterModal, setLetterModal] = useState<{ alert: RegulatoryAlert; clientName: string } | null>(null)
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [firmName, setFirmName] = useState('CloseBooks')
  const [clients, setClients] = useState<Client[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setStatuses(loadAlertStatuses())
    setClients(getClientsFromStorage())
    const settings = loadFirmSettings()
    if (settings?.firm_name) setFirmName(settings.firm_name)
    setMounted(true)
  }, [])

  function refreshStatuses() {
    setStatuses(loadAlertStatuses())
  }

  function handleMarkReviewed(alertId: string) {
    const status: ClientAlertStatus = {
      alertId,
      clientName: '__global__',
      status: 'reviewed',
    }
    saveAlertStatus(status)
    refreshStatuses()
  }

  function handleDismiss(alertId: string) {
    const status: ClientAlertStatus = {
      alertId,
      clientName: '__global__',
      status: 'dismissed',
      dismissedAt: new Date().toISOString(),
    }
    saveAlertStatus(status)
    refreshStatuses()
  }

  function getGlobalStatus(alertId: string): ClientAlertStatus | null {
    return statuses.find(s => s.alertId === alertId && s.clientName === '__global__') ?? null
  }

  const filtered = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false
    if (filterSource !== 'all' && a.source !== filterSource) return false
    if (filterStatus !== 'all') {
      const s = getGlobalStatus(a.id)?.status ?? 'new'
      if (filterStatus === 'new' && s !== 'new') return false
      if (filterStatus === 'reviewed' && s !== 'reviewed') return false
      if (filterStatus === 'notified' && s !== 'client-notified') return false
    }
    return true
  })

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const importantCount = alerts.filter(a => a.severity === 'important').length
  const newCount = alerts.filter(a => (getGlobalStatus(a.id)?.status ?? 'new') === 'new').length
  const reviewedCount = alerts.filter(a => (getGlobalStatus(a.id)?.status ?? 'new') !== 'new').length

  const selectedAlert = selectedAlertId ? alerts.find(a => a.id === selectedAlertId) : null

  if (!mounted) return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SkeletonBlock height={32} width={220} style={{ marginBottom: 8 }} />
      <SkeletonBlock height={16} width={320} style={{ marginBottom: 32 }} />
      <StatsSkeleton count={3} />
      <SkeletonTable rows={7} cols={5} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col page-content" style={{ backgroundColor: '#faf8f4' }}>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', color: '#1a1714' }}>
                Regulatory Compliance Monitor
              </h1>
              <p className="mt-1 text-sm" style={{ color: '#6b6560' }}>
                Stay ahead of IRS, DOL, and state regulations. Draft client advisory letters in one click.
              </p>
              <a
                href="/dashboard/compliance/tasks"
                className="inline-block mt-2 text-xs font-semibold"
                style={{ color: '#2d5a27' }}
              >
                Compliance task checklist →
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {criticalCount} Critical Alerts
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Alerts', value: alerts.length, color: '#1a1714' },
            { label: 'Critical', value: criticalCount, color: '#dc2626' },
            { label: 'Need Review', value: newCount, color: '#d97706' },
            { label: 'Reviewed', value: reviewedCount, color: '#2d5a27' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border p-3" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
              <p className="text-xs" style={{ color: '#6b6560' }}>{stat.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Left: Alert list */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value as FilterSeverity)}
                className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#ffffff' }}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="important">Important</option>
                <option value="informational">Informational</option>
              </select>
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value as FilterSource)}
                className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#ffffff' }}
              >
                <option value="all">All Sources</option>
                <option value="IRS">IRS</option>
                <option value="DOL">DOL</option>
                <option value="State">State</option>
                <option value="Industry">Industry</option>
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as 'all' | 'new' | 'reviewed' | 'notified')}
                className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ borderColor: '#e0dbd4', color: '#1a1714', backgroundColor: '#ffffff' }}
              >
                <option value="all">All Status</option>
                <option value="new">Needs Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="notified">Client Notified</option>
              </select>
              <span className="text-xs ml-1" style={{ color: '#6b6560' }}>{filtered.length} alerts</span>
            </div>

            {/* Alert cards */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#6b6560' }}>
                  <p className="text-lg font-medium">No alerts match your filters</p>
                  <button onClick={() => { setFilterSeverity('all'); setFilterSource('all'); setFilterStatus('all') }} className="mt-2 text-sm" style={{ color: '#2d5a27' }}>
                    Clear filters
                  </button>
                </div>
              ) : (
                filtered.map(alert => (
                  <div
                    key={alert.id}
                    className={`cursor-pointer transition-all ${selectedAlertId === alert.id ? 'ring-2' : ''}`}
                    style={{ borderRadius: 12, outlineColor: '#2d5a27' }}
                    onClick={() => setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id)}
                  >
                    <ComplianceAlertCard
                      alert={alert}
                      status={getGlobalStatus(alert.id)}
                      onMarkReviewed={() => handleMarkReviewed(alert.id)}
                      onGenerateLetter={() => setLetterModal({ alert, clientName: clients[0]?.business_name ?? 'Your Client' })}
                      onDismiss={() => handleDismiss(alert.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          {selectedAlert && (
            <div className="w-72 shrink-0 hidden lg:block">
              <div className="sticky top-4 rounded-xl border p-4" style={{ backgroundColor: '#ffffff', borderColor: '#e8e0d4' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1714' }}>Affected Clients</h3>
                {clients.length === 0 ? (
                  <p className="text-xs" style={{ color: '#6b6560' }}>No clients added yet</p>
                ) : (
                  <div className="space-y-2">
                    {clients
                      .filter(c => selectedAlert.affectedIndustries.length === 0 || selectedAlert.affectedIndustries.includes(c.industry))
                      .map(client => (
                        <div key={client.id} className="flex items-center justify-between">
                          <span className="text-xs font-medium" style={{ color: '#1a1714' }}>{client.business_name}</span>
                          <button
                            onClick={() => setLetterModal({ alert: selectedAlert, clientName: client.business_name })}
                            className="text-xs px-2 py-0.5 rounded font-medium transition-colors"
                            style={{ color: '#2d5a27', backgroundColor: '#e8f0e6' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d0e4cc' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8f0e6' }}
                          >
                            Draft letter
                          </button>
                        </div>
                      ))}
                    {clients.filter(c => selectedAlert.affectedIndustries.length === 0 || selectedAlert.affectedIndustries.includes(c.industry)).length === 0 && (
                      <p className="text-xs" style={{ color: '#6b6560' }}>No clients match this alert's industry criteria</p>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f0ebe3' }}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1a1714' }}>Full Summary</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b6560' }}>{selectedAlert.fullText}</p>
                </div>

                {selectedAlert.url && (
                  <a
                    href={selectedAlert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#b8734a' }}
                  >
                    Official Source →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>


      {letterModal && (
        <RegulatoryLetterModal
          alert={letterModal.alert}
          clientName={letterModal.clientName}
          firmName={firmName}
          onClose={() => setLetterModal(null)}
          onSent={() => {
            const status: ClientAlertStatus = {
              alertId: letterModal.alert.id,
              clientName: letterModal.clientName,
              status: 'client-notified',
              notifiedAt: new Date().toISOString(),
            }
            saveAlertStatus(status)
            refreshStatuses()
            setLetterModal(null)
          }}
        />
      )}
    </div>
  )
}
