export type InboxStatus = 'unread' | 'read' | 'archived'
export type DocumentType = 'receipt' | 'invoice' | 'statement' | 'csv' | 'unknown'
export type MatchMethod = 'subaddress' | 'email_exact' | 'subject_fuzzy' | 'unassigned'

export interface InboxAttachment {
  id: string
  emailId: string
  firmId: string
  fileName: string
  mimeType: string | null
  sizeBytes: number | null
  storagePath: string | null
  documentType: DocumentType
  extractedData: ExtractedDocumentData | null
  vaultDocId: string | null
  processedAt: string | null
  createdAt: string
}

export interface ExtractedDocumentData {
  merchantName?: string
  amount?: number
  date?: string
  invoiceNumber?: string
  dueDate?: string
  lineItems?: Array<{ description: string; amount: number }>
  tax?: number
  transactions?: Array<{ date: string; description: string; amount: number }>
  categoryHint?: string
  confidence: number
}

export interface InboxEmail {
  id: string
  firmId: string
  messageId: string | null
  fromEmail: string
  fromName: string | null
  subject: string | null
  bodyText: string | null
  bodyHtml: string | null
  receivedAt: string
  clientId: string | null
  clientName: string | null
  matchMethod: MatchMethod | null
  status: InboxStatus
  attachmentCount: number
  docRequestId: string | null
  attachments?: InboxAttachment[]
}

// Postmark inbound webhook payload
export interface PostmarkInboundPayload {
  From?: string
  FromFull?: { Email: string; Name: string }
  To?: string
  ToFull?: Array<{ Email: string; Name: string }>
  Subject?: string
  TextBody?: string
  HtmlBody?: string
  Attachments?: Array<{
    Name: string
    Content: string       // base64
    ContentType: string
    ContentLength: number
  }>
  MessageID?: string
  Date?: string
  ReplyTo?: string
  Headers?: Array<{ Name: string; Value: string }>
}
