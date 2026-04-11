/**
 * Secure in-app messaging per client.
 * Replaces disjointed email threads.
 * Messages are stored locally and can be exported.
 */

const KEY = 'cb_client_messages'

export interface ClientMessage {
  id: string
  clientName: string
  direction: 'outbound' | 'inbound'
  content: string
  sentAt: string
  readAt?: string
  attachmentNames?: string[]
  type: 'message' | 'document_request' | 'close_summary' | 'alert'
}

function load(): ClientMessage[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function save(msgs: ClientMessage[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(msgs.slice(0, 500)))
}

export function getMessagesForClient(clientName: string): ClientMessage[] {
  return load().filter(m => m.clientName === clientName).sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  )
}

export function getAllThreads(): { clientName: string; lastMessage: ClientMessage; unread: number }[] {
  const msgs = load()
  const threads = new Map<string, ClientMessage[]>()
  for (const msg of msgs) {
    const list = threads.get(msg.clientName) ?? []
    list.push(msg)
    threads.set(msg.clientName, list)
  }
  return Array.from(threads.entries()).map(([clientName, messages]) => {
    const sorted = messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    const unread = sorted.filter(m => m.direction === 'inbound' && !m.readAt).length
    return { clientName, lastMessage: sorted[0], unread }
  }).sort((a, b) => new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime())
}

export function sendMessage(
  clientName: string,
  content: string,
  type: ClientMessage['type'] = 'message',
  attachmentNames?: string[]
): ClientMessage {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  const msg: ClientMessage = {
    id,
    clientName,
    direction: 'outbound',
    content,
    sentAt: new Date().toISOString(),
    type,
    ...(attachmentNames ? { attachmentNames } : {}),
  }
  const msgs = load()
  msgs.unshift(msg)
  save(msgs)
  return msg
}

export function markRead(clientName: string) {
  const msgs = load()
  const now = new Date().toISOString()
  msgs.forEach(m => {
    if (m.clientName === clientName && m.direction === 'inbound' && !m.readAt) {
      m.readAt = now
    }
  })
  save(msgs)
}

export function getTotalUnread(): number {
  return load().filter(m => m.direction === 'inbound' && !m.readAt).length
}

// Seed a welcome message when a client is first created
export function seedWelcomeMessage(clientName: string) {
  const existing = load().filter(m => m.clientName === clientName)
  if (existing.length > 0) return
  const msgs = load()
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  msgs.unshift({
    id,
    clientName,
    direction: 'outbound',
    content: `Hi! I've set up your CloseBooks client profile. I'll use this thread to share monthly close summaries, document requests, and any questions that come up. Feel free to reply here anytime.`,
    sentAt: new Date().toISOString(),
    type: 'message',
  })
  save(msgs)
}
