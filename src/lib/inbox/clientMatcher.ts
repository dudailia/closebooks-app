import type { SupabaseClient } from '@supabase/supabase-js'
import type { MatchMethod } from './types'

export interface MatchResult {
  clientId: string | null
  clientName: string | null
  matchMethod: MatchMethod
}

// Extract slug from Postmark sub-addressing: docs+acme-corp@inbox.closebooks.app → 'acme-corp'
function extractSubaddressSlug(toAddress: string): string | null {
  const match = toAddress.match(/[^+]+\+([^@]+)@/)
  return match ? match[1].toLowerCase() : null
}

// Normalize name for fuzzy matching
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function matchSenderToClient(
  supabase: SupabaseClient,
  firmId: string,
  fromEmail: string,
  toAddress: string,
  subject: string,
): Promise<MatchResult> {

  // 1. Sub-address slug match: docs+acme@inbox.closebooks.app → find client whose slug matches
  const slug = extractSubaddressSlug(toAddress)
  if (slug) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, business_name')
      .eq('firm_id', firmId)

    const match = (clients ?? []).find(c =>
      normalize(c.business_name).startsWith(normalize(slug)) ||
      normalize(slug).startsWith(normalize(c.business_name).slice(0, 6))
    )
    if (match) return { clientId: match.id, clientName: match.business_name, matchMethod: 'subaddress' }
  }

  // 2. Exact email match: from_email in clients.contact_email
  const { data: emailMatch } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('firm_id', firmId)
    .ilike('contact_email', fromEmail)
    .maybeSingle()

  if (emailMatch) return { clientId: emailMatch.id, clientName: emailMatch.business_name, matchMethod: 'email_exact' }

  // 3. Subject fuzzy match: client name appears in subject line
  if (subject) {
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, business_name')
      .eq('firm_id', firmId)

    const subjectNorm = normalize(subject)
    const fuzzyMatch = (allClients ?? []).find(c => {
      const nameNorm = normalize(c.business_name)
      return nameNorm.length >= 4 && subjectNorm.includes(nameNorm)
    })
    if (fuzzyMatch) return { clientId: fuzzyMatch.id, clientName: fuzzyMatch.business_name, matchMethod: 'subject_fuzzy' }
  }

  return { clientId: null, clientName: null, matchMethod: 'unassigned' }
}
