/**
 * Per-job close chat — in-memory for the browser session (no persistence).
 */

import type { ChatMessage } from '@/types'

const store = new Map<string, ChatMessage[]>()

const KEY_PREFIX = 'closechat_'

export function loadChatHistory(jobId: string): ChatMessage[] {
  return store.get(`${KEY_PREFIX}${jobId}`) ?? []
}

export function saveChatHistory(jobId: string, messages: ChatMessage[]): void {
  store.set(`${KEY_PREFIX}${jobId}`, messages)
}

export function clearChatHistory(jobId: string): void {
  store.delete(`${KEY_PREFIX}${jobId}`)
}
