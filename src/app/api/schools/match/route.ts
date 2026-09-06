import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const county = searchParams.get('county');
    const counties = searchParams.get('counties')?.split(',') || [];
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const accommodation = searchParams.get('accommodation');
    const pathway = searchParams.get('pathway');

    let query = supabase
      .schema('pathways')
      .from('schools')
      .select('*')
      .eq('is_active', true);

    // Filter by county(s)
    if (counties.length > 0) {
      query = query.in('county', counties);
    } else if (county) {
      query = query.eq('county', county);
    }

    if (category) query = query.eq('category', category);
    if (gender) query = query.eq('gender', gender);
    if (accommodation) query = query.eq('accommodation', accommodation);
    if (pathway) query = query.contains('pathways', [pathway]);

    const { data, error } = await query.order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category for the 8-school formula display
    const grouped = {
      C1: data?.filter((s: any) => s.category === 'C1') || [],
      C2: data?.filter((s: any) => s.category === 'C2') || [],
      C3: data?.filter((s: any) => s.category === 'C3') || [],
      C4: data?.filter((s: any) => s.category === 'C4') || [],
    };

    return NextResponse.json({
      schools: data || [],
      total: data?.length || 0,
      grouped,
      formula: {
        C1: { required: 3, found: grouped.C1.length },
        C2: { required: 2, found: grouped.C2.length },
        C3: { required: 2, found: grouped.C3.length },
        C4: { required: 1, found: grouped.C4.length },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to match schools' }, { status: 500 });
  }
}
