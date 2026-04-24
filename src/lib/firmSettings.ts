import { getSupabaseAndFirm } from '@/lib/syncSupabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface FirmSettings {
  firmName: string
  firmTagline: string
  accentColor: string
  preparedBy: string
  inboxSlug: string
  /** Product tour dismissed — stored in firm_settings payload */
  onboardingComplete?: boolean
  /** Client-facing branding (used by monthly-report email + portal) */
  logoUrl?: string
  primaryColor?: string
  emailFromName?: string
  emailReplyTo?: string
  clientFacingName?: string
}

const DEFAULTS: FirmSettings = {
  firmName: '',
  firmTagline: 'Certified Public Accountants',
  accentColor: '#2d5a27',
  preparedBy: '',
  inboxSlug: '',
  onboardingComplete: false,
  primaryColor: '#2d5a27',
}

let _cache: FirmSettings = { ...DEFAULTS }

export function getFirmSettingsCache(): FirmSettings {
  return { ..._cache }
}

export async function hydrateFirmSettings(supabase: SupabaseClient, firmId: string): Promise<void> {
  const { data } = await supabase.from('firm_settings').select('payload').eq('firm_id', firmId).maybeSingle()
  if (data?.payload && typeof data.payload === 'object') {
    _cache = { ...DEFAULTS, ...(data.payload as FirmSettings) }
  } else {
    _cache = { ...DEFAULTS }
  }
}

export function loadFirmSettings(): FirmSettings {
  return { ..._cache }
}

export async function saveFirmSettings(settings: FirmSettings): Promise<void> {
  _cache = { ...settings }
  const ctx = await getSupabaseAndFirm()
  if (!ctx) return
  await ctx.supabase.from('firm_settings').upsert(
    { firm_id: ctx.firmId, payload: settings },
    { onConflict: 'firm_id' }
  )
}
