import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/supabase/routeAuth';
import { ConsolidationMethod, EntityGroupWithMembers, RelationshipType } from '@/lib/consolidation/types';

export const dynamic = 'force-dynamic';

async function resolveGroupAndFirm(
  req: NextRequest,
  groupId: string
): Promise<
  | { error: NextResponse }
  | { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; group: Record<string, unknown> }
> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: 'Supabase not configured' }, { status: 503 }) };

  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (firmError || !firm) {
    return { error: NextResponse.json({ error: 'Firm not found' }, { status: 404 }) };
  }

  const { data: group, error: groupError } = await supabase
    .from('entity_groups')
    .select('*')
    .eq('id', groupId)
    .eq('firm_id', firm.id)
    .single();

  if (groupError || !group) {
    return { error: NextResponse.json({ error: 'Group not found' }, { status: 404 }) };
  }

  return { supabase, group };
}

export async function GET(req: NextRequest, props: { params: Promise<{ groupId: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const resolved = await resolveGroupAndFirm(req, params.groupId);
    if ('error' in resolved) return resolved.error;
    const { supabase, group } = resolved;

    // Get members joined with client names
    const { data: members, error: membersError } = await supabase
      .from('entity_group_members')
      .select(`
        id,
        group_id,
        client_id,
        ownership_percentage,
        relationship_type,
        clients (
          business_name
        )
      `)
      .eq('group_id', params.groupId);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const mappedMembers = (members ?? []).map((m: {
      id: string;
      group_id: string;
      client_id: string;
      ownership_percentage: number;
      relationship_type: RelationshipType;
      clients?: { business_name?: string } | { business_name?: string }[] | null;
    }) => ({
      id: m.id,
      group_id: m.group_id,
      client_id: m.client_id,
      client_name: (Array.isArray(m.clients) ? m.clients[0]?.business_name : (m.clients as { business_name?: string } | null)?.business_name) ?? undefined,
      ownership_percentage: m.ownership_percentage,
      relationship_type: m.relationship_type,
    }));

    const groupWithMembers: EntityGroupWithMembers = {
      ...(group as unknown as EntityGroupWithMembers),
      members: mappedMembers,
    };

    return NextResponse.json({ group: groupWithMembers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ groupId: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const resolved = await resolveGroupAndFirm(req, params.groupId);
    if ('error' in resolved) return resolved.error;
    const { supabase } = resolved;

    const body = await req.json() as {
      name?: string;
      consolidation_method?: ConsolidationMethod;
      currency?: string;
      fiscal_year_end?: string;
      parent_client_id?: string | null;
    };

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.consolidation_method !== undefined)
      updatePayload.consolidation_method = body.consolidation_method;
    if (body.currency !== undefined) updatePayload.currency = body.currency;
    if (body.fiscal_year_end !== undefined) updatePayload.fiscal_year_end = body.fiscal_year_end;
    if (body.parent_client_id !== undefined)
      updatePayload.parent_client_id = body.parent_client_id;

    const { data: group, error: updateError } = await supabase
      .from('entity_groups')
      .update(updatePayload)
      .eq('id', params.groupId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ group });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ groupId: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const resolved = await resolveGroupAndFirm(req, params.groupId);
    if ('error' in resolved) return resolved.error;
    const { supabase } = resolved;

    const { error: deleteError } = await supabase
      .from('entity_groups')
      .delete()
      .eq('id', params.groupId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
