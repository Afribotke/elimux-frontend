import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

  const { data: alerts, error: alertsError } = await supabase
    .from('trending_alerts')
    .select('*')
    .eq('institution_id', account.institution_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (alertsError) {
    console.error('Alerts fetch error:', alertsError);
    return NextResponse.json(
      { success: false, error: 'Failed to load alerts' },
      { status: 500 }
    );
  }

  const unreadCount = (alerts || []).filter((a) => !a.read_at).length;

  return NextResponse.json({
    success: true,
    data: alerts || [],
    unreadCount,
  });
}
