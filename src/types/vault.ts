export type DocumentFileType =
  | 'bank-statement'
  | 'tax-return'
  | 'report'
  | 'receipt'
  | 'engagement-letter'
  | 'payroll'
  | 'other'

export interface VaultDocument {
  id: string
  clientName: string
  jobId?: string
  fileName: string
  fileSize: number        // bytes
  fileType: DocumentFileType
  mimeType?: string
  uploadedAt: string      // ISO
  uploadedBy: 'firm' | 'client'
  tags: string[]
  notes?: string
  requestId?: string      // linked DocumentRequest id
}

export interface DocumentRequest {
  id: string
  clientName: string
  jobId?: string
  requestedAt: string
  requestedItems: string[]    // ["March bank statement", "Payroll summary Q1"]
  status: 'pending' | 'partial' | 'complete'
  dueDate?: string
  portalToken: string         // random token for the portal URL
  fulfillmentIds: string[]    // VaultDocument ids
  reminderSentAt?: string
  notes?: string
}
