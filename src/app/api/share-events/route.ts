// src/app/api/share-events/route.ts
// Logs a share action (channel used, content shared) for analytics

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SHARE_ACTION_KEY = 'share_content';
const SHARE_ACTION_POINTS = 5;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { contentType, contentId, channel, smartLinkId } = body;

    if (!contentType || !contentId || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // share_events RLS requires shared_by = auth.uid() on insert, so anonymous shares
    // can't be recorded here — report success (nothing to track) rather than 500.
    if (!user) {
      return NextResponse.json({ success: true, tracked: false });
    }

    const { data, error } = await supabase
      .from('share_events')
      .insert({
        content_type: contentType,
        content_id: contentId,
        shared_by: user.id,
        channel,
        smart_link_id: smartLinkId || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    after(async () => {
      await supabase.rpc('award_points', {
        p_user_id: user.id,
        p_action_key: SHARE_ACTION_KEY,
        p_points: SHARE_ACTION_POINTS,
        p_reference_id: contentId,
        p_reference_type: contentType,
      });
    });

    return NextResponse.json({ success: true, event: data });

  } catch (error) {
    console.error('Share event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
