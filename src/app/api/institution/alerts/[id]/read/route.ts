// src/app/api/institution/alerts/[id]/read/route.ts
// Marks a single trending alert as read, scoped to the signed-in institution admin

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (institutionError) {
      return NextResponse.json({ error: institutionError.message }, { status: 500 });
    }
    if (!institution) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('trending_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('institution_id', institution.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mark alert read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
