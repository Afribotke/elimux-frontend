// src/app/api/smart-links/route.ts
// Creates (or reuses) a trackable short link for a piece of content

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, utmCampaign } = body;

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('get_or_create_smart_link', {
      p_content_type: contentType,
      p_content_id: contentId,
      p_created_by: user.id,
      p_utm_campaign: utmCampaign || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // get_or_create_smart_link returns a single-row set: [{ link_id, link_slug, short_url }]
    const link = Array.isArray(data) ? data[0] : data;

    if (!link) {
      return NextResponse.json({ error: 'Smart link creation returned no data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      linkId: link.link_id,
      slug: link.link_slug,
      shortUrl: link.short_url,
    });

  } catch (error) {
    console.error('Smart link creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
