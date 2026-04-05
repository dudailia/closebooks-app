import type { Invoice, EngagementLetter, RateCard } from '@/types/billing'

const INVOICES_KEY = 'cb_invoices'
const LETTERS_KEY = 'cb_engagement_letters'
const RATE_CARD_KEY = 'cb_rate_card'

// ─────────────────────────────────────────────────────────────────────────────
// Invoices
// ─────────────────────────────────────────────────────────────────────────────

export function getInvoices(): Invoice[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(INVOICES_KEY) ?? '[]') as Invoice[]
  } catch {
    return []
  }
}

export function getInvoicesForClient(clientName: string): Invoice[] {
  const lower = clientName.toLowerCase()
  return getInvoices().filter((inv) => inv.clientName.toLowerCase() === lower)
}

export function getInvoice(id: string): Invoice | null {
  return getInvoices().find((inv) => inv.id === id) ?? null
}

export function saveInvoice(invoice: Invoice): void {
  if (typeof window === 'undefined') return
  const invoices = getInvoices()
  const idx = invoices.findIndex((inv) => inv.id === invoice.id)
  if (idx >= 0) invoices[idx] = invoice
  else invoices.unshift(invoice)
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
}

export function updateInvoiceStatus(
  id: string,
  status: Invoice['status'],
  paidAt?: string
): void {
  if (typeof window === 'undefined') return
  const invoices = getInvoices()
  const idx = invoices.findIndex((inv) => inv.id === id)
  if (idx < 0) return
  invoices[idx] = { ...invoices[idx], status, ...(paidAt ? { paidAt } : {}) }
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
}

export function deleteInvoice(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(INVOICES_KEY, JSON.stringify(getInvoices().filter((inv) => inv.id !== id)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Engagement Letters
// ─────────────────────────────────────────────────────────────────────────────

export function getEngagementLetters(): EngagementLetter[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LETTERS_KEY) ?? '[]') as EngagementLetter[]
  } catch {
    return []
  }
}

export function getEngagementLetter(id: string): EngagementLetter | null {
  return getEngagementLetters().find((l) => l.id === id) ?? null
}

export function saveEngagementLetter(letter: EngagementLetter): void {
  if (typeof window === 'undefined') return
  const letters = getEngagementLetters()
  const idx = letters.findIndex((l) => l.id === letter.id)
  if (idx >= 0) letters[idx] = letter
  else letters.unshift(letter)
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters))
}

export function updateEngagementLetterStatus(
  id: string,
  status: EngagementLetter['status']
): void {
  if (typeof window === 'undefined') return
  const letters = getEngagementLetters()
  const idx = letters.findIndex((l) => l.id === id)
  if (idx < 0) return
  const now = new Date().toISOString()
  letters[idx] = {
    ...letters[idx],
    status,
    ...(status === 'sent' ? { sentAt: now } : {}),
    ...(status === 'signed' ? { signedAt: now } : {}),
  }
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters))
}

export function deleteEngagementLetter(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LETTERS_KEY, JSON.stringify(getEngagementLetters().filter((l) => l.id !== id)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate Card
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_RATE_CARD: RateCard = {
  perTransaction: 18,
  monthlyRetainer: 0,
  reportFee: 45,
  advisoryHourly: 150,
  minimumEngagement: 200,
  taxRate: 0,
}

export function loadRateCard(): RateCard {
  if (typeof window === 'undefined') return { ...DEFAULT_RATE_CARD }
  try {
    const raw = localStorage.getItem(RATE_CARD_KEY)
    if (!raw) return { ...DEFAULT_RATE_CARD }
    return { ...DEFAULT_RATE_CARD, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_RATE_CARD }
  }
}

export function saveRateCard(rc: RateCard): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RATE_CARD_KEY, JSON.stringify(rc))
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice number
// ─────────────────────────────────────────────────────────────────────────────

export function getNextInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const invoices = getInvoices()
  const yearPrefix = `INV-${year}-`
  const thisYearNums = invoices
    .map((inv) => inv.number)
    .filter((n) => n.startsWith(yearPrefix))
    .map((n) => parseInt(n.replace(yearPrefix, ''), 10))
    .filter((n) => !isNaN(n))
  const next = thisYearNums.length > 0 ? Math.max(...thisYearNums) + 1 : 1
  return `${yearPrefix}${String(next).padStart(4, '0')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

export function getBillingStats(): {
  totalInvoiced: number
  outstanding: number
  overdue: number
  paidYTD: number
} {
  const invoices = getInvoices()
  const currentYear = new Date().getFullYear().toString()

  let totalInvoiced = 0
  let outstanding = 0
  let overdue = 0
  let paidYTD = 0

  for (const inv of invoices) {
    totalInvoiced += inv.total
    if (inv.status === 'sent') outstanding += inv.total
    if (inv.status === 'overdue') {
      outstanding += inv.total
      overdue += inv.total
    }
    if (inv.status === 'paid' && inv.paidAt && inv.paidAt.startsWith(currentYear)) {
      paidYTD += inv.total
    }
  }

  return { totalInvoiced, outstanding, overdue, paidYTD }
}
