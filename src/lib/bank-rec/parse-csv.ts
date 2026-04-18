import Papa from 'papaparse'
import type { ParsedStatement } from './types'

type Row = Record<string, string>

const DATE_KEYS = ['date', 'posted', 'trans date', 'transaction date', 'posting date', 'effective date', 'value date']
const DESC_KEYS = ['description', 'desc', 'memo', 'narrative', 'payee', 'details', 'name', 'particulars', 'transaction description']
const AMOUNT_KEYS = ['amount', 'transaction amount', 'tran amount', 'net amount']
const DEBIT_KEYS = ['debit', 'withdrawal', 'withdrawals', 'charges', 'payment', 'debit amount']
const CREDIT_KEYS = ['credit', 'deposit', 'deposits', 'credits', 'credit amount']
const REF_KEYS = ['reference', 'ref', 'check', 'check no', 'check number', 'transaction id', 'id', 'fitid', 'serial']

function findCol(headers: string[], keys: string[]): string | undefined {
  const lower = headers.map(h => h.toLowerCase().trim())
  const idx = lower.findIndex(h => keys.some(k => h === k || h.includes(k)))
  return idx >= 0 ? headers[idx] : undefined
}

function parseAmount(val: string): number {
  if (!val?.trim()) return 0
  const cleaned = val.replace(/[$,\s]/g, '').replace(/\((.+)\)/, '-$1')
  return parseFloat(cleaned) || 0
}

function parseDate(val: string): string {
  if (!val?.trim()) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10)
  const mdy = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (mdy) {
    const [, m, d, y] = mdy
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const dt = new Date(val)
  return !isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : val
}

export function parseCSV(csvText: string, bankName = 'Unknown Bank'): ParsedStatement {
  const { data, errors } = Papa.parse<Row>(csvText, { header: true, skipEmptyLines: true })
  if (errors.length > 0 && data.length === 0) throw new Error(`CSV parse error: ${errors[0].message}`)
  if (data.length === 0) throw new Error('CSV file contains no data rows')

  const headers = Object.keys(data[0])
  const dateCol = findCol(headers, DATE_KEYS)
  const descCol = findCol(headers, DESC_KEYS)
  const amountCol = findCol(headers, AMOUNT_KEYS)
  const debitCol = findCol(headers, DEBIT_KEYS)
  const creditCol = findCol(headers, CREDIT_KEYS)
  const refCol = findCol(headers, REF_KEYS)

  if (!dateCol) throw new Error('Could not detect date column. Ensure your CSV has a "Date" or "Posted" header.')
  if (!descCol) throw new Error('Could not detect description column. Ensure your CSV has a "Description" or "Memo" header.')
  if (!amountCol && !debitCol && !creditCol) throw new Error('Could not detect amount columns. Ensure CSV has "Amount", "Debit", or "Credit" headers.')

  let statementDate = ''
  let endingBalance = 0

  const lines = data
    .filter(row => row[dateCol]?.trim())
    .map(row => {
      const date = parseDate(row[dateCol])
      if (date > statementDate) statementDate = date

      let amount: number
      let type: 'debit' | 'credit'

      if (amountCol) {
        const raw = parseAmount(row[amountCol])
        amount = Math.abs(raw)
        type = raw <= 0 ? 'debit' : 'credit'
      } else {
        const d = parseAmount(row[debitCol ?? ''])
        const c = parseAmount(row[creditCol ?? ''])
        if (d > 0) { amount = d; type = 'debit' }
        else { amount = c; type = 'credit' }
      }

      if (type === 'credit') endingBalance += amount
      else endingBalance -= amount

      return {
        date,
        description: row[descCol]?.trim() ?? '',
        amount,
        type,
        reference_number: refCol ? (row[refCol]?.trim() || undefined) : undefined,
        match_confidence: undefined,
      }
    })
    .filter(l => l.description && l.amount > 0)

  return {
    bank_name: bankName,
    statement_date: statementDate || new Date().toISOString().slice(0, 10),
    beginning_balance: 0,
    ending_balance: endingBalance,
    lines,
  }
}
