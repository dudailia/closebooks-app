// Loads the eval dataset and chart. Used by run.ts and report.ts.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { TruthRow } from './metrics'

export const EVAL_DIR = fileURLToPath(new URL('.', import.meta.url))
export const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))
export const DATA_DIR = `${EVAL_DIR}data/`

export interface ChartAccount { code: string; name: string; type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' }

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((v) => v !== '')) rows.push(row)
  return rows
}

export function readCsv(path: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  return rows.map((r, i) => {
    if (r.length !== header.length) throw new Error(`${path} row ${i + 2}: ${r.length} fields, expected ${header.length}`)
    return Object.fromEntries(header.map((h, j) => [h, r[j].trim()]))
  })
}

export function loadTruth(path = `${DATA_DIR}synthetic_transactions.csv`): TruthRow[] {
  return readCsv(path).map((r) => {
    if (r.type !== 'debit' && r.type !== 'credit') throw new Error(`${r.id}: bad type ${r.type}`)
    if (r.label_source !== 'vendor_table' && r.label_source !== 'hand') throw new Error(`${r.id}: bad label_source`)
    return {
      id: r.id,
      date: r.date,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      trueCode: r.true_account_code,
      acceptable: (r.acceptable_codes ?? '').split('|').map((c) => c.trim()).filter(Boolean),
      labelSource: r.label_source,
    }
  })
}

/**
 * The chart the dataset was labelled against. Stops if the CSV has drifted
 * from the app's "Standard Small Business" template (re-run generate.ts).
 */
export function loadChart(): ChartAccount[] {
  const chart = readCsv(`${DATA_DIR}chart_of_accounts.csv`).map((r) => ({
    code: r.Code, name: r.Name, type: r.Type as ChartAccount['type'],
  }))
  const src = readFileSync(`${ROOT_DIR}src/components/ChartOfAccountsUpload.tsx`, 'utf8')
  const block = src.match(/const STANDARD_SMALL_BUSINESS[^=]*=\s*\[([\s\S]*?)\n\]/)?.[1] ?? ''
  const template = [...block.matchAll(/\{\s*code:\s*'([^']+)',\s*name:\s*(['"])(.+?)\2,\s*type:\s*'([^']+)'/g)]
    .map((m) => `${m[1]}|${m[3]}|${m[4]}`)
  const csv = chart.map((a) => `${a.code}|${a.name}|${a.type}`)
  if (template.length !== 34 || template.join('\n') !== csv.join('\n')) {
    throw new Error('eval/data/chart_of_accounts.csv no longer matches the app template; run node eval/generate.ts')
  }
  return chart
}

/** n rows evenly spaced across the list, in their original (date) order. */
export function spreadSample<T>(rows: T[], n: number | null): T[] {
  if (n === null || n >= rows.length) return rows
  return Array.from({ length: n }, (_, i) => rows[Math.floor((i * rows.length) / n)])
}
