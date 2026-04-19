export interface PortalSession {
  tokenId: string
  token: string
  firmId: string
  clientId: string
  clientName: string
  clientEmail?: string
  permissions: string[]
  firmName: string
  accentColor: string
  expiresAt: string
}

export interface PortalDocument {
  id: string
  firmId: string
  clientId: string
  name: string
  category: 'receipt' | 'invoice' | 'statement' | 'tax' | 'other'
  status: 'requested' | 'uploaded' | 'reviewed'
  storagePath?: string
  fileSize?: number
  mimeType?: string
  requestedNote?: string
  uploadedAt?: string
  reviewedAt?: string
  createdAt: string
}

export interface PortalMessage {
  id: string
  firmId: string
  clientId: string
  sender: 'firm' | 'client'
  content: string
  attachmentPath?: string
  attachmentName?: string
  readAt?: string
  createdAt: string
}

export interface PortalActionItem {
  id: string
  firmId: string
  clientId: string
  title: string
  description?: string
  dueDate?: string
  completedAt?: string
  attachmentPath?: string
  createdAt: string
}

export interface PortalToken {
  id: string
  token: string
  firmId: string
  clientId: string
  clientName: string
  clientEmail?: string
  permissions: string[]
  expiresAt: string
  lastAccessedAt?: string
  createdAt: string
}
