import type { AdvisoryMemo } from '@/types/advisory'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

let _memos: AdvisoryMemo[] = []

export async function hydrateAdvisory(supabase: SupabaseClient, firmId: string): Promise<void> {
  _memos = await loadPayloadRows<AdvisoryMemo>(supabase, 'advisory_memos', firmId)
}

async function persist(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const m of _memos) {
    await upsertPayloadRow(ctx.supabase, 'advisory_memos', ctx.firmId, m.id, m as unknown as Record<string, unknown>)
  }
}

export function saveAdvisoryMemo(memo: AdvisoryMemo): void {
  _memos = _memos.filter((m) => m.id !== memo.id)
  _memos.unshift(memo)
  void persist()
}

export function getAdvisoryMemos(): AdvisoryMemo[] {
  return _memos
}

export function getAdvisoryMemosForClient(clientName: string): AdvisoryMemo[] {
  const lower = clientName.toLowerCase()
  return _memos.filter((m) => m.clientName.toLowerCase() === lower)
}

export function getAdvisoryMemo(id: string): AdvisoryMemo | null {
  return _memos.find((m) => m.id === id) ?? null
}

export function updateAdvisoryMemoStatus(id: string, status: AdvisoryMemo['status']): void {
  const idx = _memos.findIndex((m) => m.id === id)
  if (idx < 0) return
  _memos[idx] = {
    ..._memos[idx],
    status,
    ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}),
  }
  void persist()
}

export function deleteAdvisoryMemo(id: string): void {
  _memos = _memos.filter((m) => m.id !== id)
  void (async () => {
    const ctx = await getSupabaseAndFirm()
    if (ctx) await deletePayloadRow(ctx.supabase, 'advisory_memos', ctx.firmId, id)
  })()
}
