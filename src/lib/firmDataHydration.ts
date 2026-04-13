/**
 * One-time import of legacy localStorage keys into Supabase (see legacyLocalStorage.ts).
 */

import { createClient, supabaseConfigured } from '@/lib/supabase/client'
import { getFirmIdForUser } from '@/lib/supabase/firmScope'
import { LEGACY_KEYS, readLegacyJson, readLegacyString } from './legacyLocalStorage'

export async function importLegacyLocalStorageToSupabase(): Promise<{ imported: string[]; errors: string[] }> {
  const imported: string[] = []
  const errors: string[] = []

  if (!supabaseConfigured) {
    errors.push('Supabase not configured')
    return { imported, errors }
  }

  const supabase = createClient()
  if (!supabase) {
    errors.push('No Supabase client')
    return { imported, errors }
  }

  const firmId = await getFirmIdForUser()
  if (!firmId) {
    errors.push('No firm — sign in and ensure firms row exists')
    return { imported, errors }
  }

  // Jobs + clients: handled by dedicated flows; still push raw if present
  try {
    const jobs = readLegacyJson<unknown[]>(LEGACY_KEYS.jobs, [])
    if (jobs.length > 0) {
      for (const j of jobs) {
        const job = j as Record<string, unknown>
        const { transactions, chart_of_accounts, ...meta } = job
        await supabase.from('jobs').upsert({
          id: String(meta.id),
          firm_id: firmId,
          client_name: String(meta.client_name ?? ''),
          created_at: String(meta.created_at ?? new Date().toISOString()),
          status: String(meta.status ?? 'review'),
          total_transactions: Number(meta.total_transactions ?? 0),
          auto_categorized: Number(meta.auto_categorized ?? 0),
          approved: Number(meta.approved ?? 0),
          flagged: Number(meta.flagged ?? 0),
          chart_of_accounts: chart_of_accounts ?? [],
        }, { onConflict: 'id' })
        const txs = (transactions ?? []) as Record<string, unknown>[]
        if (txs.length > 0) {
          const rows = txs.map((t) => ({
            id: String(t.id),
            job_id: String(meta.id),
            date: String(t.date ?? ''),
            description: String(t.description ?? ''),
            amount: Number(t.amount ?? 0),
            type: String(t.type ?? 'debit'),
            original_description: String(t.original_description ?? t.description ?? ''),
            suggested_category: String(t.suggested_category ?? ''),
            suggested_account_code: String(t.suggested_account_code ?? ''),
            confidence: Number(t.confidence ?? 0),
            status: String(t.status ?? 'pending'),
            final_category: t.final_category ?? null,
            final_account_code: t.final_account_code ?? null,
            notes: t.notes ?? null,
          }))
          for (let i = 0; i < rows.length; i += 200) {
            await supabase.from('transactions').upsert(rows.slice(i, i + 200), { onConflict: 'id' })
          }
        }
      }
      imported.push('jobs')
    }
  } catch (e) {
    errors.push(`jobs: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const clients = readLegacyJson<unknown[]>(LEGACY_KEYS.clients, [])
    for (const c of clients) {
      const cl = c as Record<string, unknown>
      await supabase.from('clients').upsert({
        id: String(cl.id),
        firm_id: firmId,
        business_name: String(cl.business_name ?? ''),
        industry: cl.industry ?? 'Other',
        contact_email: String(cl.contact_email ?? ''),
        accounting_software: cl.accounting_software ?? 'Other',
        created_at: String(cl.created_at ?? new Date().toISOString()),
        notes: cl.notes ?? null,
      }, { onConflict: 'id' })
    }
    if (clients.length > 0) imported.push('clients')
  } catch (e) {
    errors.push(`clients: ${e instanceof Error ? e.message : String(e)}`)
  }

  const firmSettings = readLegacyJson(LEGACY_KEYS.firmSettings, null)
  if (firmSettings) {
    await supabase.from('firm_settings').upsert(
      { firm_id: firmId, payload: firmSettings as object },
      { onConflict: 'firm_id' }
    )
    imported.push('firm_settings')
  }

  const firmUsage = readLegacyJson(LEGACY_KEYS.freeTrial, null)
  if (firmUsage) {
    const u = firmUsage as Record<string, unknown>
    await supabase.from('firm_usage').upsert({
      firm_id: firmId,
      closes_used: Number(u.closesUsed ?? 0),
      trial_started_at: u.startedAt ? String(u.startedAt) : null,
      plan_status: String(u.plan ?? 'free'),
      trial_activated_at: u.trialActivatedAt ? String(u.trialActivatedAt) : null,
    }, { onConflict: 'firm_id' })
    imported.push('firm_usage')
  }

  // JSON blob tables
  const blobUpserts: Array<{ table: string; key: keyof typeof LEGACY_KEYS; name: string }> = [
    { table: 'invoices', key: 'invoices', name: 'invoices' },
    { table: 'engagement_letters', key: 'letters', name: 'engagement_letters' },
    { table: 'document_requests', key: 'docRequests', name: 'document_requests' },
    { table: 'pipeline_entries', key: 'pipeline', name: 'pipeline_entries' },
    { table: 'vault_documents', key: 'vaultDocs', name: 'vault_documents' },
    { table: 'vault_document_requests', key: 'vaultReqs', name: 'vault_document_requests' },
    { table: 'advisory_memos', key: 'advisory', name: 'advisory_memos' },
    { table: 'tax_return_drafts', key: 'taxReturns', name: 'tax_return_drafts' },
    { table: 'audit_defense_audits', key: 'auditDefense', name: 'audit_defense_audits' },
    { table: 'team_members', key: 'team', name: 'team_members' },
    { table: 'insights_cache', key: 'insights', name: 'insights_cache' },
    { table: 'benchmark_contributions', key: 'benchmark', name: 'benchmark_contributions' },
  ]

  for (const { table, key, name } of blobUpserts) {
    try {
      const arr = readLegacyJson<unknown[]>(LEGACY_KEYS[key], [])
      if (!Array.isArray(arr) || arr.length === 0) continue
      if (table === 'rate_cards') continue
      for (const row of arr) {
        const r = row as Record<string, unknown>
        const id = String(r.id ?? crypto.randomUUID())
        await supabase.from(table as 'invoices').upsert({
          id,
          firm_id: firmId,
          payload: r,
        }, { onConflict: 'id' })
      }
      imported.push(name)
    } catch (e) {
      errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const rateCard = readLegacyJson(LEGACY_KEYS.rateCard, null)
  if (rateCard) {
    await supabase.from('rate_cards').upsert(
      { firm_id: firmId, payload: rateCard as object },
      { onConflict: 'firm_id' }
    )
    imported.push('rate_cards')
  }

  const refStats = readLegacyJson(LEGACY_KEYS.referrals, null)
  if (refStats) {
    await supabase.from('referral_stats').upsert(
      { firm_id: firmId, payload: refStats as object },
      { onConflict: 'firm_id' }
    )
    imported.push('referral_stats')
  }

  const rc = readLegacyJson(LEGACY_KEYS.regulatoryStatuses, [])
  if (Array.isArray(rc) && rc.length > 0) {
    for (const s of rc) {
      const row = s as Record<string, unknown>
      await supabase.from('regulatory_alert_statuses').upsert({
        firm_id: firmId,
        alert_id: String(row.alertId ?? ''),
        client_name: String(row.clientName ?? '__global__'),
        payload: row,
      }, { onConflict: 'firm_id,alert_id,client_name' })
    }
    imported.push('regulatory_alert_statuses')
  }

  const copilotCfg = readLegacyJson(LEGACY_KEYS.copilotConfig, null)
  if (copilotCfg) {
    await supabase.from('copilot_config').upsert(
      { firm_id: firmId, payload: copilotCfg as object },
      { onConflict: 'firm_id' }
    )
    imported.push('copilot_config')
  }

  const copilotRuns = readLegacyJson(LEGACY_KEYS.copilotRuns, [])
  if (Array.isArray(copilotRuns) && copilotRuns.length > 0) {
    for (const r of copilotRuns) {
      const row = r as Record<string, unknown>
      await supabase.from('copilot_runs').upsert({
        id: String(row.id),
        firm_id: firmId,
        payload: row,
      }, { onConflict: 'id' })
    }
    imported.push('copilot_runs')
  }

  const qbo = readLegacyJson(LEGACY_KEYS.qbo, null)
  if (qbo) {
    await supabase.from('integration_connections').upsert(
      { firm_id: firmId, qbo_demo: qbo as object },
      { onConflict: 'firm_id' }
    )
    imported.push('integration_connections')
  }

  const optIn = readLegacyString(LEGACY_KEYS.networkOptIn, '')
  if (optIn === 'true' || optIn === 'false') {
    await supabase.from('network_preferences').upsert(
      { firm_id: firmId, benchmark_opt_in: optIn === 'true' },
      { onConflict: 'firm_id' }
    )
    imported.push('network_preferences')
  }

  const ap = readLegacyJson(LEGACY_KEYS.autopilotPrefs, null)
  if (ap) {
    await supabase.from('autopilot_preferences').upsert(
      { firm_id: firmId, payload: ap as object },
      { onConflict: 'firm_id' }
    )
    imported.push('autopilot_preferences')
  }

  const agentPrefs = readLegacyJson(LEGACY_KEYS.agentPrefs, null)
  if (agentPrefs) {
    await supabase.from('agent_preferences').upsert(
      { firm_id: firmId, payload: agentPrefs as object },
      { onConflict: 'firm_id' }
    )
    imported.push('agent_preferences')
  }

  const dev = readLegacyJson<{ apiKey?: string; webhook?: string }>(LEGACY_KEYS.devSettings, {})
  if (dev && (dev.apiKey || dev.webhook)) {
    await supabase.from('developer_settings').upsert({
      firm_id: firmId,
      api_key: dev.apiKey ?? null,
      webhook_url: dev.webhook ?? null,
    }, { onConflict: 'firm_id' })
    imported.push('developer_settings')
  }

  const hourly = readLegacyString(LEGACY_KEYS.hourlyRate, '')
  if (hourly && !Number.isNaN(Number(hourly))) {
    await supabase.from('firm_ui_preferences').upsert(
      { firm_id: firmId, hourly_rate: Number(hourly) },
      { onConflict: 'firm_id' }
    )
    imported.push('firm_ui_preferences')
  }

  const portalTok = readLegacyJson<Record<string, string>>(LEGACY_KEYS.portalTokens, {})
  if (Object.keys(portalTok).length > 0) {
    for (const [k, token] of Object.entries(portalTok)) {
      await supabase.from('portal_client_tokens').upsert({
        firm_id: firmId,
        client_name_key: k,
        token,
      }, { onConflict: 'firm_id,client_name_key' })
    }
    imported.push('portal_client_tokens')
  }

  return { imported, errors }
}
