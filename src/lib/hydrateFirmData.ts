/**
 * Load firm-scoped data from Supabase into memory after login.
 */

import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { getFirmIdForUser } from '@/lib/supabase/firmScope'
import type { CategorizationJob, Client, Transaction } from '@/types'
import { memorySetJobs, memorySetClients, setMemoryHydrated } from '@/lib/memoryData'
import { mapJobFromRows } from '@/lib/hydrateMappers'
import { hydrateFirmSettings } from '@/lib/firmSettings'
import { hydrateFirmUsage } from '@/lib/freeTrial'
import { hydrateBilling } from '@/lib/billingStorage'
import { hydrateDeadlines } from '@/lib/calendarStore'

function mapTx(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    date: String(row.date ?? ''),
    description: String(row.description ?? ''),
    amount: Number(row.amount ?? 0),
    type: (row.type as Transaction['type']) ?? 'debit',
    original_description: String(row.original_description ?? row.description ?? ''),
    suggested_category: String(row.suggested_category ?? ''),
    suggested_account_code: String(row.suggested_account_code ?? ''),
    confidence: Number(row.confidence ?? 0),
    status: (row.status as Transaction['status']) ?? 'pending',
    final_category: row.final_category ? String(row.final_category) : undefined,
    final_account_code: row.final_account_code ? String(row.final_account_code) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  }
}

export async function hydrateFirmData(): Promise<void> {
  if (!supabaseConfigured) {
    setMemoryHydrated(true)
    return
  }

  const supabase = createClient()
  if (!supabase) {
    setMemoryHydrated(true)
    return
  }

  const firmId = await getFirmIdForUser()
  if (!firmId) {
    memorySetJobs([])
    memorySetClients([])
    setMemoryHydrated(true)
    return
  }

  const [jobsRes, clientsRes] = await Promise.all([
    supabase.from('jobs').select('*').eq('firm_id', firmId).order('created_at', { ascending: false }),
    supabase.from('clients').select('*').eq('firm_id', firmId).order('created_at', { ascending: false }),
  ])

  const jobRows = jobsRes.data ?? []
  const txByJob = new Map<string, Transaction[]>()
  if (jobRows.length > 0) {
    const ids = jobRows.map((j) => j.id as string)
    const { data: txRows } = await supabase
      .from('transactions')
      .select('*')
      .in('job_id', ids)
      .order('date', { ascending: true })
    for (const t of txRows ?? []) {
      const jid = String(t.job_id)
      const list = txByJob.get(jid) ?? []
      list.push(mapTx(t as Record<string, unknown>))
      txByJob.set(jid, list)
    }
  }

  const jobs: CategorizationJob[] = jobRows.map((row) =>
    mapJobFromRows(row as Record<string, unknown>, txByJob.get(String(row.id)) ?? [])
  )
  memorySetJobs(jobs)
  memorySetClients((clientsRes.data ?? []) as Client[])

  await Promise.all([
    hydrateFirmSettings(supabase, firmId),
    hydrateFirmUsage(supabase, firmId),
    hydrateBilling(supabase, firmId),
    hydrateDeadlines(supabase, firmId),
  ])

  const { hydrateClientMessages } = await import('@/lib/clientMessages')
  const { hydrateNotifications } = await import('@/lib/notifications')
  const { hydrateComplianceTasks } = await import('@/lib/complianceTasks')
  const { hydrateDocumentRequests } = await import('@/lib/documentRequests')
  const { hydratePipeline } = await import('@/lib/engagementPipeline')
  const { hydrateVault } = await import('@/lib/vaultStorage')
  const { hydrateActivity } = await import('@/lib/activity')
  const { hydrateAuditTrails } = await import('@/lib/auditTrail')
  const { hydrateRegulatoryStatuses } = await import('@/lib/regulatoryAlerts')
  const { hydrateCorrections } = await import('@/lib/corrections')
  const { hydrateAdvisory } = await import('@/lib/advisoryStorage')
  const { hydrateCopilot } = await import('@/lib/copilotStorage')
  const { hydrateIntegrations } = await import('@/lib/integrations')
  const { hydrateNetworkPrefs } = await import('@/lib/benchmarkNetwork')
  const { hydratePortalTokens } = await import('@/lib/portalTokensStore')
  const { hydrateTaxDrafts } = await import('@/lib/taxDraftsStore')
  const { hydrateAuditDefense } = await import('@/lib/auditDefenseStore')
  const { hydrateTeam } = await import('@/lib/teamStore')
  const { hydrateReferrals } = await import('@/lib/referralStore')
  const { hydrateAutopilot } = await import('@/lib/autopilotStore')
  const { hydrateAgent } = await import('@/lib/agentPrefsStore')
  const { hydrateDeveloper } = await import('@/lib/developerStore')
  const { hydrateInsights } = await import('@/lib/insightsCache')
  const { hydrateTimeSessions } = await import('@/lib/timeTracking')
  const { hydrateFirmUiPrefs } = await import('@/lib/firmUiPrefs')

  await Promise.all([
    hydrateClientMessages(supabase, firmId),
    hydrateNotifications(supabase, firmId),
    hydrateComplianceTasks(supabase, firmId),
    hydrateDocumentRequests(supabase, firmId),
    hydratePipeline(supabase, firmId),
    hydrateVault(supabase, firmId),
    hydrateActivity(supabase, firmId),
    hydrateAuditTrails(supabase, firmId),
    hydrateRegulatoryStatuses(supabase, firmId),
    hydrateCorrections(supabase, firmId),
    hydrateAdvisory(supabase, firmId),
    hydrateCopilot(supabase, firmId),
    hydrateIntegrations(supabase, firmId),
    hydrateNetworkPrefs(supabase, firmId),
    hydratePortalTokens(supabase, firmId),
    hydrateTaxDrafts(supabase, firmId),
    hydrateAuditDefense(supabase, firmId),
    hydrateTeam(supabase, firmId),
    hydrateReferrals(supabase, firmId),
    hydrateAutopilot(supabase, firmId),
    hydrateAgent(supabase, firmId),
    hydrateDeveloper(supabase, firmId),
    hydrateInsights(supabase, firmId),
    hydrateTimeSessions(supabase, firmId),
    hydrateFirmUiPrefs(supabase, firmId),
  ])

  setMemoryHydrated(true)
}
