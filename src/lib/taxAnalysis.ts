import type { CategorizationJob, Transaction } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PLRow {
  category: string
  accountCode: string
  totalDebits: number
  totalCredits: number
  count: number
  monthly: Record<string, number>   // "2024-01" → net debit amount
}

export interface DepreciationCandidate {
  description: string
  amount: number
  date: string
  suggestedClass: string
  usefulLife: number
  transactionId: string
}

export interface Vendor1099 {
  vendorName: string
  totalPaid: number
  transactionCount: number
  likelyCorporate: boolean  // if false → probably individual/contractor
}

export interface OwnerDraw {
  description: string
  amount: number
  date: string
  transactionId: string
}

export interface TaxHandoffData {
  clientName: string
  taxYear: number
  generatedAt: string
  months: string[]          // all months covered by jobs
  plRows: PLRow[]
  depreciationCandidates: DepreciationCandidate[]
  vendors1099: Vendor1099[]
  ownerDraws: OwnerDraw[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  openItems: string[]
}

// ─── Asset class detection ────────────────────────────────────────────────────

const ASSET_PATTERNS: { pattern: RegExp; cls: string; life: number }[] = [
  { pattern: /laptop|macbook|computer|desktop|monitor|workstation/i, cls: 'Computer Equipment', life: 5 },
  { pattern: /\bvehicle\b|truck|van|\bcar\b|auto\b/i,               cls: 'Vehicle', life: 5 },
  { pattern: /furniture|desk|chair|cabinet|shelv/i,                  cls: 'Furniture & Fixtures', life: 7 },
  { pattern: /equipment|machinery|machine|\btools?\b/i,              cls: 'Machinery & Equipment', life: 7 },
  { pattern: /renovation|remodel|leasehold|build-?out|improvement/i, cls: 'Leasehold Improvement', life: 39 },
  { pattern: /software|license|saas\b/i,                            cls: 'Software', life: 3 },
  { pattern: /\bsign\b|signage|display/i,                           cls: 'Signage', life: 7 },
]

const DEPRECIATION_MIN_AMOUNT = 2500

// ─── Owner draw detection ─────────────────────────────────────────────────────

const DRAW_CATEGORIES = new Set([
  'owner draw', 'owner\'s draw', 'distributions', 'owner distributions',
  'shareholder distribution', 'partner draw', 'member draw',
])

const DRAW_DESC_PATTERN = /\b(draw|distribution|personal|owner)\b/i

// ─── 1099 detection ───────────────────────────────────────────────────────────

const CORPORATE_PATTERN = /\b(inc|llc|l\.l\.c|corp|ltd|co\.|company|group|associates|partners|llp|plc|pllc)\b/i

const SERVICE_CATEGORIES = new Set([
  'professional services', 'contract labor', 'consulting', 'freelance',
  'outside services', 'subcontractors', 'contract services',
])

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildTaxHandoffData(
  jobs: CategorizationJob[],
  taxYear: number,
): TaxHandoffData {
  const clientName = jobs[0]?.client_name ?? 'Unknown Client'

  // Collect all approved/edited transactions across all jobs
  const allTx: Transaction[] = jobs.flatMap((j) =>
    j.transactions.filter((t) => t.status === 'approved' || t.status === 'edited')
  )

  // Filter to tax year
  const yearTx = allTx.filter((t) => t.date.startsWith(String(taxYear)))

  const months = [...new Set(jobs.map((j) => j.created_at.slice(0, 7)))].sort()

  // ── P&L ────────────────────────────────────────────────────────────────────
  const plMap = new Map<string, PLRow>()
  for (const tx of yearTx) {
    const cat  = tx.final_category ?? tx.suggested_category ?? 'Uncategorized'
    const code = tx.final_account_code ?? tx.suggested_account_code ?? ''
    const month = tx.date.slice(0, 7)
    const row  = plMap.get(cat) ?? {
      category: cat, accountCode: code,
      totalDebits: 0, totalCredits: 0, count: 0, monthly: {},
    }
    if (tx.type === 'debit') {
      row.totalDebits += tx.amount
      row.monthly[month] = (row.monthly[month] ?? 0) + tx.amount
    } else {
      row.totalCredits += tx.amount
      row.monthly[month] = (row.monthly[month] ?? 0) - tx.amount
    }
    row.count++
    plMap.set(cat, row)
  }
  const plRows = Array.from(plMap.values()).sort((a, b) => b.totalDebits - a.totalDebits)

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalRevenue  = yearTx.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = yearTx.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const netIncome     = totalRevenue - totalExpenses

  // ── Depreciation candidates ────────────────────────────────────────────────
  const depreciationCandidates: DepreciationCandidate[] = []
  for (const tx of yearTx) {
    if (tx.type !== 'debit' || tx.amount < DEPRECIATION_MIN_AMOUNT) continue
    for (const { pattern, cls, life } of ASSET_PATTERNS) {
      if (pattern.test(tx.description)) {
        depreciationCandidates.push({
          description:    tx.description,
          amount:         tx.amount,
          date:           tx.date,
          suggestedClass: cls,
          usefulLife:     life,
          transactionId:  tx.id,
        })
        break
      }
    }
  }

  // ── 1099 vendors ───────────────────────────────────────────────────────────
  const vendorMap = new Map<string, { total: number; count: number; cat: string }>()
  for (const tx of yearTx) {
    if (tx.type !== 'debit') continue
    const cat = (tx.final_category ?? tx.suggested_category ?? '').toLowerCase()
    if (!SERVICE_CATEGORIES.has(cat)) continue
    const key = tx.description.replace(/#?\b\d{3,}\b/g, '').trim().toUpperCase()
    const e   = vendorMap.get(key) ?? { total: 0, count: 0, cat }
    vendorMap.set(key, { total: e.total + tx.amount, count: e.count + 1, cat })
  }
  const vendors1099: Vendor1099[] = Array.from(vendorMap.entries())
    .filter(([, v]) => v.total >= 600)
    .map(([name, v]) => ({
      vendorName:      name,
      totalPaid:       v.total,
      transactionCount: v.count,
      likelyCorporate: CORPORATE_PATTERN.test(name),
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid)

  // ── Owner draws ────────────────────────────────────────────────────────────
  const ownerDraws: OwnerDraw[] = yearTx
    .filter((tx) => {
      const cat = (tx.final_category ?? tx.suggested_category ?? '').toLowerCase()
      return DRAW_CATEGORIES.has(cat) || DRAW_DESC_PATTERN.test(tx.description)
    })
    .map((tx) => ({
      description:   tx.description,
      amount:        tx.amount,
      date:          tx.date,
      transactionId: tx.id,
    }))

  // ── Open items ─────────────────────────────────────────────────────────────
  const openItems: string[] = []
  if (depreciationCandidates.length > 0)
    openItems.push(`${depreciationCandidates.length} potential capital expenditure${depreciationCandidates.length !== 1 ? 's' : ''} need a expense-vs-capitalize decision`)
  const needsW9 = vendors1099.filter((v) => !v.likelyCorporate)
  if (needsW9.length > 0)
    openItems.push(`${needsW9.length} vendor${needsW9.length !== 1 ? 's' : ''} appear to be individuals — collect W-9 before filing 1099s`)
  if (ownerDraws.length > 0)
    openItems.push(`${ownerDraws.length} possible owner draw${ownerDraws.length !== 1 ? 's' : ''} — confirm classification (distribution vs. loan vs. expense)`)
  const flaggedTx = jobs.flatMap((j) => j.transactions.filter((t) => t.status === 'flagged'))
  if (flaggedTx.length > 0)
    openItems.push(`${flaggedTx.length} transaction${flaggedTx.length !== 1 ? 's' : ''} still flagged and need CPA resolution before filing`)

  return {
    clientName,
    taxYear,
    generatedAt: new Date().toISOString(),
    months,
    plRows,
    depreciationCandidates,
    vendors1099,
    ownerDraws,
    totalRevenue,
    totalExpenses,
    netIncome,
    openItems,
  }
}
