import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    const supabase = await createClient();
    let query = supabase
      .schema('pathways')
      .from('career_mappings')
      .select('*, pathways(*), tracks(*)')
      .eq('is_verified', true);

    if (q) {
      // Strip characters with special meaning in PostgREST's filter
      // grammar (comma separates filters, parens group them) so a
      // query string can't break out of this .or() clause.
      const safeQ = q.replace(/[,()]/g, '').trim();
      if (safeQ) {
        query = query.or(`career_name.ilike.%${safeQ}%,career_aliases.cs.{${safeQ}}`);
      }
    }

    const { data, error } = await query.limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ careers: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch careers' }, { status: 500 });
  }
}
