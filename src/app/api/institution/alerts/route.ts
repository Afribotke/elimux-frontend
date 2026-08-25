// src/app/api/institution/alerts/route.ts
// Trending alerts for the signed-in institution admin's own institution

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (institutionError) {
      return NextResponse.json({ error: institutionError.message }, { status: 500 });
    }
    if (!institution) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from('trending_alerts')
      .select('*')
      .eq('institution_id', institution.id)
      .order('sent_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });

  } catch (error) {
    console.error('Institution alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
