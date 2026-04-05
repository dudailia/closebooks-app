import type { ChatMessage } from '@/types'

const KEY_PREFIX = 'closebooks_chat_'
const MAX_MESSAGES = 30

export function loadChatHistory(jobId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem(`${KEY_PREFIX}${jobId}`) ?? '[]') as ChatMessage[]
  } catch {
    return []
  }
}

export function saveChatHistory(jobId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      `${KEY_PREFIX}${jobId}`,
      JSON.stringify(messages.slice(-MAX_MESSAGES))
    )
  } catch {
    // sessionStorage full — silently ignore
  }
}

export function clearChatHistory(jobId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(`${KEY_PREFIX}${jobId}`)
}
