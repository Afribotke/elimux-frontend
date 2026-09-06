// src/app/api/institution/alerts/[id]/read/route.ts
// Marks a single trending alert as read, scoped to the signed-in institution admin
// See src/app/api/institution/alerts/route.ts for the trending_alerts-table-doesn't-exist
// caveat - same applies here.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // UNIFIED PERMISSION: resolve institution via institution_accounts (active only)
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { success: false, error: 'No active institution account found' },
      { status: 403 }
    );
  }

  const { error: updateError } = await supabase
    .from('trending_alerts')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('institution_id', account.institution_id);

  if (updateError) {
    console.error('Alert read error:', updateError);
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
