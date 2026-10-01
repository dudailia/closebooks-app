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
// A second client with the same name: closes must not mix between the two.
const CLIENT_EMAIL = 'books@brightline.test'
const TWIN_EMAIL = 'other@brightline.test'

async function shot(page: Page, name: string, fullPage = false) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage })
}

/** The Save-rule prompt is fully shown and fits inside the screen, both ways. */
async function expectPromptOnScreen(page: Page) {
  const prompt = page.getByRole('status', { name: 'Save rule' })
  await expect(prompt).toBeInViewport({ ratio: 1 })
  await expect(prompt).toHaveCSS('opacity', '1')
  const box = (await prompt.boundingBox())!
  const vp = page.viewportSize()!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width)
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height)
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
  // Step 1: pick the client from the list (two share the name; the email tells them apart).
  await page.getByRole('option').filter({ hasText: CLIENT_EMAIL }).click()
  await page.getByRole('button', { name: `Continue with ${CLIENT} →` }).click()
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
  // Nothing may leave this machine. /api/notify (which forwarded to Formspree)
  // is off and nothing may call it; any call is recorded and fails the test.
  const external: string[] = []
  const notifyCalls: string[] = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.protocol === 'blob:' || url.protocol === 'data:') {
      return route.continue()
    }
    external.push(url.href)
    return route.abort()
  })
  await context.route('**/api/notify', (route) => {
    notifyCalls.push(route.request().url())
    return route.fulfill({ status: 404, json: { error: 'Not found' } })
  })

  // 1. Enter the demo (no Supabase: no sign-in, the dashboard opens directly).
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: 'New Close' }).first()).toBeVisible()
  // First visit shows the onboarding modal over the whole screen; close it.
  const welcome = page.getByRole('heading', { name: 'Welcome to CloseBooks' })
  if (await welcome.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Close' }).first().click()
    await expect(welcome).toBeHidden()
  }
  await shot(page, '01-demo-dashboard')

  // 2. Create the client, and a second client with the same name.
  await page.getByRole('link', { name: 'Clients' }).first().click()
  await page.waitForURL('**/dashboard/clients')
  for (const email of [TWIN_EMAIL, CLIENT_EMAIL]) {
    await page.getByRole('button', { name: /Add Client/ }).first().click()
    await page.getByPlaceholder('Sunrise Advisory LLC').fill(CLIENT)
    await page.getByPlaceholder('jane@sunriseadvisory.com').fill(email)
    if (email === CLIENT_EMAIL) await shot(page, '02-new-client-form')
    await page.getByRole('button', { name: 'Add Client', exact: true }).click()
  }
  await expect(page.getByText(CLIENT)).toHaveCount(2)
  await shot(page, '03-client-created')

  // 3. First close: choose the chart, upload the 8-row US-date file.
  // New Close step 1 is a searchable list with "create new client".
  await page.getByRole('link', { name: 'New Close' }).first().click()
  await page.waitForURL('**/dashboard/upload')
  await expect(page.getByRole('option')).toHaveCount(2)
  await page.getByRole('button', { name: '+ Create new client' }).click()
  await page.getByLabel('New client name').fill(CLIENT)
  await expect(page.getByText('A client with this name already exists')).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByLabel('Search clients').fill('books@')
  await expect(page.getByRole('option')).toHaveCount(1)
  await page.getByRole('option').click()
  await shot(page, '04a-new-close-client-picker')
  await page.getByLabel('Search clients').fill('')

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
  // The prompt must be on screen, not just in the page: it used to render below
  // the fold (a transformed ancestor made position:fixed relative to the page).
  const rulePrompt = page.getByRole('status', { name: 'Save rule' })
  await expectPromptOnScreen(page)
  await expect(rulePrompt).toContainText('Always categorize')
  await shot(page, '07-recategorise-and-rule-offer')
  // Approve the row first (what a reviewer did on the preview); the prompt stays.
  await page.locator('tr', { has: page.getByText('AI Reasoning') }).getByRole('button', { name: 'Approve', exact: true }).click()
  await expectPromptOnScreen(page)
  await rulePrompt.getByRole('button', { name: 'Save rule' }).click()
  await expect(rulePrompt).toHaveCount(0)
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
  // Select all + Approve kept the AI's own approvals: rent, Gusto and Uber were
  // auto-approved at upload; the Stripe edit and the 4 pending rows are the reviewer's.
  await expect(report.getByText(/3 auto-approved by AI · 5 by reviewer/)).toBeVisible()
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
  // Rule rows are approved (the rule is the reviewer's own saved correction).
  for (let i = 0; i < 5; i++) {
    await expect(ruleRows.nth(i)).toContainText('Accounts Receivable')
    await expect(ruleRows.nth(i)).toContainText('Approved')
  }
  await ruleRows.first().scrollIntoViewIfNeeded()
  await shot(page, '11-second-close-rule-applied')

  // 9. Journal entries for the second close balance too; pending rows are exceptions.
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download2 = page.waitForEvent('download')
  await page.getByRole('button', { name: /Journal entries CSV/ }).click()
  const csv2 = readFileSync(await (await download2).path(), 'utf8')
  const totals2 = journalTotals(csv2)
  expect(totals2.perEntry.size).toBeGreaterThan(0)
  for (const [entry, t] of totals2.perEntry) expect(t.debit, `${entry} balances`).toBe(t.credit)
  expect(totals2.debit).toBe(totals2.credit)
  // All 5 rule rows are posted to 1100 with source "rule".
  expect(csv2.match(/,1100,Accounts Receivable,,[\d.]+,Posted to 1100 Accounts Receivable,rule,/g)).toHaveLength(5)

  // 9b. Third close, same client, same 8-row file as close 1 (the preview test):
  // the Stripe row takes the rule, is approved and is in the journal.
  const third = await startClose(page, US_DATES_CSV, 8)
  await third.chooseChart()
  await third.upload()
  expect(await third.categorize()).toBe(7)
  const stripe3 = page.locator('tr', { hasText: 'STRIPE TRANSFER ST-KQ81ZD0PA2' }).first()
  await expect(stripe3).toContainText('1100')
  await expect(stripe3).toContainText('Approved')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download3 = page.waitForEvent('download')
  await page.getByRole('button', { name: /Journal entries CSV/ }).click()
  const csv3 = readFileSync(await (await download3).path(), 'utf8')
  expect(csv3).toMatch(/,1100,Accounts Receivable,,4921\.09,Posted to 1100 Accounts Receivable,rule,/)
  const totals3 = journalTotals(csv3)
  for (const [entry, t] of totals3.perEntry) expect(t.debit, `${entry} balances`).toBe(t.credit)

  // 9c. Mobile card: changing the account offers the rule too, on screen.
  await page.setViewportSize({ width: 390, height: 844 })
  const zoomCard = page.locator('div.md\\:hidden > div', { hasText: 'ZOOM.US 888-799-9666 CA' }).first()
  await zoomCard.getByText('ZOOM.US 888-799-9666 CA').click() // open the card
  await zoomCard.locator('select').selectOption('5400')
  await expectPromptOnScreen(page)
  await shot(page, '13-mobile-rule-offer')
  await rulePrompt.getByRole('button', { name: 'Dismiss' }).click()
  await page.setViewportSize({ width: 1360, height: 900 })

  // 10. All three closes belong to the chosen client only, not to its same-name twin.
  await page.getByRole('link', { name: 'Clients' }).first().click()
  await page.waitForURL('**/dashboard/clients')
  const cards = page.locator('main').first()
  await expect(cards.getByText('3 closes')).toHaveCount(1)
  await expect(cards.getByText('0 closes')).toHaveCount(1)
  await shot(page, '12-clients-closes-by-id')

  expect(external, 'no request left localhost').toEqual([])
  expect(notifyCalls, 'nothing called /api/notify').toEqual([])
})
