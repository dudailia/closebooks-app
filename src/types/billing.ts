export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  type: 'close' | 'advisory' | 'tax' | 'report' | 'custom'
}

export interface Invoice {
  id: string
  number: string        // e.g. "INV-2024-0047"
  clientName: string
  jobId?: string
  issuedDate: string    // YYYY-MM-DD
  dueDate: string       // YYYY-MM-DD
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRate?: number      // e.g. 0.0875 for 8.75%
  taxAmount?: number
  total: number
  notes?: string
  paidAt?: string
  sentAt?: string
  firmName?: string
}

export interface EngagementLetter {
  id: string
  clientName: string
  clientEmail?: string
  createdAt: string
  status: 'draft' | 'sent' | 'signed'
  template: 'monthly-bookkeeping' | 'tax-prep' | 'full-service' | 'custom'
  services: string[]
  monthlyFee: number
  startDate: string
  endDate?: string
  termsText: string
  sentAt?: string
  signedAt?: string
  firmName?: string
}

export interface RateCard {
  perTransaction: number       // default 18
  monthlyRetainer: number      // default 0
  reportFee: number            // default 45
  advisoryHourly: number       // default 150
  minimumEngagement: number    // default 200
  taxRate: number              // default 0
}
