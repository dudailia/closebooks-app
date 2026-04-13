/**
 * Document request checklists — Supabase-backed (document_requests JSON rows).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

export type RequestStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export interface DocRequestItem {
  id: string
  label: string
  description?: string
  required: boolean
  status: RequestStatus
  submittedAt?: string
  fileNames?: string[]
}

export interface DocRequest {
  id: string
  clientName: string
  title: string
  dueDate?: string
  items: DocRequestItem[]
  createdAt: string
  completedAt?: string
  shareToken: string
  status: 'open' | 'complete' | 'overdue'
}

let _requests: DocRequest[] = []

export async function hydrateDocumentRequests(supabase: SupabaseClient, firmId: string): Promise<void> {
  _requests = await loadPayloadRows<DocRequest>(supabase, 'document_requests', firmId)
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const r of _requests) {
    await upsertPayloadRow(ctx.supabase, 'document_requests', ctx.firmId, r.id, r as unknown as Record<string, unknown>)
  }
}

function makeToken(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function makeId(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function getDocRequests(): DocRequest[] {
  return _requests
}

export function getDocRequestsForClient(clientName: string): DocRequest[] {
  return _requests.filter((r) => r.clientName === clientName)
}

export function createDocRequest(
  clientName: string,
  title: string,
  items: Omit<DocRequestItem, 'id' | 'status'>[],
  dueDate?: string
): DocRequest {
  const request: DocRequest = {
    id: makeId(),
    clientName,
    title,
    dueDate,
    items: items.map((item) => ({ ...item, id: makeId(), status: 'pending' as RequestStatus })),
    createdAt: new Date().toISOString(),
    shareToken: makeToken(),
    status: 'open',
  }
  _requests.unshift(request)
  void persist()
  return request
}

export function updateItemStatus(requestId: string, itemId: string, status: RequestStatus): void {
  const req = _requests.find((r) => r.id === requestId)
  if (!req) return
  const item = req.items.find((i) => i.id === itemId)
  if (!item) return
  item.status = status
  if (status === 'submitted') item.submittedAt = new Date().toISOString()
  const allDone = req.items
    .filter((i) => i.required)
    .every((i) => i.status === 'approved' || i.status === 'submitted')
  if (allDone) {
    req.status = 'complete'
    req.completedAt = new Date().toISOString()
  }
  void persist()
}

export function deleteDocRequest(id: string): void {
  _requests = _requests.filter((r) => r.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'document_requests', ctx.firmId, id)
  })()
}

export const STANDARD_TEMPLATES = {
  'Monthly Close': [
    { label: 'Bank statements', description: 'All checking and savings accounts', required: true },
    { label: 'Credit card statements', description: 'All business credit cards', required: true },
    { label: 'Receipts over $500', description: 'Any single purchase over $500', required: true },
    { label: 'Payroll records', description: 'Gusto/ADP payroll summary', required: false },
  ],
  'Tax Preparation': [
    { label: 'Prior year tax return', description: 'Most recent filed return', required: true },
    { label: 'W-2s / 1099s received', description: 'All income documents', required: true },
    { label: 'Business expense receipts', description: 'All deductible expenses', required: true },
    { label: 'Home office documentation', description: 'If applicable', required: false },
    { label: 'Vehicle mileage log', description: 'If claiming vehicle deduction', required: false },
  ],
  'Year-End Review': [
    { label: 'December bank statements', description: 'All accounts', required: true },
    { label: 'Asset purchase records', description: 'Any equipment purchased this year', required: true },
    { label: 'Loan statements', description: 'Year-end balances for all loans', required: true },
    { label: 'Inventory count', description: 'If applicable', required: false },
  ],
}
