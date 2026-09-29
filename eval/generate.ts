// Generates the synthetic labelled test set from eval/data/vendors.csv.
//
//   node eval/generate.ts            (Node 22.18+ runs TypeScript directly)
//
// Deterministic: a fixed seed, and each vendor draws from its own random
// stream, so editing one vendor doesn't reshuffle the others. Labels come only
// from vendors.csv (reviewed by hand) and hand_labels.csv (filled by hand);
// nothing here calls a model. See eval/README.md.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SEED = 20260601
const PERIOD_START = '2026-06-01'
const PERIOD_END = '2026-08-31'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DATA = fileURLToPath(new URL('./data/', import.meta.url))
const CHART_SOURCE = `${ROOT}src/components/ChartOfAccountsUpload.tsx`

// ─── CSV ──────────────────────────────────────────────────────────────────────

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

function readCsv(path: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  return rows.map((r, i) => {
    if (r.length !== header.length) throw new Error(`${path} row ${i + 2}: ${r.length} fields, expected ${header.length}`)
    return Object.fromEntries(header.map((h, j) => [h, r[j].trim()]))
  })
}

function toCsv(header: string[], rows: Array<Record<string, string>>): string {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [header.join(','), ...rows.map((r) => header.map((h) => cell(r[h] ?? '')).join(','))].join('\n') + '\n'
}

// ─── Chart of accounts (read from the app's own template) ────────────────────

interface Account { code: string; name: string; type: string }

function readChart(): Account[] {
  const src = readFileSync(CHART_SOURCE, 'utf8')
  const block = src.match(/const STANDARD_SMALL_BUSINESS[^=]*=\s*\[([\s\S]*?)\n\]/)
  if (!block) throw new Error(`STANDARD_SMALL_BUSINESS not found in ${CHART_SOURCE}`)
  const accounts = [...block[1].matchAll(/\{\s*code:\s*'([^']+)',\s*name:\s*(['"])(.+?)\2,\s*type:\s*'([^']+)'/g)]
    .map((m) => ({ code: m[1], name: m[3], type: m[4] }))
  if (accounts.length !== 34) throw new Error(`expected 34 accounts in the template, found ${accounts.length}`)
  return accounts
}

// ─── Vendors ──────────────────────────────────────────────────────────────────

interface Vendor {
  key: string
  examples: string[]
  direction: 'debit' | 'credit'
  accountCode: string
  ambiguous: boolean
}

function readVendors(chart: Account[]): Vendor[] {
  const byCode = new Map(chart.map((a) => [a.code, a]))
  const seen = new Set<string>()
  return readCsv(`${DATA}vendors.csv`).map((r) => {
    const where = `vendors.csv ${r.vendor_key}`
    if (!/^[a-z0-9_]+$/.test(r.vendor_key)) throw new Error(`${where}: vendor_key must be snake_case`)
    if (seen.has(r.vendor_key)) throw new Error(`${where}: duplicate vendor_key`)
    seen.add(r.vendor_key)
    if (r.direction !== 'debit' && r.direction !== 'credit') throw new Error(`${where}: direction must be debit or credit`)
    if (r.ambiguous !== 'yes' && r.ambiguous !== 'no') throw new Error(`${where}: ambiguous must be yes or no`)
    const examples = r.example_descriptions.split('|').map((s) => s.trim()).filter(Boolean)
    if (examples.length < 2 || examples.length > 3) throw new Error(`${where}: needs 2-3 example_descriptions`)
    if (r.ambiguous === 'yes') {
      if (r.account_code || r.account_name) throw new Error(`${where}: ambiguous vendors must leave account_code and account_name blank`)
    } else {
      const account = byCode.get(r.account_code)
      if (!account) throw new Error(`${where}: account_code "${r.account_code}" is not in the chart`)
      if (account.name !== r.account_name) throw new Error(`${where}: account_name "${r.account_name}" should be "${account.name}"`)
    }
    return { key: r.vendor_key, examples, direction: r.direction, accountCode: r.account_code, ambiguous: r.ambiguous === 'yes' }
  })
}

// ─── Schedules: how often each vendor appears and for how much ───────────────

type Amount = number | [number, number]
type DayOfMonth = number | 'last'

type Schedule =
  | { kind: 'monthly'; day: DayOfMonth; amount: Amount; businessDay?: boolean; round?: number }
  | { kind: 'semimonthly'; days: [DayOfMonth, DayOfMonth]; amount: Amount; businessDay?: boolean; round?: number }
  | { kind: 'weekly'; weekday: number; amount: Amount; round?: number }
  | { kind: 'random'; perMonth: [number, number]; amount: Amount; weekdaysOnly?: boolean; round?: number }
  | { kind: 'dates'; dates: string[]; amount: Amount; round?: number }
  | { kind: 'dates'; dates: string[]; amounts: number[] }
  | { kind: 'sameDatesAs'; vendor: string; amount: Amount }

const SCHEDULES: Record<string, Schedule> = {
  // Money in
  client_harborline:    { kind: 'monthly', day: 5, businessDay: true, amount: 4500 },
  client_kestrel:       { kind: 'random', perMonth: [1, 2], weekdaysOnly: true, amount: [2800, 9600], round: 25 },
  client_orchard_wire:  { kind: 'dates', dates: ['2026-06-22', '2026-08-10'], amount: [12000, 18500], round: 50 },
  client_check_deposit: { kind: 'random', perMonth: [1, 2], weekdaysOnly: true, amount: [650, 3200], round: 5 },
  stripe_payout:        { kind: 'weekly', weekday: 2, amount: [900, 5200] },
  square_workshop:      { kind: 'dates', dates: ['2026-06-15', '2026-07-20'], amount: [1100, 2400] },
  bank_interest:        { kind: 'monthly', day: 'last', businessDay: true, amount: [3.1, 9.8] },
  owner_contribution:   { kind: 'dates', dates: ['2026-06-03'], amount: 5000 },
  savings_transfer_in:  { kind: 'dates', dates: ['2026-07-29'], amount: 6000 },
  loc_draw:             { kind: 'dates', dates: ['2026-07-06'], amount: 10000 },
  refund_adobe:         { kind: 'dates', dates: ['2026-07-09'], amount: 59.99 },
  refund_delta:         { kind: 'dates', dates: ['2026-08-19'], amount: 387.4 },

  // Payroll, rent, utilities
  gusto_net_pay:        { kind: 'semimonthly', days: [15, 'last'], businessDay: true, amount: [9800, 10400] },
  gusto_tax:            { kind: 'semimonthly', days: [15, 'last'], businessDay: true, amount: [3100, 3400] },
  gusto_fee:            { kind: 'monthly', day: 1, businessDay: true, amount: 104 },
  office_rent:          { kind: 'monthly', day: 1, businessDay: true, amount: 3250 },
  coworking:            { kind: 'random', perMonth: [1, 1], weekdaysOnly: true, amount: [45, 180] },
  electric:             { kind: 'monthly', day: 18, businessDay: true, amount: [142, 238] },
  internet:             { kind: 'monthly', day: 9, amount: 129.99 },
  phone:                { kind: 'monthly', day: 22, amount: [186.4, 192.1] },

  // Supplies and marketing
  staples:              { kind: 'random', perMonth: [2, 3], amount: [18, 145] },
  office_depot:         { kind: 'random', perMonth: [0, 2], amount: [24, 160] },
  usps:                 { kind: 'random', perMonth: [3, 5], amount: [4.73, 38.6] },
  google_ads:           { kind: 'random', perMonth: [2, 3], amount: [150, 500] },
  meta_ads:             { kind: 'random', perMonth: [3, 4], amount: [50, 250] },
  linkedin_ads:         { kind: 'monthly', day: 3, amount: [300, 600] },
  mailchimp:            { kind: 'monthly', day: 11, amount: 45 },

  // Insurance and professional fees
  hiscox:               { kind: 'monthly', day: 14, amount: 89.58 },
  health_insurance:     { kind: 'monthly', day: 1, businessDay: true, amount: 1284.6 },
  auto_insurance:       { kind: 'monthly', day: 20, amount: 138 },
  cpa_firm:             { kind: 'monthly', day: 10, businessDay: true, amount: 650 },
  law_firm:             { kind: 'dates', dates: ['2026-07-24'], amount: 1850 },
  upwork:               { kind: 'random', perMonth: [2, 3], amount: [240, 1800] },

  // Travel and entertainment
  delta:                { kind: 'dates', dates: ['2026-06-08', '2026-07-27'], amount: [298, 612] },
  southwest:            { kind: 'dates', dates: ['2026-06-25', '2026-08-12'], amount: [148, 389] },
  marriott:             { kind: 'dates', dates: ['2026-06-11', '2026-08-14'], amount: [412, 890] },
  airbnb:               { kind: 'dates', dates: ['2026-07-30'], amount: [860, 1100] },
  uber:                 { kind: 'random', perMonth: [5, 8], amount: [11.2, 48.9] },
  lyft:                 { kind: 'random', perMonth: [1, 2], amount: [12.4, 39.8] },
  parking:              { kind: 'random', perMonth: [2, 3], amount: [3.5, 22] },
  fuel:                 { kind: 'random', perMonth: [2, 3], amount: [38, 71] },
  starbucks:            { kind: 'random', perMonth: [4, 7], amount: [4.95, 26.4] },
  doordash_team:        { kind: 'random', perMonth: [1, 2], amount: [68, 210] },

  // Software
  google_workspace:     { kind: 'monthly', day: 1, amount: 50.4 },
  adobe:                { kind: 'monthly', day: 6, amount: 179.97 },
  figma:                { kind: 'monthly', day: 12, amount: 45 },
  slack:                { kind: 'monthly', day: 7, amount: 26.25 },
  zoom:                 { kind: 'monthly', day: 16, amount: 15.99 },
  notion:               { kind: 'monthly', day: 4, amount: 30 },
  quickbooks:           { kind: 'monthly', day: 23, amount: 99 },
  aws:                  { kind: 'monthly', day: 2, amount: [61.2, 94.8] },
  github:               { kind: 'monthly', day: 8, amount: 12 },

  // Bank, taxes, owner, transfers, debt
  bank_monthly_fee:     { kind: 'monthly', day: 'last', businessDay: true, amount: 25 },
  wire_fee:             { kind: 'sameDatesAs', vendor: 'client_orchard_wire', amount: 15 },
  franchise_tax:        { kind: 'dates', dates: ['2026-08-14'], amount: 1164 },
  sales_tax:            { kind: 'monthly', day: 20, businessDay: true, amount: [180, 460] },
  sos_filing:           { kind: 'dates', dates: ['2026-06-19'], amount: 25 },
  irs_estimated:        { kind: 'dates', dates: ['2026-06-15'], amount: 6500 },
  owner_draw:           { kind: 'semimonthly', days: [16, 'last'], businessDay: true, amount: 3000 },
  savings_transfer_out: { kind: 'monthly', day: 25, businessDay: true, amount: 2000 },
  cc_payment:           { kind: 'monthly', day: 21, businessDay: true, amount: [1400, 3600] },
  sba_loan:             { kind: 'monthly', day: 28, businessDay: true, amount: 731 },
  loc_repayment:        { kind: 'dates', dates: ['2026-07-31', '2026-08-31'], amount: 5000 },
  atm_petty_cash:       { kind: 'dates', dates: ['2026-06-12', '2026-08-06'], amount: [100, 200], round: 20 },
  // Exact receipt totals (price + Austin sales tax), one per date.
  apple_equipment:      { kind: 'dates', dates: ['2026-06-24', '2026-08-03'], amounts: [2705.17, 1731.12] },
  ace_hardware:         { kind: 'random', perMonth: [0, 2], amount: [8.4, 64] },

  // Ambiguous: labelled by hand
  amazon:               { kind: 'random', perMonth: [3, 5], amount: [12.99, 389] },
  costco:               { kind: 'random', perMonth: [1, 1], amount: [48, 260] },
  venmo:                { kind: 'random', perMonth: [1, 1], amount: [40, 450], round: 5 },
  paypal:               { kind: 'random', perMonth: [1, 1], amount: [19, 320] },
  restaurant:           { kind: 'random', perMonth: [1, 3], amount: [62, 340] },
  zelle_individual:     { kind: 'dates', dates: ['2026-06-26', '2026-08-07'], amount: [300, 900], round: 25 },
  apple_services:       { kind: 'monthly', day: 9, amount: 9.99 },
}

// ─── Deterministic randomness ─────────────────────────────────────────────────

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Dates (UTC, ISO strings) ─────────────────────────────────────────────────

const iso = (d: Date) => d.toISOString().slice(0, 10)
const parseIso = (s: string) => new Date(`${s}T00:00:00Z`)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6

function months(): Array<{ year: number; month: number }> {
  const out: Array<{ year: number; month: number }> = []
  const start = parseIso(PERIOD_START)
  const end = parseIso(PERIOD_END)
  for (let y = start.getUTCFullYear(), m = start.getUTCMonth(); new Date(Date.UTC(y, m, 1)) <= end; m++) {
    if (m === 12) { y++; m = 0 }
    out.push({ year: y, month: m })
  }
  return out
}

function dayInMonth(year: number, month: number, day: DayOfMonth, businessDay: boolean): Date {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  let d = new Date(Date.UTC(year, month, day === 'last' ? last : Math.min(day, last)))
  if (businessDay) {
    // Weekend postings move to the next business day, or back to Friday at month end.
    const step = day === 'last' ? -1 : 1
    while (isWeekend(d)) d = addDays(d, step)
  }
  return d
}

// ─── Generation ───────────────────────────────────────────────────────────────

interface Row { vendor: Vendor; date: string; amount: number }

function roundTo(value: number, step = 0.01): number {
  const cents = Math.round(Math.round(value / step) * step * 100)
  return cents / 100
}

function pickAmount(amount: Amount, rng: () => number, round?: number): number {
  if (typeof amount === 'number') return amount
  const [min, max] = amount
  return roundTo(min + (max - min) * rng(), round)
}

function scheduleDates(schedule: Schedule, rng: () => number, generated: Map<string, Row[]>): string[] {
  const inPeriod = (d: string) => d >= PERIOD_START && d <= PERIOD_END
  switch (schedule.kind) {
    case 'monthly':
      return months().map(({ year, month }) => iso(dayInMonth(year, month, schedule.day, !!schedule.businessDay)))
    case 'semimonthly':
      return months().flatMap(({ year, month }) =>
        schedule.days.map((day) => iso(dayInMonth(year, month, day, !!schedule.businessDay))))
    case 'weekly': {
      const out: string[] = []
      for (let d = parseIso(PERIOD_START); iso(d) <= PERIOD_END; d = addDays(d, 1)) {
        if (d.getUTCDay() === schedule.weekday) out.push(iso(d))
      }
      return out
    }
    case 'random':
      return months().flatMap(({ year, month }) => {
        const [lo, hi] = schedule.perMonth
        const count = lo + Math.floor(rng() * (hi - lo + 1))
        const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
        const out: string[] = []
        for (let i = 0; i < count; i++) {
          let d = new Date(Date.UTC(year, month, 1 + Math.floor(rng() * last)))
          if (schedule.weekdaysOnly) while (isWeekend(d)) d = addDays(d, 1)
          if (inPeriod(iso(d))) out.push(iso(d))
        }
        return out.sort()
      })
    case 'dates':
      return schedule.dates.filter(inPeriod)
    case 'sameDatesAs': {
      const source = generated.get(schedule.vendor)
      if (!source) throw new Error(`sameDatesAs: ${schedule.vendor} must come earlier in vendors.csv`)
      return source.map((r) => r.date)
    }
  }
}

function amountsFor(schedule: Schedule, count: number, rng: () => number): number[] {
  if ('amounts' in schedule) {
    if (schedule.amounts.length !== count) throw new Error('amounts must list one value per date')
    return schedule.amounts
  }
  if (!('amount' in schedule)) throw new Error('schedule has no amount')
  const round = 'round' in schedule ? schedule.round : undefined
  return Array.from({ length: count }, () => pickAmount(schedule.amount, rng, round))
}

function fillDescription(template: string, date: string, rng: () => number): string {
  const alnum = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  return template
    .replace(/\{mmdd\}/g, `${date.slice(5, 7)}/${date.slice(8, 10)}`)
    .replace(/\{ref\}/g, () => Array.from({ length: 10 }, () => alnum[Math.floor(rng() * alnum.length)]).join(''))
    .replace(/\{n4\}/g, () => String(1000 + Math.floor(rng() * 9000)))
}

function main(): void {
  const chart = readChart()
  const vendors = readVendors(chart)

  const vendorKeys = new Set(vendors.map((v) => v.key))
  for (const key of vendorKeys) if (!SCHEDULES[key]) throw new Error(`no schedule for vendor ${key}`)
  for (const key of Object.keys(SCHEDULES)) if (!vendorKeys.has(key)) throw new Error(`schedule for unknown vendor ${key}`)

  const generated = new Map<string, Row[]>()
  for (const vendor of vendors) {
    const rng = mulberry32(hash(`${SEED}:${vendor.key}`))
    const schedule = SCHEDULES[vendor.key]
    const dates = scheduleDates(schedule, rng, generated)
    const amounts = amountsFor(schedule, dates.length, rng)
    generated.set(vendor.key, dates.map((date, i) => ({ vendor, date, amount: amounts[i] })))
  }

  // Stable ids: date + vendor + occurrence number on that date.
  const order = new Map(vendors.map((v, i) => [v.key, i]))
  const rows = [...generated.values()].flat()
    .sort((a, b) => a.date.localeCompare(b.date) || order.get(a.vendor.key)! - order.get(b.vendor.key)!)
  const perDay = new Map<string, number>()
  const out = rows.map((r) => {
    const k = `${r.date}_${r.vendor.key}`
    const n = (perDay.get(k) ?? 0) + 1
    perDay.set(k, n)
    const rng = mulberry32(hash(`${SEED}:${k}:${n}`))
    const template = r.vendor.examples[Math.floor(rng() * r.vendor.examples.length)]
    return {
      id: `${k}_${n}`,
      date: r.date,
      description: fillDescription(template, r.date, rng),
      amount: r.amount.toFixed(2),
      type: r.vendor.direction,
      true_account_code: r.vendor.ambiguous ? '' : r.vendor.accountCode,
      label_source: r.vendor.ambiguous ? 'hand' : 'vendor_table',
    }
  })

  // Hand labels live in their own file so regenerating never wipes them.
  const handPath = `${DATA}hand_labels.csv`
  const existing = new Map<string, Record<string, string>>()
  if (existsSync(handPath)) for (const r of readCsv(handPath)) existing.set(r.id, r)
  const codes = new Set(chart.map((a) => a.code))
  const handRows = out.filter((r) => r.label_source === 'hand').map((r) => {
    const prior = existing.get(r.id)
    const code = prior?.true_account_code ?? ''
    if (code && !codes.has(code)) throw new Error(`hand_labels.csv ${r.id}: "${code}" is not in the chart`)
    r.true_account_code = code
    return { id: r.id, date: r.date, description: r.description, amount: r.amount, type: r.type, true_account_code: code, note: prior?.note ?? '' }
  })
  const dropped = [...existing.keys()].filter((id) => !handRows.some((r) => r.id === id))
  if (dropped.length) console.warn(`hand_labels.csv: ${dropped.length} labelled id(s) no longer generated and were dropped: ${dropped.join(', ')}`)

  writeFileSync(`${DATA}synthetic_transactions.csv`,
    toCsv(['id', 'date', 'description', 'amount', 'type', 'true_account_code', 'label_source'], out))
  writeFileSync(handPath,
    toCsv(['id', 'date', 'description', 'amount', 'type', 'true_account_code', 'note'], handRows))
  writeFileSync(`${DATA}synthetic_upload.csv`,
    toCsv(['Date', 'Description', 'Amount'], out.map((r) => ({
      Date: r.date, Description: r.description, Amount: r.type === 'debit' ? `-${r.amount}` : r.amount,
    }))))
  writeFileSync(`${DATA}chart_of_accounts.csv`,
    toCsv(['Code', 'Name', 'Type'], chart.map((a) => ({ Code: a.code, Name: a.name, Type: a.type }))))

  // Summary
  const names = new Map(chart.map((a) => [a.code, a.name]))
  const perAccount = new Map<string, number>()
  for (const r of out) {
    const key = r.true_account_code || '(hand label needed)'
    perAccount.set(key, (perAccount.get(key) ?? 0) + 1)
  }
  console.log(`vendors: ${vendors.length} (${vendors.filter((v) => v.ambiguous).length} ambiguous)`)
  console.log(`transactions: ${out.length} (${out.filter((r) => r.type === 'debit').length} money out, ${out.filter((r) => r.type === 'credit').length} money in)`)
  console.log(`need a hand label: ${out.filter((r) => r.label_source === 'hand' && !r.true_account_code).length}`)
  console.log('per account:')
  for (const [code, count] of [...perAccount].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${code.padEnd(6)} ${(names.get(code) ?? '').padEnd(26)} ${String(count).padStart(4)}`)
  }
}

main()
