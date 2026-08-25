// src/app/api/analytics/[type]/route.ts
// SmartTrack analytics — overview, per-content, country/referrer breakdowns, trending, student impact
//
// NOTE: click_analytics stores one row per click (no pre-aggregated `count` column), so the
// country/referrer/trending breakdowns below fetch raw rows and aggregate in JS. PostgREST
// can't GROUP BY through the JS client without a dedicated view/RPC.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function aggregateBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = (row[key] as string) || 'Unknown';
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { type } = await params;

    // 'content' backs the public ShareStats widget on content detail pages —
    // every other type is a personal dashboard query and requires auth.
    if (type !== 'content' && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');
    const linkId = searchParams.get('linkId');
    const days = parseInt(searchParams.get('days') || '30');
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let data: unknown;

    switch (type) {
      case 'overview': {
        const { data: rows, error } = await supabase
          .from('smart_links')
          .select('id, slug, content_type, content_id, total_clicks, unique_clicks, created_at')
          .eq('created_by', user!.id)
          .gte('created_at', fromDate);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        data = rows;
        break;
      }

      case 'content': {
        if (!contentType || !contentId) {
          return NextResponse.json({ error: 'contentType and contentId required' }, { status: 400 });
        }
        const { data: row, error } = await supabase
          .from('content_performance')
          .select('*')
          .eq('content_type', contentType)
          .eq('content_id', contentId)
          .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        data = row;
        break;
      }

      case 'clicks-by-country': {
        if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });
        const { data: rows, error } = await supabase
          .from('click_analytics')
          .select('country')
          .eq('smart_link_id', linkId)
          .gte('clicked_at', fromDate);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        data = aggregateBy(rows || [], 'country');
        break;
      }

      case 'clicks-by-referrer': {
        if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });
        const { data: rows, error } = await supabase
          .from('click_analytics')
          .select('referrer_type')
          .eq('smart_link_id', linkId)
          .gte('clicked_at', fromDate);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        data = aggregateBy(rows || [], 'referrer_type');
        break;
      }

      case 'trending': {
        const { data: links, error: linksError } = await supabase
          .from('smart_links')
          .select('id, content_type, content_id')
          .eq('created_by', user!.id);
        if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

        const linkIds = (links || []).map((l) => l.id);
        if (linkIds.length === 0) {
          data = [];
          break;
        }

        const { data: clicks, error: clicksError } = await supabase
          .from('click_analytics')
          .select('smart_link_id')
          .in('smart_link_id', linkIds)
          .gte('clicked_at', fromDate);
        if (clicksError) return NextResponse.json({ error: clicksError.message }, { status: 500 });

        const linkById = new Map((links || []).map((l) => [l.id, l]));
        const counts = new Map<string, number>();
        for (const row of clicks || []) {
          counts.set(row.smart_link_id, (counts.get(row.smart_link_id) || 0) + 1);
        }

        data = Array.from(counts.entries())
          .map(([id, count]) => ({ ...linkById.get(id), clicks: count }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 20);
        break;
      }

      case 'student-impact': {
        const { data: row, error } = await supabase
          .from('student_impact_summary')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        data = row;
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown analytics type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
