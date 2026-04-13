import type { VaultDocument, DocumentRequest } from '@/types/vault'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

let _docs: VaultDocument[] = []
let _reqs: DocumentRequest[] = []

export async function hydrateVault(supabase: SupabaseClient, firmId: string): Promise<void> {
  _docs = await loadPayloadRows<VaultDocument>(supabase, 'vault_documents', firmId)
  _reqs = await loadPayloadRows<DocumentRequest>(supabase, 'vault_document_requests', firmId)
}

async function persistDocs(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const d of _docs) {
    await upsertPayloadRow(ctx.supabase, 'vault_documents', ctx.firmId, d.id, d as unknown as Record<string, unknown>)
  }
}

async function persistReqs(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const r of _reqs) {
    await upsertPayloadRow(ctx.supabase, 'vault_document_requests', ctx.firmId, r.id, r as unknown as Record<string, unknown>)
  }
}

export function getDocuments(): VaultDocument[] {
  return _docs
}

export function getDocumentsForClient(clientName: string): VaultDocument[] {
  const lower = clientName.toLowerCase()
  return _docs.filter((d) => d.clientName.toLowerCase() === lower)
}

export function getDocumentsForJob(jobId: string): VaultDocument[] {
  return _docs.filter((d) => d.jobId === jobId)
}

export function saveDocument(doc: VaultDocument): void {
  const idx = _docs.findIndex((d) => d.id === doc.id)
  if (idx >= 0) _docs[idx] = doc
  else _docs.unshift(doc)
  void persistDocs()
}

export function deleteDocument(id: string): void {
  _docs = _docs.filter((d) => d.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'vault_documents', ctx.firmId, id)
  })()
}

export function getDocumentRequests(): DocumentRequest[] {
  return _reqs
}

export function getRequestsForClient(clientName: string): DocumentRequest[] {
  const lower = clientName.toLowerCase()
  return _reqs.filter((r) => r.clientName.toLowerCase() === lower)
}

export function getRequestByToken(token: string): DocumentRequest | null {
  return _reqs.find((r) => r.portalToken === token) ?? null
}

export function saveDocumentRequest(req: DocumentRequest): void {
  const idx = _reqs.findIndex((r) => r.id === req.id)
  if (idx >= 0) _reqs[idx] = req
  else _reqs.unshift(req)
  void persistReqs()
}

export function updateRequestStatus(id: string, status: DocumentRequest['status']): void {
  const req = _reqs.find((r) => r.id === id)
  if (req) {
    req.status = status
    void persistReqs()
  }
}

export function fulfillRequest(requestId: string, docId: string): void {
  const req = _reqs.find((r) => r.id === requestId)
  if (req) {
    if (!req.fulfillmentIds.includes(docId)) req.fulfillmentIds.push(docId)
    if (req.fulfillmentIds.length >= req.requestedItems.length) req.status = 'complete'
    else if (req.fulfillmentIds.length > 0) req.status = 'partial'
    void persistReqs()
  }
}

export function deleteDocumentRequest(id: string): void {
  _reqs = _reqs.filter((r) => r.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'vault_document_requests', ctx.firmId, id)
  })()
}

export function getVaultStats(): {
  totalDocuments: number
  totalClients: number
  pendingRequests: number
  documentsThisMonth: number
} {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const uniqueClients = new Set(_docs.map((d) => d.clientName.toLowerCase()))
  return {
    totalDocuments: _docs.length,
    totalClients: uniqueClients.size,
    pendingRequests: _reqs.filter((r) => r.status === 'pending').length,
    documentsThisMonth: _docs.filter((d) => d.uploadedAt.startsWith(thisMonth)).length,
  }
}
