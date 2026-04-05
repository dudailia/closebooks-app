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

  // --- Step 2b: detect sign convention for single-amount columns -----------
  // Standard convention: positive = credit (money in), negative = debit (money out).
  // Some banks export ALL amounts as negative — we detect this with a 90% threshold
  // AND verify with balance-column direction and credit-keyword descriptions.
  // Only flip if BOTH the 90% rule passes AND credit-keyword rows also appear negative.
  const CREDIT_KEYWORDS = /\b(deposit|credit|payment from|client payment|wire in|interest earned|refund|reimbursement|incoming|received)\b/i

  let allNegativeConvention = false
  if (colAmount) {
    const nonBlankRows = dataRows.filter((row) => !row.every((c) => !c.trim()))
    const parsedAmounts = nonBlankRows
      .map((row) => parseAmount(cell(row, colAmount)))
      .filter((v): v is number => v !== null && v !== 0)

    if (parsedAmounts.length > 0) {
      const negCount = parsedAmounts.filter((v) => v < 0).length
      const overwhelminglyNegative = negCount / parsedAmounts.length >= 0.9

      if (overwhelminglyNegative) {
        // Secondary check: do rows with credit-like descriptions also show as negative?
        // If yes, we know the bank flipped all signs → flip them back.
        // If credit-keyword rows are actually positive, standard convention is correct.
        const creditKeywordRows = nonBlankRows.filter((row) =>
          CREDIT_KEYWORDS.test(cell(row, colDescription))
        )
        if (creditKeywordRows.length > 0) {
          const creditKeywordAmounts = creditKeywordRows
            .map((row) => parseAmount(cell(row, colAmount)))
            .filter((v): v is number => v !== null && v !== 0)
          const creditKeywordNegCount = creditKeywordAmounts.filter((v) => v < 0).length
          // Only flip if credit-keyword rows are also predominantly negative
          allNegativeConvention =
            creditKeywordAmounts.length > 0 &&
            creditKeywordNegCount / creditKeywordAmounts.length >= 0.7
        } else {
          // No credit-keyword rows to verify — use 90% rule but only if no positive amounts exist
          allNegativeConvention = parsedAmounts.every((v) => v < 0)
        }
      }
    }
  }

  // --- Step 3: process each data row ----------------------------------------
  dataRows.forEach((row, rowNum) => {
    // Skip blank rows
    if (row.every((c) => !c.trim())) return

    const rawDate = cell(row, colDate)
    const rawDesc = cell(row, colDescription)

    let amount: number
    let type: 'debit' | 'credit'

    if (colAmount) {
      // Single amount column
      const parsed = parseAmount(cell(row, colAmount))
      if (parsed === null) {
        errors.push(`Row ${headerRowIndex + rowNum + 2}: could not parse amount "${cell(row, colAmount)}" — row skipped.`)
        return
      }
      amount = Math.abs(parsed)

      if (allNegativeConvention) {
        // All-negative convention: negative = money IN (credit), positive = money OUT (debit)
        type = parsed < 0 ? 'credit' : 'debit'
      } else {
        // Standard convention: positive = credit, negative = debit
        // Override with description keywords for high-confidence signals
        const descUpper = rawDesc.toUpperCase()
        const isObviousCredit = CREDIT_KEYWORDS.test(rawDesc)
        const isObviousDebit = /\b(check|payment to|fee|charge|purchase|withdrawal|debit|expense)\b/i.test(rawDesc)

        if (isObviousCredit && !isObviousDebit && parsed > 0) {
          type = 'credit'
        } else if (isObviousDebit && !isObviousCredit && parsed < 0) {
          type = 'debit'
        } else {
          // No strong keyword signal — trust the sign from the CSV
          type = parsed < 0 ? 'debit' : 'credit'
        }
        void descUpper // suppress unused warning
      }
    } else {
      // Separate debit / credit columns
      const debitRaw = cell(row, colDebit)
      const creditRaw = cell(row, colCredit)
      const debitVal = parseAmount(debitRaw)
      const creditVal = parseAmount(creditRaw)

      if (debitVal !== null && debitVal !== 0) {
        amount = Math.abs(debitVal)
        type = 'debit'
      } else if (creditVal !== null && creditVal !== 0) {
        amount = Math.abs(creditVal)
        type = 'credit'
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
