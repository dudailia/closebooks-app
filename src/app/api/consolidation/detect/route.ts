import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/supabase/routeAuth';
import { detectIntercompanyTransactions } from '@/lib/consolidation/intercompanyDetector';
import { RelationshipType } from '@/lib/consolidation/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { groupId?: string; period?: string };

    if (!body.groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const period = body.period ?? new Date().toISOString().slice(0, 7); // e.g. "2026-04"

    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    // Verify firm ownership
    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    // Verify group belongs to firm
    const { data: group, error: groupError } = await supabase
      .from('entity_groups')
      .select('id')
      .eq('id', body.groupId)
      .eq('firm_id', firm.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get group members with client names
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
      .eq('group_id', body.groupId);

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    const memberList = (members ?? []) as Array<{
      id: string;
      group_id: string;
      client_id: string;
      ownership_percentage: number;
      relationship_type: RelationshipType;
      clients?: { business_name?: string } | { business_name?: string }[] | null;
    }>;

    const clientIds = memberList.map((m) => m.client_id);
    const memberNames: Record<string, string> = {};
    for (const m of memberList) {
      memberNames[m.client_id] = (Array.isArray(m.clients) ? m.clients[0]?.business_name : (m.clients as any)?.business_name) ?? m.client_id;
    }

    // Get transactions for each member client via jobs
    const entityTransactions: Record<
      string,
      Array<{ id: string; description: string; amount: number; type: string; date?: string }>
    > = {};

    for (const clientId of clientIds) {
      entityTransactions[clientId] = [];

      // Get jobs for this client in this period
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('client_id', clientId)
        .eq('period', period);

      if (!jobs || jobs.length === 0) continue;

      const jobIds = jobs.map((j: { id: string }) => j.id);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, description, amount, type')
        .in('job_id', jobIds);

      if (transactions) {
        entityTransactions[clientId] = transactions.map((t: {
          id: string;
          description: string;
          amount: number;
          type: string;
        }) => ({
          id: t.id,
          description: t.description ?? '',
          amount: t.amount,
          type: t.type,
        }));
      }
    }

    const detected = await detectIntercompanyTransactions(
      body.groupId,
      entityTransactions,
      memberNames,
      period
    );

    return NextResponse.json({ detected, period });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
