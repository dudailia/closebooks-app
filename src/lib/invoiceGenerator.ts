import type { Invoice, InvoiceLineItem, RateCard, EngagementLetter } from '@/types/billing'
import type { CategorizationJob } from '@/types'

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function generateInvoiceFromJob(
  job: CategorizationJob,
  rateCard: RateCard,
  firmName: string
): Invoice {
  const now = new Date()
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + 30)

  const lineItems: InvoiceLineItem[] = []

  // Line item 1: transaction review
  const txTotal = job.total_transactions * rateCard.perTransaction
  lineItems.push({
    id: `li-${Date.now()}-1`,
    description: `Transaction review & categorization — ${job.total_transactions} transactions`,
    quantity: job.total_transactions,
    unitPrice: rateCard.perTransaction,
    total: txTotal,
    type: 'close',
  })

  // Line item 2: report generation if there are flagged items
  let reportTotal = 0
  if (job.flagged > 0 || job.status === 'completed') {
    reportTotal = rateCard.reportFee
    lineItems.push({
      id: `li-${Date.now()}-2`,
      description: 'Close report generation',
      quantity: 1,
      unitPrice: rateCard.reportFee,
      total: rateCard.reportFee,
      type: 'report',
    })
  }

  let subtotal = lineItems.reduce((sum, li) => sum + li.total, 0)

  // Minimum engagement
  if (subtotal < rateCard.minimumEngagement) {
    const diff = rateCard.minimumEngagement - subtotal
    lineItems.push({
      id: `li-${Date.now()}-3`,
      description: 'Minimum engagement fee',
      quantity: 1,
      unitPrice: diff,
      total: diff,
      type: 'custom',
    })
    subtotal = rateCard.minimumEngagement
  }

  const taxAmount = rateCard.taxRate > 0 ? subtotal * rateCard.taxRate : undefined
  const total = subtotal + (taxAmount ?? 0)

  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    number: '', // caller should set via getNextInvoiceNumber()
    clientName: job.client_name,
    jobId: job.id,
    issuedDate: toYMD(now),
    dueDate: toYMD(dueDate),
    status: 'draft',
    lineItems,
    subtotal,
    taxRate: rateCard.taxRate > 0 ? rateCard.taxRate : undefined,
    taxAmount,
    total,
    firmName,
  }
}

export function getEngagementLetterTemplate(
  template: EngagementLetter['template'],
  clientName: string,
  services: string[],
  monthlyFee: number,
  startDate: string,
  firmName: string
): string {
  const firmDisplay = firmName || 'CloseBooks Accounting'
  const serviceList = services.map((s) => `  • ${s}`).join('\n')
  const formatted = new Date(startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const templateTitles: Record<EngagementLetter['template'], string> = {
    'monthly-bookkeeping': 'Monthly Bookkeeping Services Agreement',
    'tax-prep': 'Tax Preparation Services Agreement',
    'full-service': 'Full-Service Accounting Agreement',
    'custom': 'Professional Services Agreement',
  }

  const title = templateTitles[template]

  return `${title}

This engagement letter constitutes an agreement between ${firmDisplay} ("Firm") and ${clientName} ("Client"), effective ${formatted}.

SCOPE OF SERVICES

The Firm agrees to provide the following services to the Client:

${serviceList || '  • Services to be determined'}

FEES AND BILLING

Monthly Fee: $${monthlyFee.toFixed(2)}

The Client agrees to pay the monthly retainer fee on the first business day of each month. Invoices will be issued at least 5 business days prior to the due date. Payments not received within 30 days of the due date are subject to a late fee of 1.5% per month.

TERM AND TERMINATION

This agreement commences on ${formatted} and continues on a month-to-month basis unless otherwise specified. Either party may terminate this agreement with 30 days' written notice.

CLIENT RESPONSIBILITIES

The Client agrees to:
  • Provide timely access to all financial records, bank statements, and supporting documents
  • Respond to inquiries from the Firm within 5 business days
  • Notify the Firm of any significant changes in business operations or financial activity
  • Review and approve all work product within the agreed timeframe

FIRM RESPONSIBILITIES

The Firm agrees to:
  • Perform all services with professional care and diligence
  • Maintain confidentiality of all Client financial information
  • Provide timely communication regarding the status of work
  • Maintain appropriate professional liability insurance

CONFIDENTIALITY

Both parties agree to maintain strict confidentiality of all information shared during this engagement. The Firm will not disclose any Client financial information to third parties without written consent, except as required by law.

LIMITATION OF LIABILITY

The Firm's liability to the Client shall be limited to the fees paid in the twelve (12) months preceding the claim. The Firm shall not be liable for any indirect, incidental, or consequential damages.

GOVERNING LAW

This agreement shall be governed by the laws of the state in which the Firm is incorporated, without regard to conflicts of law principles.

ENTIRE AGREEMENT

This engagement letter constitutes the entire agreement between the parties and supersedes all prior discussions, representations, and agreements.

─────────────────────────────────────────────────────────

CLIENT SIGNATURE

By signing below, the Client agrees to the terms and conditions set forth in this engagement letter.

Client Name: ___________________________________

Authorized Signature: ___________________________

Title: _________________________________________

Date: _________________________________________


FIRM SIGNATURE

${firmDisplay}

Authorized Signature: ___________________________

Title: _________________________________________

Date: _________________________________________
`
}

export function getPricingInsight(
  rateCard: RateCard,
  txCount: number
): string | null {
  if (txCount <= 0) return null

  let low: number
  let high: number
  let label: string

  if (txCount < 20) {
    low = 200; high = 350; label = 'small'
  } else if (txCount <= 50) {
    low = 400; high = 700; label = 'mid-size'
  } else if (txCount <= 100) {
    low = 700; high = 1200; label = 'large'
  } else {
    low = 1200; high = 2500; label = 'high-volume'
  }

  return `Industry average for ${txCount}-transaction close (${label}): $${low.toLocaleString()}–$${high.toLocaleString()}`
}
