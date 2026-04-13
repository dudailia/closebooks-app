/**
 * In-app client messaging — `firm_messages` table.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

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

function rowToMsg(row: Record<string, unknown>): ClientMessage {
  const att = row.attachment_names as string[] | null
  return {
    id: String(row.id),
    clientName: String(row.client_name ?? ''),
    direction: row.direction === 'inbound' ? 'inbound' : 'outbound',
    content: String(row.content ?? ''),
    sentAt: String(row.created_at ?? ''),
    readAt: row.read_at ? String(row.read_at) : undefined,
    attachmentNames: Array.isArray(att) ? att : undefined,
    type: (row.message_type as ClientMessage['type']) ?? 'message',
  }
}

let _msgs: ClientMessage[] = []

export async function hydrateClientMessages(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase
    .from('firm_messages')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(500)
  _msgs = (data ?? []).map((r) => rowToMsg(r as Record<string, unknown>))
}

async function persistInsert(m: ClientMessage): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('firm_messages').upsert({
    id: m.id,
    firm_id: ctx.firmId,
    client_name: m.clientName,
    thread_id: 'default',
    sender_type: m.direction === 'outbound' ? 'firm' : 'client',
    direction: m.direction,
    content: m.content,
    message_type: m.type,
    attachment_names: m.attachmentNames ?? [],
    created_at: m.sentAt,
    read_at: m.readAt ?? null,
  })
}

async function persistUpdateRead(): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  for (const m of _msgs) {
    await ctx.supabase
      .from('firm_messages')
      .update({ read_at: m.readAt ?? null })
      .eq('id', m.id)
      .eq('firm_id', ctx.firmId)
  }
}

function load(): ClientMessage[] {
  return _msgs
}

export function getMessagesForClient(clientName: string): ClientMessage[] {
  return load()
    .filter((m) => m.clientName === clientName)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
}

export function getAllThreads(): { clientName: string; lastMessage: ClientMessage; unread: number }[] {
  const threads = new Map<string, ClientMessage[]>()
  for (const msg of load()) {
    const list = threads.get(msg.clientName) ?? []
    list.push(msg)
    threads.set(msg.clientName, list)
  }
  return Array.from(threads.entries())
    .map(([clientName, messages]) => {
      const sorted = messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      const unread = sorted.filter((m) => m.direction === 'inbound' && !m.readAt).length
      return { clientName, lastMessage: sorted[0], unread }
    })
    .sort((a, b) => new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime())
}

export function sendMessage(
  clientName: string,
  content: string,
  type: ClientMessage['type'] = 'message',
  attachmentNames?: string[]
): ClientMessage {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  const msg: ClientMessage = {
    id,
    clientName,
    direction: 'outbound',
    content,
    sentAt: new Date().toISOString(),
    type,
    ...(attachmentNames ? { attachmentNames } : {}),
  }
  _msgs.unshift(msg)
  void persistInsert(msg)
  return msg
}

export function markRead(clientName: string): void {
  const now = new Date().toISOString()
  _msgs.forEach((m) => {
    if (m.clientName === clientName && m.direction === 'inbound' && !m.readAt) {
      m.readAt = now
    }
  })
  void persistUpdateRead()
}

export function getTotalUnread(): number {
  return load().filter((m) => m.direction === 'inbound' && !m.readAt).length
}

export function seedWelcomeMessage(clientName: string): void {
  const existing = load().filter((m) => m.clientName === clientName)
  if (existing.length > 0) return
  sendMessage(
    clientName,
    `Hi! I've set up your CloseBooks client profile. I'll use this thread to share monthly close summaries, document requests, and any questions that come up. Feel free to reply here anytime.`,
    'message'
  )
}
