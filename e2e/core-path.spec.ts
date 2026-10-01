import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// The core path, end to end, on synthetic data only:
// demo entry → client → chart → upload → categorise → recategorise one row →
// save a rule → approve → journal-entry CSV (balanced) → report → a second
// close where the rule applies before the model.
//
// Runs against a local build in demo mode with the fake model (see
// playwright.config.ts). Screenshots go to docs/screenshots/.

const ROOT = path.resolve(__dirname, '..')
const SHOTS = path.join(ROOT, 'docs', 'screenshots')
const US_DATES_CSV = path.join(ROOT, 'e2e', 'fixtures', 'us-dates-8.csv')
const SYNTHETIC_292_CSV = path.join(ROOT, 'eval', 'data', 'synthetic_upload.csv')
const CLIENT = 'Brightline Studio LLC (synthetic)'

async function shot(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage })
}

/** Parse the journal-entry CSV and return totals in cents, per entry and overall. */
function journalTotals(csv: string) {
  const [header, ...lines] = csv.trim().split(/\r?\n/)
  expect(header).toBe('Date,Entry #,Account Code,Account Name,Debit,Credit,Memo,Source,Bank Account')
  const perEntry = new Map<string, { debit: number; credit: number }>()
  let debit = 0
  let credit = 0
  for (const line of lines) {
    // Debit and credit are plain numbers in columns 5 and 6; memos may be quoted,
    // but they come after, so splitting the first six fields is safe.
    const cells = line.split(',')
    const entry = cells[1]
    const d = Math.round(Number(cells[4] || 0) * 100)
    const c = Math.round(Number(cells[5] || 0) * 100)
    const t = perEntry.get(entry) ?? { debit: 0, credit: 0 }
    t.debit += d
    t.credit += c
    perEntry.set(entry, t)
    debit += d
    credit += c
  }
  return { perEntry, debit, credit }
}

async function startClose(page: Page, file: string, rows: number) {
  await page.getByRole('link', { name: 'New Close' }).first().click()
  await page.waitForURL('**/dashboard/upload')
  await page.getByPlaceholder('e.g. Acme Corp, Jane Smith LLC').fill(CLIENT)
  await page.getByRole('button', { name: 'Continue →' }).click()
  await expect(page.getByText("Standard Small Business").first()).toBeVisible()
  return {
    async chooseChart() {
      await page.getByRole('button', { name: /Use these 34 accounts/ }).click()
    },
    async upload() {
      await page.locator('input[type=file]').setInputFiles(file)
      await expect(page.getByText(`${rows} transactions detected`)).toBeVisible()
    },
    async categorize() {
      await page.getByRole('button', { name: new RegExp(`Continue with ${rows} transactions`) }).click()
      const request = page.waitForRequest('**/api/categorize')
      await page.getByRole('button', { name: /Categorize with AI/ }).click()
      const sent = JSON.parse((await request).postData() ?? '{}').transactions.length as number
      await page.waitForURL('**/dashboard/review/**', { timeout: 60_000 })
      await expect(page.getByText(`${rows}`, { exact: true }).first()).toBeVisible()
      return sent
    },
  }
}

test('core path: two closes, a rule, balanced journal entries, report', async ({ page, context }) => {
  // Nothing may leave this machine. The notify route would forward to Formspree,
  // so the browser's call to it is answered here instead.
  const external: string[] = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.protocol === 'blob:' || url.protocol === 'data:') {
      return route.continue()
    }
    external.push(url.href)
    return route.abort()
  })
  await context.route('**/api/notify', (route) => route.fulfill({ json: { ok: true } }))

  // 1. Enter the demo (no Supabase: no sign-in, the dashboard opens directly).
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: 'New Close' }).first()).toBeVisible()
  await shot(page, '01-demo-dashboard')

  // 2. Create the client.
  await page.getByRole('link', { name: 'Clients' }).first().click()
  await page.waitForURL('**/dashboard/clients')
  await page.getByRole('button', { name: /Add Client/ }).first().click()
  await page.getByPlaceholder('Sunrise Advisory LLC').fill(CLIENT)
  await shot(page, '02-new-client-form')
  await page.getByRole('button', { name: 'Add Client', exact: true }).click()
  await expect(page.getByText(CLIENT).first()).toBeVisible()
  await shot(page, '03-client-created')

  // 3. First close: choose the chart, upload the 8-row US-date file.
  const first = await startClose(page, US_DATES_CSV, 8)
  await shot(page, '04-chart-of-accounts')
  await first.chooseChart()
  await first.upload()
  // 08/15/2026 must read as 15 August, not a month 15.
  await expect(page.getByText('2026-08-01').first()).toBeVisible()
  await shot(page, '05-upload-preview-us-dates')
  const sentFirst = await first.categorize()
  expect(sentFirst).toBe(8)
  await expect(page.locator('tr', { hasText: 'STAPLES 00115 AUSTIN TX' })).toContainText('2026-08-15')
  await shot(page, '06-review-after-categorise')

  // 4. Recategorise the Stripe payout from revenue to Accounts Receivable and save the rule.
  const stripeRow = page.locator('tr', { hasText: 'STRIPE TRANSFER ST-KQ81ZD0PA2' }).first()
  await expect(stripeRow).toContainText('4100')
  await stripeRow.click()
  await page.locator('select').filter({ has: page.locator('option[value="1100"]') }).first().selectOption('1100')
  await expect(page.getByText(/Always categorize/)).toBeVisible()
  await shot(page, '07-recategorise-and-rule-offer')
  await page.getByRole('button', { name: 'Save rule' }).click()
  await expect(stripeRow).toContainText('1100')
  await expect(stripeRow).toContainText('Edited')

  // 5. Approve everything.
  await page.locator('input[type=checkbox][title="Select all"]').check()
  await page.locator('[data-bulk-bar]').getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByText('All 8 transactions reviewed!')).toBeVisible()
  await shot(page, '08-all-approved')

  // 6. Export journal entries and check they balance, per entry and overall.
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await shot(page, '09-export-menu')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /Journal entries CSV/ }).click()
  const csv = readFileSync(await (await download).path(), 'utf8')
  const totals = journalTotals(csv)
  expect(totals.perEntry.size).toBe(8)
  for (const [entry, t] of totals.perEntry) expect(t.debit, `${entry} balances`).toBe(t.credit)
  expect(totals.debit).toBe(totals.credit)
  // The Stripe payout clears AR: debit the bank, credit 1100.
  expect(csv).toMatch(/JE-0003,1100,Accounts Receivable,,4921\.09,/)

  // 7. Open the close report (a new tab).
  const popup = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Report', exact: true }).click()
  const report = await popup
  await report.waitForLoadState()
  await expect(report.getByText('MONTH-END CLOSE REPORT')).toBeVisible()
  await expect(report.getByText('Journal entries (8)')).toBeVisible()
  await report.screenshot({ path: path.join(SHOTS, '10-close-report.png'), fullPage: true })
  await report.close()

  // 8. Second close with the 292-row synthetic file: the rule runs before the model.
  const second = await startClose(page, SYNTHETIC_292_CSV, 292)
  await second.chooseChart()
  await second.upload()
  const sentSecond = await second.categorize()
  const ruleRows = page.locator('tr', { hasText: 'STRIPE TRANSFER ST-' })
  await expect(ruleRows).toHaveCount(5)
  // Those 5 rows matched the rule, so they were not sent to the model.
  expect(sentSecond).toBe(292 - 5)
  for (let i = 0; i < 5; i++) {
    await expect(ruleRows.nth(i)).toContainText('Accounts Receivable')
    await expect(ruleRows.nth(i)).toContainText('Edited')
  }
  await ruleRows.first().scrollIntoViewIfNeeded()
  await shot(page, '11-second-close-rule-applied')

  // 9. Journal entries for the second close balance too; pending rows are exceptions.
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download2 = page.waitForEvent('download')
  await page.getByRole('button', { name: /Journal entries CSV/ }).click()
  const totals2 = journalTotals(readFileSync(await (await download2).path(), 'utf8'))
  expect(totals2.perEntry.size).toBeGreaterThan(0)
  for (const [entry, t] of totals2.perEntry) expect(t.debit, `${entry} balances`).toBe(t.credit)
  expect(totals2.debit).toBe(totals2.credit)

  expect(external, 'no request left localhost').toEqual([])
})
