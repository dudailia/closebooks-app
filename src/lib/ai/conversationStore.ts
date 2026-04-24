import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import { loadPayloadRows, upsertPayloadRow, deletePayloadRow } from '@/lib/supabaseJsonTable'

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actionSummary?: string
}

export interface AiConversation {
  id: string
  title: string
  messages: AiMessage[]
  clientId?: string
  jobId?: string
  updatedAt: string
}

export async function listConversations(
  supabase: SupabaseClient,
  firmId: string
): Promise<AiConversation[]> {
  const rows = await loadPayloadRows<AiConversation>(supabase, 'ai_conversations', firmId)
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function saveConversation(conv: AiConversation): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await upsertPayloadRow(
    ctx.supabase,
    'ai_conversations',
    ctx.firmId,
    conv.id,
    conv as unknown as Record<string, unknown>
  )
}

export async function deleteConversation(id: string): Promise<void> {
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await deletePayloadRow(ctx.supabase, 'ai_conversations', ctx.firmId, id)
}
