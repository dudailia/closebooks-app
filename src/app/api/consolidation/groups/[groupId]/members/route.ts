import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/supabase/routeAuth';
import { RelationshipType } from '@/lib/consolidation/types';

export const dynamic = 'force-dynamic';

async function verifyGroupAccess(
  req: NextRequest,
  groupId: string
): Promise<
  | { error: NextResponse }
  | { supabase: NonNullable<ReturnType<typeof createClient>> }
> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabase = createClient();
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
    .select('id')
    .eq('id', groupId)
    .eq('firm_id', firm.id)
    .single();

  if (groupError || !group) {
    return { error: NextResponse.json({ error: 'Group not found' }, { status: 404 }) };
  }

  return { supabase };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
): Promise<NextResponse> {
  try {
    const resolved = await verifyGroupAccess(req, params.groupId);
    if ('error' in resolved) return resolved.error;
    const { supabase } = resolved;

    const { data: members, error } = await supabase
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
      .eq('group_id', params.groupId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    return NextResponse.json({ members: mappedMembers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
): Promise<NextResponse> {
  try {
    const resolved = await verifyGroupAccess(req, params.groupId);
    if ('error' in resolved) return resolved.error;
    const { supabase } = resolved;

    const body = await req.json() as {
      client_id?: string;
      ownership_percentage?: number;
      relationship_type?: RelationshipType;
    };

    if (!body.client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    const { data: member, error: insertError } = await supabase
      .from('entity_group_members')
      .insert({
        group_id: params.groupId,
        client_id: body.client_id,
        ownership_percentage: body.ownership_percentage ?? 100.0,
        relationship_type: body.relationship_type ?? 'subsidiary',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
): Promise<NextResponse> {
  try {
    const resolved = await verifyGroupAccess(req, params.groupId);
    if ('error' in resolved) return resolved.error;
    const { supabase } = resolved;

    const body = await req.json() as { member_id?: string };

    if (!body.member_id) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('entity_group_members')
      .delete()
      .eq('id', body.member_id)
      .eq('group_id', params.groupId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
