import type { RegulatoryAlert, ClientAlertStatus } from '@/types/compliance'
import { REGULATORY_ALERTS } from '@/lib/regulatoryDatabase'
import type { Client } from '@/types'

const STORAGE_KEY = 'cb_compliance_statuses'

// ─── Storage ────────────────────────────────────────────────────────────────

export function loadAlertStatuses(): ClientAlertStatus[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveAlertStatus(status: ClientAlertStatus): void {
  const all = loadAlertStatuses()
  const idx = all.findIndex(s => s.alertId === status.alertId && s.clientName === status.clientName)
  if (idx >= 0) all[idx] = status
  else all.push(status)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getAlertStatus(alertId: string, clientName: string): ClientAlertStatus | null {
  return loadAlertStatuses().find(s => s.alertId === alertId && s.clientName === clientName) ?? null
}

// ─── Matching ────────────────────────────────────────────────────────────────

export function getAlertsForClient(client: Client): RegulatoryAlert[] {
  return REGULATORY_ALERTS.filter(alert => {
    // Industry filter
    if (alert.affectedIndustries.length > 0 && !alert.affectedIndustries.includes(client.industry)) return false
    return true
  })
}

export function getAllAlerts(): RegulatoryAlert[] {
  return REGULATORY_ALERTS
}

export function getAlertById(id: string): RegulatoryAlert | null {
  return REGULATORY_ALERTS.find(a => a.id === id) ?? null
}

export function countCriticalAlerts(): number {
  return REGULATORY_ALERTS.filter(a => a.severity === 'critical').length
}

export function getUnreviewedCount(clients: Client[]): number {
  const statuses = loadAlertStatuses()
  let unreviewedCount = 0
  for (const alert of REGULATORY_ALERTS) {
    for (const client of clients) {
      if (alert.affectedIndustries.length > 0 && !alert.affectedIndustries.includes(client.industry)) continue
      const status = statuses.find(s => s.alertId === alert.id && s.clientName === client.business_name)
      if (!status || status.status === 'new') unreviewedCount++
    }
  }
  return unreviewedCount
}
