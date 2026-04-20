import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ActionCardType, ActionCardPayload,
  JournalEntryPayload, RecategorizePayload, FlagPayload,
  ClientEmailPayload, DocumentRequestPayload,
} from './types'

export async function executeAction(
  type: ActionCardType,
  payload: ActionCardPayload,
  clientId: string,
  supabase: SupabaseClient,
): Promise<void> {
  const { data: clientRow } = await supabase
    .from('clients')
    .select('firm_id, business_name')
    .eq('id', clientId)
    .maybeSingle()

  if (!clientRow) throw new Error('Client not found')
  const firmId      = (clientRow as { firm_id: string }).firm_id
  const clientName  = (clientRow as { business_name: string }).business_name

  switch (type) {
    case 'journal_entry': {
      const p = payload as JournalEntryPayload
      const { error } = await supabase.from('journal_entries').insert({
        firm_id:    firmId,
        client_id:  clientId,
        date:       p.date,
        memo:       p.memo,
        status:     'posted',
        lines:      p.lines,
        created_by: 'copilot',
        posted_at:  new Date().toISOString(),
      })
      if (error) throw new Error(error.message)
      break
    }

    case 'recategorize': {
      const p = payload as RecategorizePayload
      const { error } = await supabase
        .from('transactions')
        .update({ final_category: p.newCategory, final_account_code: p.newAccountCode, status: 'edited' })
        .in('id', p.transactionIds)
      if (error) throw new Error(error.message)
      break
    }

    case 'flag': {
      const p = payload as FlagPayload
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'flagged', notes: p.reason })
        .in('id', p.transactionIds)
      if (error) throw new Error(error.message)
      break
    }

    case 'client_email': {
      const p = payload as ClientEmailPayload
      const { error } = await supabase.from('firm_messages').insert({
        id:               crypto.randomUUID(),
        firm_id:          firmId,
        client_id:        clientId,
        client_name:      clientName,
        thread_id:        `copilot-${Date.now()}`,
        sender_type:      'firm',
        direction:        'outbound',
        content:          `**${p.subject}**\n\n${p.body}`,
        message_type:     'message',
        attachment_names: [],
      })
      if (error) throw new Error(error.message)
      break
    }

    case 'document_request': {
      const p = payload as DocumentRequestPayload
      const { error } = await supabase.from('compliance_tasks').insert({
        id:          crypto.randomUUID(),
        firm_id:     firmId,
        client_id:   clientId,
        client_name: clientName,
        task_type:   'document_request',
        title:       `Document request: ${p.items.join(', ')}`,
        status:      'open',
        due_date:    p.dueDate ?? null,
      })
      if (error) throw new Error(error.message)
      break
    }

    default:
      throw new Error(`Unknown action type: ${type}`)
  }
}
