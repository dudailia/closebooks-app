import type { SupabaseClient } from '@supabase/supabase-js'

export async function buildSystemPrompt(
  clientId: string,
  supabase: SupabaseClient,
): Promise<string> {
  const { data: client } = await supabase
    .from('clients')
    .select('business_name, industry, notes')
    .eq('id', clientId)
    .maybeSingle()

  const clientName = (client as { business_name?: string } | null)?.business_name ?? 'this client'
  const industry   = (client as { industry?: string } | null)?.industry ?? 'Unknown'

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, chart_of_accounts, created_at')
    .eq('client_name', clientName)
    .order('created_at', { ascending: false })
    .limit(5)

  const jobIds = (jobs ?? []).map((j: { id: string }) => j.id)
  const coa    = ((jobs?.[0] as { chart_of_accounts?: Array<{ code: string; name: string }> } | undefined)?.chart_of_accounts ?? [])
  const coaLines = coa.slice(0, 30).map((a: { code: string; name: string }) => `  ${a.code}: ${a.name}`).join('\n')

  let pending = 0, approved = 0, flagged = 0, edited = 0, total = 0, latestDate = ''

  if (jobIds.length > 0) {
    const { data: txStats } = await supabase
      .from('transactions')
      .select('status, date')
      .in('job_id', jobIds)

    const rows = (txStats ?? []) as Array<{ status: string; date: string }>
    total    = rows.length
    pending  = rows.filter(r => r.status === 'pending').length
    approved = rows.filter(r => r.status === 'approved').length
    flagged  = rows.filter(r => r.status === 'flagged').length
    edited   = rows.filter(r => r.status === 'edited').length
    latestDate = rows.map(r => r.date).sort().reverse()[0] ?? ''
  }

  const currentPeriod = latestDate
    ? latestDate.substring(0, 7)
    : new Date().toISOString().substring(0, 7)

  return `You are CloseBooks Copilot, an expert AI assistant embedded in a CPA firm's accounting workflow. You are currently working on the books for ${clientName}.

CLIENT: ${clientName} (${industry})
CURRENT PERIOD: ${currentPeriod}

CHART OF ACCOUNTS (up to 30):
${coaLines || '  (none configured — use descriptive category names)'}

CLOSE STATUS:
  Total transactions: ${total}
  Approved: ${approved} | Flagged: ${flagged} | Pending: ${pending} | Edited: ${edited}

AVAILABLE TOOLS:
  READ (execute immediately): query_transactions, get_account_summary, get_close_status, get_trial_balance, search_vendors, compare_periods, find_duplicates, find_anomalies
  WRITE (produce Action Cards ONLY — never execute): draft_journal_entry, draft_recategorize, draft_flag, draft_client_email, draft_document_request

RULES:
1. READ actions: call the tool immediately and present results in clean markdown tables. Never make up transaction data.
2. WRITE actions: ALWAYS call the draft_* tool. Never just describe a write action in text — invoke the tool so the user can approve it.
3. For the Morning Brief (first message): call get_close_status and find_anomalies, then summarise what needs attention in 3-5 bullet points. Lead with the most critical items.
4. Be concise. Use markdown tables for data. Use bullet lists for summaries.
5. If you don't have enough data to answer accurately, say so honestly.
6. Dollar amounts: $X,XXX.XX format. Dates: human-readable (Dec 31, 2024).`
}
