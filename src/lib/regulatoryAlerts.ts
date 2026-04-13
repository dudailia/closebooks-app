import type { SupabaseClient } from '@supabase/supabase-js'
import { REGULATORY_ALERTS } from './regulatoryDatabase'
import type { RegulatoryAlert, ClientAlertStatus } from '@/types/compliance'
import type { ClientIndustry } from '@/types'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

// ─────────────────────────────────────────────────────────────────────────────
// Alert matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Match alerts to a specific client based on industry, state, employee count,
 * and annual revenue. Returns alerts sorted: critical first, then important,
 * then informational.
 */
export function getAlertsForClient(
  client: { business_name: string; industry: ClientIndustry },
  options?: { state?: string; employeeCount?: number; annualRevenue?: number }
): RegulatoryAlert[] {
  const { state, employeeCount, annualRevenue } = options ?? {}

  const matched = REGULATORY_ALERTS.filter((alert) => {
    // Industry filter: empty = all industries
    if (alert.affectedIndustries.length > 0) {
      if (!alert.affectedIndustries.includes(client.industry)) return false
    }

    // State filter: empty = federal/nationwide
    if (alert.affectedStates.length > 0) {
      if (!state || !alert.affectedStates.includes(state)) return false
    }

    // Employee minimum filter
    if (alert.employeeMin !== undefined && alert.employeeMin > 0) {
      if (!employeeCount || employeeCount < alert.employeeMin) return false
    }

    // Revenue minimum filter
    if (alert.revenueMin !== undefined && alert.revenueMin > 0) {
      if (!annualRevenue || annualRevenue < alert.revenueMin) return false
    }

    return true
  })

  // Sort: critical → important → informational, then by effectiveDate desc
  const severityOrder: Record<string, number> = { critical: 0, important: 1, informational: 2 }
  return matched.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity]
    if (sev !== 0) return sev
    return b.effectiveDate.localeCompare(a.effectiveDate)
  })
}

/**
 * Get all unique alerts affecting any client in an array, along with the list
 * of client names affected by each alert.
 */
export function getAlertsForFirm(
  clients: { business_name: string; industry: ClientIndustry }[]
): { alert: RegulatoryAlert; affectedClients: string[] }[] {
  const alertMap = new Map<string, { alert: RegulatoryAlert; affectedClients: string[] }>()

  for (const client of clients) {
    const alerts = getAlertsForClient(client)
    for (const alert of alerts) {
      if (!alertMap.has(alert.id)) {
        alertMap.set(alert.id, { alert, affectedClients: [] })
      }
      const entry = alertMap.get(alert.id)!
      if (!entry.affectedClients.includes(client.business_name)) {
        entry.affectedClients.push(client.business_name)
      }
    }
  }

  const results = Array.from(alertMap.values())
  const severityOrder: Record<string, number> = { critical: 0, important: 1, informational: 2 }
  return results.sort((a, b) => {
    const sev = severityOrder[a.alert.severity] - severityOrder[b.alert.severity]
    if (sev !== 0) return sev
    return b.alert.effectiveDate.localeCompare(a.alert.effectiveDate)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Postgres status tracking (regulatory_alert_statuses)
// ─────────────────────────────────────────────────────────────────────────────

let _statuses: ClientAlertStatus[] = []

export async function hydrateRegulatoryStatuses(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('regulatory_alert_statuses').select('payload').eq('firm_id', firmId)
  _statuses = (data ?? []).map((r) => (r as { payload: ClientAlertStatus }).payload)
}

async function saveStatuses(statuses: ClientAlertStatus[]): Promise<void> {
  _statuses = statuses
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('regulatory_alert_statuses').delete().eq('firm_id', ctx.firmId)
  for (const s of statuses) {
    await ctx.supabase.from('regulatory_alert_statuses').upsert(
      {
        firm_id: ctx.firmId,
        alert_id: s.alertId,
        client_name: s.clientName,
        payload: s as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firm_id,alert_id,client_name' }
    )
  }
}

function loadStatuses(): ClientAlertStatus[] {
  return _statuses
}

export function getAlertStatus(alertId: string, clientName: string): ClientAlertStatus | null {
  const all = loadStatuses()
  return (
    all.find(
      (s) => s.alertId === alertId && s.clientName === clientName
    ) ?? null
  )
}

export function updateAlertStatus(
  alertId: string,
  clientName: string,
  update: Partial<ClientAlertStatus>
): void {
  const all = [...loadStatuses()]
  const idx = all.findIndex((s) => s.alertId === alertId && s.clientName === clientName)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...update }
  } else {
    all.push({ alertId, clientName, status: 'new', ...update })
  }
  void saveStatuses(all)
}

/**
 * Count alerts that are unreviewed (no reviewed/client-notified status and
 * not firm-wide dismissed). Uses REGULATORY_ALERTS as source of truth.
 */
export function getUnreviewedCount(): number {
  const statuses = loadStatuses()
  let count = 0
  for (const alert of REGULATORY_ALERTS) {
    const relevant = statuses.filter((s) => s.alertId === alert.id)
    const hasReviewed = relevant.some(
      (s) => s.status === 'reviewed' || s.status === 'client-notified'
    )
    const allDismissed =
      relevant.length > 0 && relevant.every((s) => s.status === 'dismissed')
    if (!hasReviewed && !allDismissed) count++
  }
  return count
}

export function getCriticalUnreviewedCount(): number {
  const statuses = loadStatuses()
  let count = 0
  for (const alert of REGULATORY_ALERTS.filter((a) => a.severity === 'critical')) {
    const relevant = statuses.filter((s) => s.alertId === alert.id)
    const hasReviewed = relevant.some(
      (s) => s.status === 'reviewed' || s.status === 'client-notified'
    )
    const allDismissed =
      relevant.length > 0 && relevant.every((s) => s.status === 'dismissed')
    if (!hasReviewed && !allDismissed) count++
  }
  return count
}

/**
 * Dismiss an alert for all clients by storing a firm-wide sentinel entry.
 */
export function dismissAlertForAll(alertId: string): void {
  const all = [...loadStatuses()]
  const idx = all.findIndex(
    (s) => s.alertId === alertId && s.clientName === '__ALL__'
  )
  const entry: ClientAlertStatus = {
    alertId,
    clientName: '__ALL__',
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
  }
  if (idx >= 0) {
    all[idx] = entry
  } else {
    all.push(entry)
  }
  void saveStatuses(all)
}

/**
 * Check if an alert has been dismissed firm-wide.
 */
export function isAlertDismissedForAll(alertId: string): boolean {
  const all = loadStatuses()
  return all.some(
    (s) => s.alertId === alertId && s.clientName === '__ALL__' && s.status === 'dismissed'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience helpers used by page components
// ─────────────────────────────────────────────────────────────────────────────

export function getAllAlerts(): RegulatoryAlert[] {
  const severityOrder: Record<string, number> = { critical: 0, important: 1, informational: 2 }
  return [...REGULATORY_ALERTS].sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity]
    if (sev !== 0) return sev
    return b.effectiveDate.localeCompare(a.effectiveDate)
  })
}

export function getAlertById(id: string): RegulatoryAlert | null {
  return REGULATORY_ALERTS.find((a) => a.id === id) ?? null
}

export function loadAlertStatuses(): ClientAlertStatus[] {
  return loadStatuses()
}

export function saveAlertStatus(status: ClientAlertStatus): void {
  updateAlertStatus(status.alertId, status.clientName, status)
}
