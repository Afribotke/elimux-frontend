import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const accommodation = searchParams.get('accommodation');
    const pathway = searchParams.get('pathway');

    const supabase = await createClient();
    let query = supabase
      .schema('pathways')
      .from('schools')
      .select('*')
      .eq('is_active', true);

    if (county) query = query.eq('county', county);
    if (category) query = query.eq('category', category);
    if (gender) query = query.eq('gender', gender);
    if (accommodation) query = query.eq('accommodation', accommodation);
    if (pathway) query = query.contains('pathways', [pathway]);

    const { data, error } = await query.order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ schools: data, total: data?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch schools' }, { status: 500 });
  }
}
