import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The newest subscription row for the firm this user owns.
 *
 * Subscriptions are matched by firm, never by email: an email match let
 * whoever signed up first with a checkout email (email confirmation is off
 * for the demo) take over that subscription and its Stripe billing portal
 * (docs/engine/rls-audit.md, F8). The firm id comes from checkout metadata,
 * which the server sets from the signed-in user's firm
 * (src/app/api/stripe/checkout/route.ts), and the webhook stores it.
 *
 * Returns `{ data: null }` when the user owns no firm or the firm has no row,
 * the same shape as a Supabase `.maybeSingle()` query.
 */
export async function latestFirmSubscription(
  supabase: Pick<SupabaseClient, 'from'>,
  userId: string,
  columns: string,
): Promise<{ data: Record<string, unknown> | null }> {
  const { data: firm } = await supabase.from('firms').select('id').eq('owner_id', userId).maybeSingle()
  if (!firm?.id) return { data: null }
  const { data } = await supabase
    .from('subscriptions')
    .select(columns)
    .eq('firm_id', firm.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return { data: (data as Record<string, unknown> | null) ?? null }
}
