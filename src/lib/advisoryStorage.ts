import type { AdvisoryMemo } from '@/types/advisory'

const KEY = 'cb_advisory_memos'

function getAll(): AdvisoryMemo[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as AdvisoryMemo[]
  } catch {
    return []
  }
}

function setAll(memos: AdvisoryMemo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(memos))
}

export function saveAdvisoryMemo(memo: AdvisoryMemo): void {
  const all = getAll().filter((m) => m.id !== memo.id)
  all.unshift(memo)
  setAll(all)
}

export function getAdvisoryMemos(): AdvisoryMemo[] {
  return getAll()
}

export function getAdvisoryMemosForClient(clientName: string): AdvisoryMemo[] {
  const lower = clientName.toLowerCase()
  return getAll().filter((m) => m.clientName.toLowerCase() === lower)
}

export function getAdvisoryMemo(id: string): AdvisoryMemo | null {
  return getAll().find((m) => m.id === id) ?? null
}

export function updateAdvisoryMemoStatus(id: string, status: AdvisoryMemo['status']): void {
  const all = getAll()
  const idx = all.findIndex((m) => m.id === id)
  if (idx < 0) return
  all[idx] = {
    ...all[idx],
    status,
    ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}),
  }
  setAll(all)
}

export function deleteAdvisoryMemo(id: string): void {
  setAll(getAll().filter((m) => m.id !== id))
}
