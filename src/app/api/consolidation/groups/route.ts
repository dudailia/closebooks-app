import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/supabase/routeAuth';
import { EntityGroup, EntityGroupWithMembers, ConsolidationMethod } from '@/lib/consolidation/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    // Get firm for this user
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    const { data: groups, error: groupsError } = await supabase
      .from('entity_groups')
      .select('*')
      .eq('firm_id', firm.id)
      .order('created_at', { ascending: false });

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 500 });
    }

    // For each group, get member count
    const groupsWithMembers: EntityGroupWithMembers[] = await Promise.all(
      (groups ?? []).map(async (group: EntityGroup) => {
        const { data: members } = await supabase
          .from('entity_group_members')
          .select('id, group_id, client_id, ownership_percentage, relationship_type')
          .eq('group_id', group.id);

        return { ...group, members: members ?? [] };
      })
    );

    return NextResponse.json({ groups: groupsWithMembers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      name?: string;
      consolidation_method?: ConsolidationMethod;
      currency?: string;
      fiscal_year_end?: string;
      parent_client_id?: string;
    };

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    const { data: group, error: insertError } = await supabase
      .from('entity_groups')
      .insert({
        firm_id: firm.id,
        name: body.name.trim(),
        consolidation_method: body.consolidation_method ?? 'full',
        currency: body.currency ?? 'USD',
        fiscal_year_end: body.fiscal_year_end ?? '12-31',
        parent_client_id: body.parent_client_id ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
