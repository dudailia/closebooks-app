import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAndFirm } from '@/lib/syncSupabase'

let _apiKey = ''
let _webhook = ''

export async function hydrateDeveloper(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('developer_settings').select('api_key, webhook_url').eq('firm_id', firmId).maybeSingle()
  _apiKey = data?.api_key ?? ''
  _webhook = data?.webhook_url ?? ''
}

export function getDeveloperApiKey(): string {
  return _apiKey
}

export function getDeveloperWebhook(): string {
  return _webhook
}

export async function saveDeveloperSettings(apiKey: string, webhookUrl: string): Promise<void> {
  _apiKey = apiKey
  _webhook = webhookUrl
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('developer_settings').upsert({
    firm_id: ctx.firmId,
    api_key: apiKey,
    webhook_url: webhookUrl,
  }, { onConflict: 'firm_id' })
}
