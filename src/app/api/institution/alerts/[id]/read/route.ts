import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve institution via institution_accounts (active only)
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
    return NextResponse.json(
      { success: false, error: 'Failed to mark alert as read' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
