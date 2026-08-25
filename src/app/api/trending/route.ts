// src/app/api/trending/route.ts
// Returns ranked trending content from trending_snapshots, refreshing them first if stale

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Refresh snapshots if stale (older than 30 minutes)
    const { data: latest } = await supabase
      .from('trending_snapshots')
      .select('computed_at')
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (!latest || new Date(latest.computed_at) < new Date(Date.now() - 30 * 60 * 1000)) {
      await supabase.rpc('refresh_trending_snapshots');
    }

    let query = supabase
      .from('trending_snapshots')
      .select(`
        content_type,
        content_id,
        score,
        clicks_24h,
        clicks_7d,
        shares_24h,
        unique_visitors,
        rank,
        computed_at
      `)
      .order('score', { ascending: false })
      .limit(limit);

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });

  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
