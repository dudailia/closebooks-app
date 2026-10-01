import { expect, test } from '@playwright/test'
import path from 'node:path'

// Dev-mode only: React prints "Cannot update a component while rendering a
// different component" in development builds, not in the production build the
// main e2e uses. This walks the review edits that used to trigger it
// (recategorise, save rule, bulk approve, undo) and fails on that warning.
// Demo mode and the fake model, as in e2e/core-path.spec.ts; synthetic data.

const CSV = path.resolve(__dirname, '..', 'e2e', 'fixtures', 'us-dates-8.csv')

test('review edits cause no setState-during-render warning', async ({ page, context }) => {
  const warnings: string[] = []
  page.on('console', (m) => { if (/while rendering a different component/.test(m.text())) warnings.push(m.text()) })
  await context.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()))
  await context.route('**/api/notify', (r) => r.fulfill({ json: { ok: true } }))

  await page.goto('/dashboard/upload')
  await page.getByLabel('New client name').fill('Warning Check (synthetic)', { timeout: 120_000 })
  await page.getByRole('button', { name: 'Create client' }).click()
  await page.getByRole('button', { name: /Continue with Warning Check/ }).click()
  await page.getByRole('button', { name: /Use these 34 accounts/ }).click()
  await page.locator('input[type=file]').setInputFiles(CSV)
  await page.getByRole('button', { name: /Continue with 8 transactions/ }).click()
  await page.getByRole('button', { name: /Categorize with AI/ }).click()
  await page.waitForURL('**/dashboard/review/**', { timeout: 120_000 })

  const row = page.locator('tr', { hasText: 'STRIPE TRANSFER ST-KQ81ZD0PA2' }).first()
  await row.click()
  await page.locator('select').filter({ has: page.locator('option[value="1100"]') }).first().selectOption('1100')
  await page.getByRole('button', { name: 'Save rule' }).click()
  await expect(row).toContainText('1100')
  await page.locator('input[type=checkbox][title="Select all"]').check()
  await page.locator('[data-bulk-bar]').getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByText('All 8 transactions reviewed!')).toBeVisible()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.getByText('All 8 transactions reviewed!')).toBeHidden()

  expect(warnings).toEqual([])
})
