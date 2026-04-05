import type { VaultDocument, DocumentRequest } from '@/types/vault'

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const DOCS_KEY     = 'cb_vault_documents'
const REQUESTS_KEY = 'cb_document_requests'

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export function getDocuments(): VaultDocument[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(DOCS_KEY) ?? '[]') as VaultDocument[]
  } catch {
    return []
  }
}

export function getDocumentsForClient(clientName: string): VaultDocument[] {
  const lower = clientName.toLowerCase()
  return getDocuments().filter((d) => d.clientName.toLowerCase() === lower)
}

export function getDocumentsForJob(jobId: string): VaultDocument[] {
  return getDocuments().filter((d) => d.jobId === jobId)
}

export function saveDocument(doc: VaultDocument): void {
  if (typeof window === 'undefined') return
  const docs = getDocuments()
  const idx  = docs.findIndex((d) => d.id === doc.id)
  if (idx >= 0) docs[idx] = doc
  else docs.unshift(doc)
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs))
}

export function deleteDocument(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DOCS_KEY, JSON.stringify(getDocuments().filter((d) => d.id !== id)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Requests
// ─────────────────────────────────────────────────────────────────────────────

export function getDocumentRequests(): DocumentRequest[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) ?? '[]') as DocumentRequest[]
  } catch {
    return []
  }
}

export function getRequestsForClient(clientName: string): DocumentRequest[] {
  const lower = clientName.toLowerCase()
  return getDocumentRequests().filter((r) => r.clientName.toLowerCase() === lower)
}

export function getRequestByToken(token: string): DocumentRequest | null {
  return getDocumentRequests().find((r) => r.portalToken === token) ?? null
}

export function saveDocumentRequest(req: DocumentRequest): void {
  if (typeof window === 'undefined') return
  const reqs = getDocumentRequests()
  const idx  = reqs.findIndex((r) => r.id === req.id)
  if (idx >= 0) reqs[idx] = req
  else reqs.unshift(req)
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs))
}

export function updateRequestStatus(id: string, status: DocumentRequest['status']): void {
  if (typeof window === 'undefined') return
  const reqs = getDocumentRequests()
  const req  = reqs.find((r) => r.id === id)
  if (req) {
    req.status = status
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs))
  }
}

export function fulfillRequest(requestId: string, docId: string): void {
  if (typeof window === 'undefined') return
  const reqs = getDocumentRequests()
  const req  = reqs.find((r) => r.id === requestId)
  if (req) {
    if (!req.fulfillmentIds.includes(docId)) {
      req.fulfillmentIds.push(docId)
    }
    // Auto-update status
    if (req.fulfillmentIds.length >= req.requestedItems.length) {
      req.status = 'complete'
    } else if (req.fulfillmentIds.length > 0) {
      req.status = 'partial'
    }
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(reqs))
  }
}

export function deleteDocumentRequest(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(getDocumentRequests().filter((r) => r.id !== id)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

export function getVaultStats(): {
  totalDocuments: number
  totalClients: number
  pendingRequests: number
  documentsThisMonth: number
} {
  const docs     = getDocuments()
  const requests = getDocumentRequests()
  const now      = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const uniqueClients = new Set(docs.map((d) => d.clientName.toLowerCase()))

  return {
    totalDocuments:     docs.length,
    totalClients:       uniqueClients.size,
    pendingRequests:    requests.filter((r) => r.status === 'pending').length,
    documentsThisMonth: docs.filter((d) => d.uploadedAt.startsWith(thisMonth)).length,
  }
}
