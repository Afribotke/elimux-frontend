import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('pathways')
      .from('pathways')
      .select('*, tracks(*)')
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pathways: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch pathways' }, { status: 500 });
  }
}
