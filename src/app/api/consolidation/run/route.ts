import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/supabase/routeAuth';
import {
  buildConsolidatedTrialBalance,
  calculateMinorityInterest,
  generateEliminationEntries,
  buildConsolidatedStatements,
} from '@/lib/consolidation/consolidationEngine';
import {
  ConsolidationResult,
  EntityGroupMember,
  IntercompanyTransaction,
  RelationshipType,
} from '@/lib/consolidation/types';
import { TrialBalanceLine } from '@/lib/autopilot/pipelineTypes';

export const dynamic = 'force-dynamic';

function buildTrialBalanceFromTransactions(
  transactions: Array<{ final_category?: string | null; amount: number; type: string }>
): TrialBalanceLine[] {
  const accountMap = new Map<string, { debit: number; credit: number }>();

  for (const txn of transactions) {
    const account = txn.final_category ?? 'Uncategorized';
    const existing = accountMap.get(account) ?? { debit: 0, credit: 0 };
    if (txn.type === 'debit') {
      existing.debit += Math.abs(txn.amount);
    } else {
      existing.credit += Math.abs(txn.amount);
    }
    accountMap.set(account, existing);
  }

  return Array.from(accountMap.entries()).map(([account, amounts]) => ({
    account,
    debit: amounts.debit,
    credit: amounts.credit,
  }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      groupId?: string;
      period?: string;
      eliminatedTransactionIds?: string[];
    };

    if (!body.groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }
    if (!body.period) {
      return NextResponse.json({ error: 'period is required' }, { status: 400 });
    }

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
      .select('*')
      .eq('id', body.groupId)
      .eq('firm_id', firm.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get group members
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

    const typedMembers: EntityGroupMember[] = memberList.map((m) => ({
      id: m.id,
      group_id: m.group_id,
      client_id: m.client_id,
      client_name: (Array.isArray(m.clients) ? m.clients[0]?.business_name : (m.clients as any)?.business_name) ?? undefined,
      ownership_percentage: Number(m.ownership_percentage),
      relationship_type: m.relationship_type,
    }));

    // Mark eliminatedTransactionIds as eliminated (upsert)
    if (body.eliminatedTransactionIds && body.eliminatedTransactionIds.length > 0) {
      const { error: markError } = await supabase
        .from('intercompany_transactions')
        .update({ eliminated: true })
        .in('id', body.eliminatedTransactionIds)
        .eq('group_id', body.groupId);

      if (markError) {
        return NextResponse.json({ error: markError.message }, { status: 500 });
      }
    }

    // Get all eliminated intercompany transactions for this group/period
    const { data: icTxns, error: icError } = await supabase
      .from('intercompany_transactions')
      .select('*')
      .eq('group_id', body.groupId)
      .eq('period', body.period)
      .eq('eliminated', true);

    if (icError) {
      return NextResponse.json({ error: icError.message }, { status: 500 });
    }

    const eliminatedTxns: IntercompanyTransaction[] = (icTxns ?? []).map(
      (t: Record<string, unknown>) => ({
        id: t.id as string,
        group_id: t.group_id as string,
        from_client_id: t.from_client_id as string,
        to_client_id: t.to_client_id as string,
        amount: Number(t.amount),
        description: (t.description as string | null) ?? null,
        account_code: (t.account_code as string | null) ?? null,
        period: t.period as string,
        eliminated: t.eliminated as boolean,
        ai_detected: t.ai_detected as boolean,
        confidence: t.confidence != null ? Number(t.confidence) : null,
      })
    );

    // Build trial balance for each member
    const entityTBs: Record<string, TrialBalanceLine[]> = {};

    for (const member of typedMembers) {
      entityTBs[member.client_id] = [];

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('client_id', member.client_id)
        .eq('period', body.period);

      if (!jobs || jobs.length === 0) continue;

      const jobIds = jobs.map((j: { id: string }) => j.id);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('final_category, amount, type')
        .in('job_id', jobIds);

      if (transactions && transactions.length > 0) {
        entityTBs[member.client_id] = buildTrialBalanceFromTransactions(
          transactions as Array<{ final_category?: string | null; amount: number; type: string }>
        );
      }
    }

    // Generate elimination entries
    const eliminations = generateEliminationEntries(eliminatedTxns);

    // Build consolidated trial balance
    const consolidatedTB = buildConsolidatedTrialBalance(entityTBs, typedMembers, eliminations);

    // Calculate minority interest
    const minorityInterest = calculateMinorityInterest(entityTBs, typedMembers);

    // Build consolidated statements
    const entityIds = typedMembers.map((m) => m.client_id);
    const statements = buildConsolidatedStatements(consolidatedTB, entityIds, body.period);

    const result: ConsolidationResult = {
      groupId: body.groupId,
      period: body.period,
      entityIds,
      consolidatedTB,
      eliminations,
      minorityInterest,
      statements,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
