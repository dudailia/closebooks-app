import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFromRequest } from '@/lib/supabase/routeAuth';
import { IntercompanyTransaction } from '@/lib/consolidation/types';

export const dynamic = 'force-dynamic';

async function verifyGroupFirmAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  firmId: string
): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase
    .from('entity_groups')
    .select('id')
    .eq('id', groupId)
    .eq('firm_id', firmId)
    .single();
  return !!data;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const period = searchParams.get('period');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    const hasAccess = await verifyGroupFirmAccess(supabase, groupId, firm.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    let query = supabase
      .from('intercompany_transactions')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (period) {
      query = query.eq('period', period);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: transactions ?? [] });
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
      groupId?: string;
      from_client_id?: string;
      to_client_id?: string;
      amount?: number;
      description?: string;
      account_code?: string;
      period?: string;
    };

    if (!body.groupId) return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    if (!body.from_client_id)
      return NextResponse.json({ error: 'from_client_id is required' }, { status: 400 });
    if (!body.to_client_id)
      return NextResponse.json({ error: 'to_client_id is required' }, { status: 400 });
    if (body.amount == null)
      return NextResponse.json({ error: 'amount is required' }, { status: 400 });
    if (!body.period) return NextResponse.json({ error: 'period is required' }, { status: 400 });

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    const hasAccess = await verifyGroupFirmAccess(supabase, body.groupId, firm.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const { data: transaction, error: insertError } = await supabase
      .from('intercompany_transactions')
      .insert({
        group_id: body.groupId,
        from_client_id: body.from_client_id,
        to_client_id: body.to_client_id,
        amount: body.amount,
        description: body.description ?? null,
        account_code: body.account_code ?? null,
        period: body.period,
        eliminated: false,
        ai_detected: false,
        confidence: null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { id?: string; eliminated?: boolean };

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (body.eliminated === undefined) {
      return NextResponse.json({ error: 'eliminated is required' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

    const { data: firm, error: firmError } = await supabase
      .from('firms')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    // Verify the transaction belongs to this firm via the group
    const { data: existing, error: fetchError } = await supabase
      .from('intercompany_transactions')
      .select('id, group_id')
      .eq('id', body.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const hasAccess = await verifyGroupFirmAccess(
      supabase,
      (existing as { group_id: string }).group_id,
      firm.id
    );
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: transaction, error: updateError } = await supabase
      .from('intercompany_transactions')
      .update({ eliminated: body.eliminated })
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
