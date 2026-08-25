// src/app/s/[slug]/route.ts
// SmartTrack redirect engine — resolves a short slug, logs the click, redirects to real content

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/edge/i.test(ua)) return 'Edge';
  return 'Other';
}

function detectOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

function detectReferrerType(referrer: string): string {
  if (!referrer) return 'direct';
  if (/whatsapp/i.test(referrer)) return 'whatsapp';
  if (/facebook|fb/i.test(referrer)) return 'facebook';
  if (/twitter|t\.co/i.test(referrer)) return 'twitter';
  if (/linkedin/i.test(referrer)) return 'linkedin';
  if (/instagram/i.test(referrer)) return 'instagram';
  if (/google/i.test(referrer)) return 'search';
  if (/email|mail/i.test(referrer)) return 'email';
  if (/sms/i.test(referrer)) return 'sms';
  return 'other';
}

function getDestinationUrl(contentType: string, contentId: string): string {
  const base = 'https://www.elimux.ke';
  switch (contentType) {
    case 'scholarship': return `${base}/scholarships/${contentId}`;
    case 'course': return `${base}/programs/${contentId}`;
    case 'institution': return `${base}/institutions/${contentId}`;
    case 'attachment': return `${base}/attachments/${contentId}`;
    case 'internship': return `${base}/internships/${contentId}`;
    case 'bursary': return `${base}/bursary/fund/${contentId}`;
    default: return base;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { data: link, error: linkError } = await supabase
      .from('smart_links')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (linkError || !link) {
      return NextResponse.redirect(new URL('/404', request.url), 302);
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/expired', request.url), 302);
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
    const sessionId = request.cookies.get('elimux_session')?.value || crypto.randomUUID();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClicks } = await supabase
      .from('click_analytics')
      .select('id')
      .eq('smart_link_id', link.id)
      .eq('ip_address', ip)
      .gte('clicked_at', twentyFourHoursAgo)
      .limit(1);

    const isUnique = !recentClicks || recentClicks.length === 0;

    // Logging the click and bumping counters happens after the redirect is sent, but the
    // response returning does not mean the serverless function is done — without `after()`,
    // Vercel can tear the invocation down mid-flight and silently drop these writes.
    after(async () => {
      await supabase.from('click_analytics').insert({
        smart_link_id: link.id,
        ip_address: ip,
        country,
        city,
        device_type: detectDevice(userAgent),
        browser: detectBrowser(userAgent),
        os: detectOS(userAgent),
        referrer,
        referrer_type: detectReferrerType(referrer),
        user_agent: userAgent,
        session_id: sessionId,
        is_unique_click: isUnique,
        conversion_event: 'view',
        metadata: {
          path: request.nextUrl.pathname,
          query: Object.fromEntries(request.nextUrl.searchParams),
        },
      });

      await supabase.from('smart_links').update({
        total_clicks: (link.total_clicks || 0) + 1,
        unique_clicks: isUnique ? (link.unique_clicks || 0) + 1 : link.unique_clicks,
      }).eq('id', link.id);
    });

    const destinationUrl = new URL(getDestinationUrl(link.content_type, link.content_id));
    if (link.utm_source) destinationUrl.searchParams.set('utm_source', link.utm_source);
    if (link.utm_medium) destinationUrl.searchParams.set('utm_medium', link.utm_medium);
    if (link.utm_campaign) destinationUrl.searchParams.set('utm_campaign', link.utm_campaign);
    destinationUrl.searchParams.set('utm_content', slug);
    destinationUrl.searchParams.set('elimux_ref', sessionId);

    const response = NextResponse.redirect(destinationUrl.toString(), 302);
    response.cookies.set('elimux_session', sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('SmartTrack redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
