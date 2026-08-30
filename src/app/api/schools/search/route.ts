import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseSchoolSearchQuery } from '@/lib/school-search-parser';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const sp = request.nextUrl.searchParams;

    const freeText = sp.get('query');
    const parsed = freeText ? parseSchoolSearchQuery(freeText) : {};

    const region = sp.get('region') || parsed.region;
    const county = sp.get('county') || parsed.county;
    const gender = sp.get('gender') || parsed.gender;
    const accommodation = sp.get('accommodation_type') || parsed.accommodation_type;
    const cluster = sp.get('cluster_type') || parsed.cluster_type;
    const q = sp.get('q') || parsed.q;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '24', 10) || 24));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('senior_schools').select('*', { count: 'exact' });

    if (region) query = query.eq('region', region);
    if (county) query = query.eq('county', county);
    if (gender) query = query.eq('gender', gender);
    if (accommodation) query = query.eq('accommodation_type', accommodation);
    if (cluster) query = query.eq('cluster_type', cluster);
    if (q) query = query.ilike('name', `%${q}%`);

    query = query.order('name', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
      appliedFilters: { region, county, gender, accommodation_type: accommodation, cluster_type: cluster, q },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
