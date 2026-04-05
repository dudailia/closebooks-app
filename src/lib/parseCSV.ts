import Papa from 'papaparse'
import type { Transaction } from '@/types'

export type ParseCSVResult = {
  transactions: Transaction[]
  errors: string[]
}

// ---------------------------------------------------------------------------
// Column name aliases — keys are the canonical field name, values are the
// lowercase header variants we try to match against.
// ---------------------------------------------------------------------------
const COLUMN_ALIASES: Record<string, string[]> = {
  date: ['date', 'transaction date', 'trans date', 'posted date', 'posting date', 'value date', 'settlement date'],
  description: ['description', 'memo', 'narrative', 'particulars', 'details', 'transaction description', 'transaction details', 'payee', 'reference'],
  amount: ['amount', 'transaction amount', 'net amount'],
  debit: ['debit', 'debit amount', 'withdrawal', 'withdrawals', 'payment', 'payments out', 'money out'],
  credit: ['credit', 'credit amount', 'deposit', 'deposits', 'payments in', 'money in'],
  balance: ['balance', 'running balance', 'ledger balance'],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Find the first header in a row that matches one of the alias lists. */
function resolveColumn(headers: string[], canonical: string): string | null {
  const aliases = COLUMN_ALIASES[canonical]
  for (const h of headers) {
    if (aliases.includes(normaliseKey(h))) return h
  }
  return null
}

/**
 * Strip currency symbols, thousands separators, and surrounding whitespace.
 * Preserves the leading minus sign and handles parentheses as negatives: (1,200.00) → -1200
 */
function parseAmount(raw: string): number | null {
  if (!raw || !raw.trim()) return null
  const trimmed = raw.trim()
  // Parentheses notation: (1,200.00) means negative
  const isParens = /^\(.*\)$/.test(trimmed)
  const cleaned = trimmed
    .replace(/[()]/g, '')          // remove parens
    .replace(/[^0-9.,-]/g, '')     // strip currency symbols, spaces, letters
    .replace(/,(?=\d{3})/g, '')    // strip thousands commas  e.g. 1,200.00 → 1200.00
    .trim()
  if (!cleaned) return null
  const value = parseFloat(cleaned)
  if (isNaN(value)) return null
  return isParens ? -Math.abs(value) : value
}

/**
 * Best-effort date normalisation — returns an ISO date string (YYYY-MM-DD)
 * or the original string if we cannot parse it.
 */
function normaliseDate(raw: string): string {
  const s = raw.trim()
  if (!s) return s

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // MM/DD/YYYY  (ambiguous — assumed US format when day > 12 in the month slot)
  const mdy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (mdy) {
    const [, m, d, y] = mdy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // DD Mon YYYY  e.g. "01 Jan 2024" or "1-Jan-2024"
  const dMonY = s.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,9})[\s\-\/](\d{4})$/)
  if (dMonY) {
    const [, d, mon, y] = dMonY
    const date = new Date(`${mon} ${d} ${y}`)
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  }

  // Mon DD YYYY  e.g. "Jan 01 2024"
  const monDY = s.match(/^([A-Za-z]{3,9})[\s\-\/](\d{1,2})[\s\-\/](\d{4})$/)
  if (monDY) {
    const [, mon, d, y] = monDY
    const date = new Date(`${mon} ${d} ${y}`)
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  }

  // Last resort: hand to Date constructor
  const fallback = new Date(s)
  if (!isNaN(fallback.getTime())) return fallback.toISOString().slice(0, 10)

  return s // give back original if nothing worked
}

/**
 * Some banks prepend several rows of account info before the actual header.
 * Find the first row that contains a recognisable date or description column.
 */
function findHeaderRowIndex(rows: string[][]): number {
  const knownAliases = [
    ...COLUMN_ALIASES.date,
    ...COLUMN_ALIASES.description,
    ...COLUMN_ALIASES.amount,
    ...COLUMN_ALIASES.debit,
    ...COLUMN_ALIASES.credit,
  ]
  for (let i = 0; i < rows.length; i++) {
    const lower = rows[i].map(normaliseKey)
    if (lower.some((cell) => knownAliases.includes(cell))) return i
  }
  return 0
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function parseTransactionCSV(csvContent: string): ParseCSVResult {
  const errors: string[] = []
  const transactions: Transaction[] = []

  // --- Step 1: raw parse without headers to locate the true header row ------
  const raw = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  })

  if (raw.errors.length) {
    errors.push(...raw.errors.map((e) => `Parse error at row ${e.row ?? '?'}: ${e.message}`))
  }

  if (!raw.data.length) {
    errors.push('CSV file appears to be empty.')
    return { transactions, errors }
  }

  const headerRowIndex = findHeaderRowIndex(raw.data)
  const headerRow = raw.data[headerRowIndex].map((h) => h.trim())
  const dataRows = raw.data.slice(headerRowIndex + 1)

  // --- Step 2: resolve columns ----------------------------------------------
  const colDate = resolveColumn(headerRow, 'date')
  const colDescription = resolveColumn(headerRow, 'description')
  const colAmount = resolveColumn(headerRow, 'amount')
  const colDebit = resolveColumn(headerRow, 'debit')
  const colCredit = resolveColumn(headerRow, 'credit')

  if (!colDate) errors.push('Could not find a Date column. Dates will be empty.')
  if (!colDescription) errors.push('Could not find a Description/Memo column. Descriptions will be empty.')
  if (!colAmount && !colDebit && !colCredit) {
    errors.push('Could not find an Amount, Debit, or Credit column.')
  }

  // Build a row → object mapper using resolved header positions
  const headerIndex = Object.fromEntries(headerRow.map((h, i) => [h, i]))

  function cell(row: string[], col: string | null): string {
    if (!col) return ''
    const idx = headerIndex[col]
    return idx !== undefined ? (row[idx] ?? '').trim() : ''
  }

  // --- Step 3: process each data row ----------------------------------------
  // Sign convention: positive number = credit (money in), negative = debit (money out).
  // We trust the sign in the CSV exactly as written. No auto-detection, no flipping.
  dataRows.forEach((row, rowNum) => {
    // Skip blank rows
    if (row.every((c) => !c.trim())) return

    const rawDate = cell(row, colDate)
    const rawDesc = cell(row, colDescription)

    let amount: number
    let type: 'debit' | 'credit'

    if (colAmount) {
      // Single amount column — trust the sign as-is
      const parsed = parseAmount(cell(row, colAmount))
      if (parsed === null) {
        errors.push(`Row ${headerRowIndex + rowNum + 2}: could not parse amount "${cell(row, colAmount)}" — row skipped.`)
        return
      }
      // positive = credit (deposit/income), negative = debit (expense/payment)
      amount = Math.abs(parsed)
      type = parsed >= 0 ? 'credit' : 'debit'
    } else {
      // Separate debit / credit columns — debit column = money out, credit column = money in
      const debitRaw = cell(row, colDebit)
      const creditRaw = cell(row, colCredit)
      const debitVal = parseAmount(debitRaw)
      const creditVal = parseAmount(creditRaw)

      if (creditVal !== null && creditVal !== 0) {
        amount = Math.abs(creditVal)
        type = 'credit'
      } else if (debitVal !== null && debitVal !== 0) {
        amount = Math.abs(debitVal)
        type = 'debit'
      } else {
        // Both empty — skip silently (often a balance-only row)
        return
      }
    }

    const description = rawDesc || '(no description)'
    const date = normaliseDate(rawDate)

    transactions.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date,
      description,
      amount,
      type,
      original_description: description,
      suggested_category: '',
      suggested_account_code: '',
      confidence: 0,
      status: 'pending',
    })
  })

  return { transactions, errors }
}

// ---------------------------------------------------------------------------
// Chart of accounts parser (kept separate, unchanged interface)
// ---------------------------------------------------------------------------

export type ParseChartResult = {
  accounts: Array<{ code: string; name: string; type: string }>
  errors: string[]
}

export function parseChartOfAccountsCSV(csvContent: string): ParseChartResult {
  const errors: string[] = []

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  })

  if (result.errors.length) {
    errors.push(...result.errors.map((e) => `Parse error at row ${e.row ?? '?'}: ${e.message}`))
  }

  const accounts = result.data
    .map((row, i) => {
      const code = row['Code'] ?? row['code'] ?? row['Account Code'] ?? ''
      const name = row['Name'] ?? row['name'] ?? row['Account Name'] ?? ''
      const type = (row['Type'] ?? row['type'] ?? '').toLowerCase()

      if (!code || !name) {
        errors.push(`Row ${i + 2}: missing code or name — skipped.`)
        return null
      }

      return { code, name, type }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  return { accounts, errors }
}
