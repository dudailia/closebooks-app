import type { Invoice, EngagementLetter, RateCard } from '@/types/billing'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

let _invoices: Invoice[] = []
let _letters: EngagementLetter[] = []
let _rateCard: RateCard = {
  perTransaction: 18,
  monthlyRetainer: 0,
  reportFee: 45,
  advisoryHourly: 150,
  minimumEngagement: 200,
  taxRate: 0,
}

export async function hydrateBilling(supabase: import('@supabase/supabase-js').SupabaseClient, firmId: string): Promise<void> {
  _invoices = await loadPayloadRows<Invoice>(supabase, 'invoices', firmId)
  _letters = await loadPayloadRows<EngagementLetter>(supabase, 'engagement_letters', firmId)
  const { data } = await supabase.from('rate_cards').select('payload').eq('firm_id', firmId).maybeSingle()
  if (data?.payload && typeof data.payload === 'object') {
    _rateCard = { ..._rateCard, ...(data.payload as RateCard) }
  }
}

async function persistInvoices(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const inv of _invoices) {
    await upsertPayloadRow(ctx.supabase, 'invoices', ctx.firmId, inv.id, inv as unknown as Record<string, unknown>)
  }
}

async function persistLetters(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const L of _letters) {
    await upsertPayloadRow(ctx.supabase, 'engagement_letters', ctx.firmId, L.id, L as unknown as Record<string, unknown>)
  }
}

async function persistRateCard(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('rate_cards').upsert(
    { firm_id: ctx.firmId, payload: _rateCard },
    { onConflict: 'firm_id' }
  )
}

export function getInvoices(): Invoice[] {
  return _invoices
}

export function getInvoicesForClient(clientName: string): Invoice[] {
  const lower = clientName.toLowerCase()
  return _invoices.filter((inv) => inv.clientName.toLowerCase() === lower)
}

export function getInvoice(id: string): Invoice | null {
  return _invoices.find((inv) => inv.id === id) ?? null
}

export function saveInvoice(invoice: Invoice): void {
  const idx = _invoices.findIndex((inv) => inv.id === invoice.id)
  if (idx >= 0) _invoices[idx] = invoice
  else _invoices.unshift(invoice)
  void persistInvoices()
}

export function updateInvoiceStatus(id: string, status: Invoice['status'], paidAt?: string): void {
  const idx = _invoices.findIndex((inv) => inv.id === id)
  if (idx < 0) return
  _invoices[idx] = { ..._invoices[idx], status, ...(paidAt ? { paidAt } : {}) }
  void persistInvoices()
}

export function deleteInvoice(id: string): void {
  _invoices = _invoices.filter((inv) => inv.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'invoices', ctx.firmId, id)
  })()
}

export function getEngagementLetters(): EngagementLetter[] {
  return _letters
}

export function getEngagementLetter(id: string): EngagementLetter | null {
  return _letters.find((l) => l.id === id) ?? null
}

export function saveEngagementLetter(letter: EngagementLetter): void {
  const idx = _letters.findIndex((l) => l.id === letter.id)
  if (idx >= 0) _letters[idx] = letter
  else _letters.unshift(letter)
  void persistLetters()
}

export function updateEngagementLetterStatus(id: string, status: EngagementLetter['status']): void {
  const idx = _letters.findIndex((l) => l.id === id)
  if (idx < 0) return
  const now = new Date().toISOString()
  _letters[idx] = {
    ..._letters[idx],
    status,
    ...(status === 'sent' ? { sentAt: now } : {}),
    ...(status === 'signed' ? { signedAt: now } : {}),
  }
  void persistLetters()
}

export function deleteEngagementLetter(id: string): void {
  _letters = _letters.filter((l) => l.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'engagement_letters', ctx.firmId, id)
  })()
}

export function loadRateCard(): RateCard {
  return { ..._rateCard }
}

export function saveRateCard(rc: RateCard): void {
  _rateCard = { ...rc }
  void persistRateCard()
}

export function getNextInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const yearPrefix = `INV-${year}-`
  const thisYearNums = _invoices
    .map((inv) => inv.number)
    .filter((n) => n.startsWith(yearPrefix))
    .map((n) => parseInt(n.replace(yearPrefix, ''), 10))
    .filter((n) => !isNaN(n))
  const next = thisYearNums.length > 0 ? Math.max(...thisYearNums) + 1 : 1
  return `${yearPrefix}${String(next).padStart(4, '0')}`
}

export function getBillingStats(): {
  totalInvoiced: number
  outstanding: number
  overdue: number
  paidYTD: number
} {
  const currentYear = new Date().getFullYear().toString()
  let totalInvoiced = 0
  let outstanding = 0
  let overdue = 0
  let paidYTD = 0
  for (const inv of _invoices) {
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
