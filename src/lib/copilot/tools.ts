import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import type {
  ActionCard,
  TxRow, AccountSummaryRow, TrialBalanceRow,
  VendorRow, PeriodCompareRow, DuplicateGroup, AnomalyRow,
  JournalEntryPayload, RecategorizePayload, FlagPayload,
  ClientEmailPayload, DocumentRequestPayload,
} from './types'

// ─── Tool label map ───────────────────────────────────────────────────────────

export const TOOL_LABELS: Record<string, string> = {
  query_transactions:     'Searching transactions…',
  get_account_summary:    'Summarizing accounts…',
  get_close_status:       'Checking close status…',
  get_trial_balance:      'Building trial balance…',
  search_vendors:         'Looking up vendors…',
  compare_periods:        'Comparing periods…',
  find_duplicates:        'Detecting duplicates…',
  find_anomalies:         'Scanning for anomalies…',
  draft_journal_entry:    'Drafting journal entry…',
  draft_recategorize:     'Drafting recategorization…',
  draft_flag:             'Drafting flag action…',
  draft_client_email:     'Drafting client email…',
  draft_document_request: 'Drafting document request…',
}

export const WRITE_TOOLS = new Set([
  'draft_journal_entry',
  'draft_recategorize',
  'draft_flag',
  'draft_client_email',
  'draft_document_request',
])

// ─── Anthropic tool definitions ───────────────────────────────────────────────

export const TOOL_DEFS: Tool[] = [
  {
    name: 'query_transactions',
    description: "Query the client's transactions with optional filters. Use for showing transactions, searching by vendor/description, filtering by date range or amount, or finding specific entries.",
    input_schema: {
      type: 'object' as const,
      properties: {
        dateFrom:    { type: 'string', description: 'Start date YYYY-MM-DD' },
        dateTo:      { type: 'string', description: 'End date YYYY-MM-DD' },
        minAmount:   { type: 'number', description: 'Minimum transaction amount' },
        maxAmount:   { type: 'number', description: 'Maximum transaction amount' },
        status:      { type: 'string', enum: ['pending', 'approved', 'flagged', 'edited'], description: 'Filter by status' },
        keyword:     { type: 'string', description: 'Search term matched against description (case-insensitive)' },
        accountCode: { type: 'string', description: 'Filter by account code' },
        limit:       { type: 'number', description: 'Max results (default 50, max 200)' },
      },
      required: [],
    },
  },
  {
    name: 'get_account_summary',
    description: 'Get a summary of transactions grouped by account/category for a given period.',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', description: 'Period YYYY-MM or "current"' },
      },
      required: ['period'],
    },
  },
  {
    name: 'get_close_status',
    description: 'Get current close status: total transactions and counts by status (pending/approved/flagged/edited).',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_trial_balance',
    description: 'Get the trial balance showing debits and credits by account for a given period (approved/edited transactions only).',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: { type: 'string', description: 'Period YYYY-MM or "current"' },
      },
      required: ['period'],
    },
  },
  {
    name: 'search_vendors',
    description: 'Find vendors/payees matching a search term, with transaction counts and totals.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Vendor name or partial name' },
      },
      required: ['query'],
    },
  },
  {
    name: 'compare_periods',
    description: 'Compare account totals between two months to show trends and differences.',
    input_schema: {
      type: 'object' as const,
      properties: {
        period1: { type: 'string', description: 'First period YYYY-MM (earlier)' },
        period2: { type: 'string', description: 'Second period YYYY-MM (later)' },
      },
      required: ['period1', 'period2'],
    },
  },
  {
    name: 'find_duplicates',
    description: 'Find transactions that are likely duplicates: same amount, similar vendor, within 3 days of each other.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'find_anomalies',
    description: "Find statistical outliers: transactions more than 2 standard deviations from their category's mean amount.",
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'draft_journal_entry',
    description: 'Draft a journal entry for user approval. ALWAYS use this tool for journal entry requests — never just describe one in text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        memo:  { type: 'string' },
        date:  { type: 'string', description: 'YYYY-MM-DD' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              account: { type: 'string' },
              code:    { type: 'string' },
              debit:   { type: 'number' },
              credit:  { type: 'number' },
            },
            required: ['account', 'code'],
          },
        },
      },
      required: ['memo', 'date', 'lines'],
    },
  },
  {
    name: 'draft_recategorize',
    description: 'Draft a bulk recategorization of transactions for user approval. ALWAYS use this for recategorization requests.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transactionIds: { type: 'array', items: { type: 'string' } },
        newCategory:    { type: 'string' },
        newAccountCode: { type: 'string' },
        reason:         { type: 'string' },
      },
      required: ['transactionIds', 'newCategory', 'newAccountCode', 'reason'],
    },
  },
  {
    name: 'draft_flag',
    description: 'Draft a flag action for specific transactions for user approval.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transactionIds: { type: 'array', items: { type: 'string' } },
        reason: { type: 'string' },
      },
      required: ['transactionIds', 'reason'],
    },
  },
  {
    name: 'draft_client_email',
    description: 'Draft an email to the client for user approval. Use for asking for receipts, documents, or explanations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        subject:               { type: 'string' },
        body:                  { type: 'string', description: 'Email body in plain text' },
        relatedTransactionIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['subject', 'body'],
    },
  },
  {
    name: 'draft_document_request',
    description: 'Draft a document request list for the client for user approval.',
    input_schema: {
      type: 'object' as const,
      properties: {
        items:   { type: 'array', items: { type: 'string' }, description: 'List of documents to request' },
        dueDate: { type: 'string', description: 'Due date YYYY-MM-DD or null' },
      },
      required: ['items'],
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getJobIds(supabase: SupabaseClient, clientId: string): Promise<string[]> {
  const { data: client } = await supabase
    .from('clients')
    .select('business_name')
    .eq('id', clientId)
    .maybeSingle()
  if (!client) return []

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('client_name', (client as { business_name: string }).business_name)
  return (jobs ?? []).map((j: { id: string }) => j.id)
}

// ─── READ tool executors ──────────────────────────────────────────────────────

async function execQueryTransactions(
  input: { dateFrom?: string; dateTo?: string; minAmount?: number; maxAmount?: number; status?: string; keyword?: string; accountCode?: string; limit?: number },
  clientId: string,
  supabase: SupabaseClient,
): Promise<TxRow[]> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return []

  let q = supabase
    .from('transactions')
    .select('id,date,description,amount,type,status,final_category,suggested_category,final_account_code,suggested_account_code,confidence,notes')
    .in('job_id', jobIds)
    .order('date', { ascending: false })
    .limit(Math.min(input.limit ?? 50, 200))

  if (input.dateFrom)         q = q.gte('date', input.dateFrom)
  if (input.dateTo)           q = q.lte('date', input.dateTo)
  if (input.minAmount != null) q = q.gte('amount', input.minAmount)
  if (input.maxAmount != null) q = q.lte('amount', input.maxAmount)
  if (input.status)           q = q.eq('status', input.status)
  if (input.keyword)          q = q.ilike('description', `%${input.keyword}%`)
  if (input.accountCode)      q = q.or(`final_account_code.eq.${input.accountCode},suggested_account_code.eq.${input.accountCode}`)

  const { data } = await q
  return (data ?? []) as TxRow[]
}

async function execGetAccountSummary(
  input: { period: string },
  clientId: string,
  supabase: SupabaseClient,
): Promise<AccountSummaryRow[]> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return []

  const { data } = await supabase
    .from('transactions')
    .select('date,amount,type,final_category,suggested_category,final_account_code,suggested_account_code')
    .in('job_id', jobIds)

  type Row = { date: string; amount: number; type: string; final_category: string | null; suggested_category: string | null; final_account_code: string | null; suggested_account_code: string | null }
  const txs = (data ?? []) as Row[]

  const period = input.period === 'current'
    ? (txs.map(t => t.date).sort().reverse()[0] ?? '').substring(0, 7)
    : input.period

  const filtered = txs.filter(t => t.date.startsWith(period))
  const map = new Map<string, AccountSummaryRow>()

  for (const t of filtered) {
    const account = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    const code    = t.final_account_code ?? t.suggested_account_code ?? ''
    const key     = code || account
    const existing = map.get(key) ?? { account, code, total: 0, txCount: 0 }
    existing.total   += t.type === 'debit' ? t.amount : -t.amount
    existing.txCount += 1
    map.set(key, existing)
  }

  return Array.from(map.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
}

async function execGetCloseStatus(
  clientId: string,
  supabase: SupabaseClient,
): Promise<object> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return { total: 0, pending: 0, approved: 0, flagged: 0, edited: 0 }

  const { data } = await supabase
    .from('transactions')
    .select('status')
    .in('job_id', jobIds)

  const rows = (data ?? []) as Array<{ status: string }>
  const counts = rows.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc }, {} as Record<string, number>)

  return {
    total:    rows.length,
    pending:  counts['pending']  ?? 0,
    approved: counts['approved'] ?? 0,
    flagged:  counts['flagged']  ?? 0,
    edited:   counts['edited']   ?? 0,
  }
}

async function execGetTrialBalance(
  input: { period: string },
  clientId: string,
  supabase: SupabaseClient,
): Promise<TrialBalanceRow[]> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return []

  const { data } = await supabase
    .from('transactions')
    .select('date,amount,type,final_account_code,suggested_account_code,final_category,suggested_category')
    .in('job_id', jobIds)
    .in('status', ['approved', 'edited'])

  type Row = { date: string; amount: number; type: string; final_account_code: string | null; suggested_account_code: string | null; final_category: string | null; suggested_category: string | null }
  const txs = (data ?? []) as Row[]

  const period = input.period === 'current'
    ? (txs.map(t => t.date).sort().reverse()[0] ?? '').substring(0, 7)
    : input.period

  const map = new Map<string, TrialBalanceRow>()
  for (const t of txs.filter(t => t.date.startsWith(period))) {
    const code    = t.final_account_code ?? t.suggested_account_code ?? ''
    const account = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    const key     = code || account
    const row     = map.get(key) ?? { account, code, debits: 0, credits: 0, net: 0 }
    if (t.type === 'debit')  row.debits  += t.amount
    if (t.type === 'credit') row.credits += t.amount
    row.net = row.debits - row.credits
    map.set(key, row)
  }

  return Array.from(map.values()).sort((a, b) => a.account.localeCompare(b.account))
}

async function execSearchVendors(
  input: { query: string },
  clientId: string,
  supabase: SupabaseClient,
): Promise<VendorRow[]> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return []

  const { data } = await supabase
    .from('transactions')
    .select('description,amount,date')
    .in('job_id', jobIds)
    .ilike('description', `%${input.query}%`)
    .order('date', { ascending: false })
    .limit(200)

  const txs = (data ?? []) as Array<{ description: string; amount: number; date: string }>
  const map = new Map<string, VendorRow>()

  for (const t of txs) {
    const row = map.get(t.description) ?? { vendor: t.description, txCount: 0, total: 0, lastDate: t.date }
    row.txCount += 1
    row.total   += t.amount
    if (t.date > row.lastDate) row.lastDate = t.date
    map.set(t.description, row)
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 20)
}

async function execComparePeriods(
  input: { period1: string; period2: string },
  clientId: string,
  supabase: SupabaseClient,
): Promise<PeriodCompareRow[]> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return []

  const { data } = await supabase
    .from('transactions')
    .select('date,amount,type,final_category,suggested_category,final_account_code,suggested_account_code')
    .in('job_id', jobIds)

  type Row = { date: string; amount: number; type: string; final_category: string | null; suggested_category: string | null; final_account_code: string | null; suggested_account_code: string | null }
  const txs = (data ?? []) as Row[]

  const p1map = new Map<string, number>()
  const p2map = new Map<string, number>()
  const names = new Map<string, string>()

  for (const t of txs) {
    const key    = t.final_account_code ?? t.suggested_account_code ?? (t.final_category ?? t.suggested_category ?? 'Uncategorized')
    const name   = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    const amount = t.type === 'debit' ? t.amount : -t.amount
    names.set(key, name)
    if (t.date.startsWith(input.period1)) p1map.set(key, (p1map.get(key) ?? 0) + amount)
    if (t.date.startsWith(input.period2)) p2map.set(key, (p2map.get(key) ?? 0) + amount)
  }

  const allKeys = new Set([...p1map.keys(), ...p2map.keys()])
  return Array.from(allKeys).map(key => {
    const p1 = p1map.get(key) ?? 0
    const p2 = p2map.get(key) ?? 0
    return { account: names.get(key) ?? key, period1Total: p1, period2Total: p2, delta: p2 - p1, deltaPercent: p1 !== 0 ? ((p2 - p1) / Math.abs(p1)) * 100 : 0 }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

async function execFindDuplicates(
  clientId: string,
  supabase: SupabaseClient,
): Promise<{ groups: DuplicateGroup[] }> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return { groups: [] }

  const { data } = await supabase
    .from('transactions')
    .select('id,date,description,amount,type,status,final_category,suggested_category,final_account_code,suggested_account_code,confidence,notes')
    .in('job_id', jobIds)
    .order('amount')

  const txs = (data ?? []) as TxRow[]
  const groups: DuplicateGroup[] = []
  const used = new Set<string>()

  for (let i = 0; i < txs.length; i++) {
    if (used.has(txs[i].id)) continue
    const group: TxRow[] = [txs[i]]

    for (let j = i + 1; j < txs.length; j++) {
      if (txs[j].amount !== txs[i].amount) break
      if (used.has(txs[j].id)) continue
      const dayDiff = Math.abs(new Date(txs[i].date).getTime() - new Date(txs[j].date).getTime()) / 86_400_000
      const similar = txs[i].description.toLowerCase().slice(0, 10) === txs[j].description.toLowerCase().slice(0, 10)
      if (dayDiff <= 3 && similar) { group.push(txs[j]); used.add(txs[j].id) }
    }

    if (group.length > 1) {
      used.add(txs[i].id)
      groups.push({ transactions: group, reason: `Same amount $${txs[i].amount.toFixed(2)}, similar vendor, within 3 days` })
    }
  }

  return { groups }
}

async function execFindAnomalies(
  clientId: string,
  supabase: SupabaseClient,
): Promise<{ anomalies: AnomalyRow[] }> {
  const jobIds = await getJobIds(supabase, clientId)
  if (jobIds.length === 0) return { anomalies: [] }

  const { data } = await supabase
    .from('transactions')
    .select('id,date,description,amount,type,status,final_category,suggested_category,final_account_code,suggested_account_code,confidence,notes')
    .in('job_id', jobIds)

  const txs = (data ?? []) as TxRow[]
  const byCategory = new Map<string, TxRow[]>()
  for (const t of txs) {
    const cat = t.final_category ?? t.suggested_category ?? 'Uncategorized'
    const arr = byCategory.get(cat) ?? []; arr.push(t); byCategory.set(cat, arr)
  }

  const anomalies: AnomalyRow[] = []
  for (const [category, catTxs] of byCategory) {
    if (catTxs.length < 3) continue
    const amounts = catTxs.map(t => t.amount)
    const mean   = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const stdDev = Math.sqrt(amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length)
    if (stdDev === 0) continue
    for (const t of catTxs) {
      const z = Math.abs((t.amount - mean) / stdDev)
      if (z > 2) anomalies.push({ transaction: t, category, categoryMean: mean, zScore: z, explanation: `$${t.amount.toFixed(2)} is ${z.toFixed(1)}σ from the ${category} mean of $${mean.toFixed(2)}` })
    }
  }

  return { anomalies: anomalies.sort((a, b) => b.zScore - a.zScore).slice(0, 20) }
}

// ─── WRITE tool payload validation ────────────────────────────────────────────
// `input` here is model-generated tool-call JSON, not trusted data. It used to be
// cast straight to the payload type, so a malformed tool call surfaced as a
// confusing crash deep in rendering (e.g. `p.lines.reduce` on undefined). Parse it.

const journalEntrySchema = z.object({
  memo: z.string(),
  date: z.string(),
  lines: z.array(
    z.object({
      account: z.string(),
      code: z.string(),
      debit: z.number().optional(),
      credit: z.number().optional(),
    })
  ),
})

const recategorizeSchema = z.object({
  transactionIds: z.array(z.string()),
  newCategory: z.string(),
  newAccountCode: z.string(),
  reason: z.string(),
})

const flagSchema = z.object({
  transactionIds: z.array(z.string()),
  reason: z.string(),
})

const clientEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  relatedTransactionIds: z.array(z.string()).optional(),
})

const documentRequestSchema = z.object({
  items: z.array(z.string()),
  dueDate: z.string().nullish(),
})

function parsePayload<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } }, input: unknown, tool: string): T {
  const result = schema.safeParse(input)
  if (!result.success || result.data === undefined) {
    throw new Error(`Malformed arguments for write tool "${tool}"`)
  }
  return result.data
}

// ─── WRITE tool: build ActionCard ─────────────────────────────────────────────

export function buildActionCard(name: string, input: Record<string, unknown>): ActionCard {
  const id = crypto.randomUUID()
  switch (name) {
    case 'draft_journal_entry': {
      const p: JournalEntryPayload = parsePayload(journalEntrySchema, input, name)
      const total = p.lines.reduce((s, l) => s + (l.debit ?? 0), 0)
      return { id, type: 'journal_entry', status: 'pending', title: `Journal Entry: ${p.memo}`, summary: `${p.lines.length} lines · $${total.toFixed(2)} · ${p.date}`, payload: p }
    }
    case 'draft_recategorize': {
      const p: RecategorizePayload = parsePayload(recategorizeSchema, input, name)
      return { id, type: 'recategorize', status: 'pending', title: `Recategorize to ${p.newCategory}`, summary: `${p.transactionIds.length} transaction${p.transactionIds.length !== 1 ? 's' : ''} · ${p.reason}`, payload: p }
    }
    case 'draft_flag': {
      const p: FlagPayload = parsePayload(flagSchema, input, name)
      return { id, type: 'flag', status: 'pending', title: 'Flag for Review', summary: `${p.transactionIds.length} transaction${p.transactionIds.length !== 1 ? 's' : ''} · ${p.reason}`, payload: p }
    }
    case 'draft_client_email': {
      const p = parsePayload(clientEmailSchema, input, name)
      return { id, type: 'client_email', status: 'pending', title: `Email: ${p.subject}`, summary: p.body.substring(0, 100) + (p.body.length > 100 ? '…' : ''), payload: { ...p, relatedTransactionIds: (p.relatedTransactionIds ?? []) as string[] } }
    }
    case 'draft_document_request': {
      const p = parsePayload(documentRequestSchema, input, name)
      return { id, type: 'document_request', status: 'pending', title: 'Document Request', summary: `${p.items.length} item${p.items.length !== 1 ? 's' : ''}${p.dueDate ? ` · due ${p.dueDate}` : ''}`, payload: { ...p, dueDate: p.dueDate ?? null } }
    }
    default:
      throw new Error(`Unknown write tool: ${name}`)
  }
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  clientId: string,
  supabase: SupabaseClient,
): Promise<unknown> {
  switch (name) {
    case 'query_transactions':
      return execQueryTransactions(input as Parameters<typeof execQueryTransactions>[0], clientId, supabase)
    case 'get_account_summary':
      return execGetAccountSummary(input as { period: string }, clientId, supabase)
    case 'get_close_status':
      return execGetCloseStatus(clientId, supabase)
    case 'get_trial_balance':
      return execGetTrialBalance(input as { period: string }, clientId, supabase)
    case 'search_vendors':
      return execSearchVendors(input as { query: string }, clientId, supabase)
    case 'compare_periods':
      return execComparePeriods(input as { period1: string; period2: string }, clientId, supabase)
    case 'find_duplicates':
      return execFindDuplicates(clientId, supabase)
    case 'find_anomalies':
      return execFindAnomalies(clientId, supabase)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
