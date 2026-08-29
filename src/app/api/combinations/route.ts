import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pathwayId = searchParams.get('pathway');
    const trackId = searchParams.get('track');

    const supabase = await createClient();
    let query = supabase
      .schema('pathways')
      .from('subject_combinations')
      .select('*, tracks(pathway_id)')
      .eq('is_active', true);

    if (trackId) query = query.eq('track_id', trackId);
    else if (pathwayId) query = query.eq('tracks.pathway_id', pathwayId);

    const { data, error } = await query.order('code');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ combinations: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch combinations' }, { status: 500 });
  }
}
