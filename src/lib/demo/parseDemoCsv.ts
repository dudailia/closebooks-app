import type { Transaction } from '@/types'

// Hard cap on how many rows the public demo will ever categorize. Shared by the
// client parser and the server route so the abuse bound is defined once.
export const DEMO_MAX_ROWS = 25

// Minimal CSV field splitter that honors double-quoted fields containing commas
// and escaped quotes ("" -> "). Enough for bank-export CSVs; not a full RFC 4180
// parser (no multi-line quoted fields), which a demo doesn't need.
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export interface ParseDemoResult {
  /** Uncategorized input rows (suggested_category etc. left blank). */
  transactions: Transaction[]
  /** True if the source had more than DEMO_MAX_ROWS rows and we capped it. */
  truncated: boolean
  /** True if we found a usable header + at least one parseable row. */
  ok: boolean
}

const HEADER_ALIASES = {
  date: ['date', 'transaction date', 'posted date', 'posting date'],
  description: ['description', 'desc', 'memo', 'name', 'payee', 'details', 'narrative'],
  amount: ['amount', 'amt', 'value', 'debit/credit'],
  type: ['type', 'transaction type', 'dr/cr', 'debit/credit type'],
}

// Parses a bank-export CSV into uncategorized Transaction rows, capped at
// DEMO_MAX_ROWS. Tolerant of column-name variations and a missing Type column
// (in which case debit/credit is inferred from the amount sign). Returns ok:false
// when no usable Description/Amount columns are found — the caller should then
// fall back to the bundled sample rather than send garbage to the model.
export function parseDemoCsv(text: string): ParseDemoResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return { transactions: [], truncated: false, ok: false }

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const find = (aliases: string[]) => header.findIndex((h) => aliases.includes(h))

  const di = find(HEADER_ALIASES.date)
  const desci = find(HEADER_ALIASES.description)
  const ai = find(HEADER_ALIASES.amount)
  const ti = find(HEADER_ALIASES.type)

  // Description + Amount are the minimum needed to categorize meaningfully.
  if (desci === -1 || ai === -1) return { transactions: [], truncated: false, ok: false }

  const dataRows = lines.slice(1)
  const truncated = dataRows.length > DEMO_MAX_ROWS

  const transactions: Transaction[] = []
  for (const line of dataRows.slice(0, DEMO_MAX_ROWS)) {
    const cells = splitCsvLine(line)
    const rawAmount = parseFloat((cells[ai] ?? '').replace(/[^0-9.\-]/g, ''))
    if (!Number.isFinite(rawAmount)) continue

    const description = (cells[desci] ?? '').trim() || 'Transaction'
    const typeCell = (ti !== -1 ? cells[ti] ?? '' : '').trim().toLowerCase()
    let type: 'debit' | 'credit'
    if (typeCell === 'credit' || typeCell === 'cr') type = 'credit'
    else if (typeCell === 'debit' || typeCell === 'dr') type = 'debit'
    else type = rawAmount < 0 ? 'debit' : 'credit'

    transactions.push({
      id: `demo-upload-${transactions.length}`,
      date: (di !== -1 ? cells[di] ?? '' : '').trim(),
      description,
      original_description: description,
      amount: Math.abs(rawAmount),
      type,
      suggested_category: '',
      suggested_account_code: '',
      confidence: 0,
      status: 'pending',
    })
  }

  return { transactions, truncated, ok: transactions.length > 0 }
}
