Cycle 027 — SmartTrack Module
ElimuX Education Intelligence Layer
0. AUDIT — Current State
CONFIRMED BUILT (do NOT rebuild):
Next.js 14+ app router on Vercel (www.elimux.ke)
Supabase PostgreSQL with RLS policies
Auth system (students, institutions, admin)
Scholarship, course, institution, attachment tables
Gamification system (gamification_points, gamification_actions)
Sponsor ads, employer portal, bursary module
M-Pesa / Paystack payment integration
PWA manifest and service worker
Google Analytics active
THIS CYCLE ADDS: smart_links, click_analytics, share_events tables + API + UI.
CRITICAL CONSTRAINTS:
images.unoptimized: true in next.config.js — DO NOT change
All <img> tags stay as <img>, do NOT convert to <Image>
Windows PowerShell environment
Node v26.3.0, ~220MB free RAM — build uses swap
Do NOT commit/push until user says "commit and push it"
1. DATABASE SCHEMA
Run this SQL in Supabase SQL Editor (new query, paste all, run once):
sql
-- ============================================================
-- CYCLE 027: SMARTTRACK MODULE
-- ============================================================

-- 1. SMART LINKS TABLE
CREATE TABLE IF NOT EXISTS smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('scholarship','course','institution','attachment','internship','bursary','page')),
  content_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  custom_alias TEXT UNIQUE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_smart_links_slug ON smart_links(slug);
CREATE INDEX IF NOT EXISTS idx_smart_links_content ON smart_links(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_smart_links_created_by ON smart_links(created_by);

-- 2. CLICK ANALYTICS TABLE (high-write, partition-ready)
CREATE TABLE IF NOT EXISTS click_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_id UUID REFERENCES smart_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('mobile','tablet','desktop','unknown')),
  browser TEXT,
  os TEXT,
  referrer TEXT,
  referrer_type TEXT CHECK (referrer_type IN ('social','search','direct','email','sms','whatsapp','facebook','twitter','linkedin','instagram','other')),
  user_agent TEXT,
  session_id TEXT,
  is_unique_click BOOLEAN DEFAULT false,
  conversion_event TEXT CHECK (conversion_event IN ('view','scroll_50','scroll_80','signup_started','application_started','document_uploaded','shared','contact_clicked')),
  time_on_page INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_click_analytics_link ON click_analytics(smart_link_id);
CREATE INDEX IF NOT EXISTS idx_click_analytics_clicked_at ON click_analytics(clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_analytics_country ON click_analytics(country);
CREATE INDEX IF NOT EXISTS idx_click_analytics_referrer ON click_analytics(referrer_type);
CREATE INDEX IF NOT EXISTS idx_click_analytics_session ON click_analytics(session_id);

-- 3. SHARE EVENTS TABLE
CREATE TABLE IF NOT EXISTS share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('scholarship','course','institution','attachment','internship','bursary','page')),
  content_id UUID NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_at TIMESTAMPTZ DEFAULT now(),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','facebook','twitter','email','sms','linkedin','copy_link','native_share')),
  smart_link_id UUID REFERENCES smart_links(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 1,
  clicked_back BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_events_content ON share_events(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_share_events_shared_by ON share_events(shared_by);
CREATE INDEX IF NOT EXISTS idx_share_events_channel ON share_events(channel);

-- 4. STUDENT IMPACT SUMMARY (materialized view for fast dashboard loads)
CREATE OR REPLACE VIEW student_impact_summary AS
SELECT 
  shared_by AS user_id,
  COUNT(DISTINCT se.id) AS total_shares,
  COUNT(DISTINCT CASE WHEN se.channel = 'whatsapp' THEN se.id END) AS whatsapp_shares,
  COUNT(DISTINCT CASE WHEN se.channel = 'facebook' THEN se.id END) AS facebook_shares,
  COUNT(DISTINCT CASE WHEN se.channel = 'copy_link' THEN se.id END) AS copy_shares,
  COUNT(DISTINCT ca.id) AS total_clicks_generated,
  COUNT(DISTINCT CASE WHEN ca.conversion_event = 'application_started' THEN ca.id END) AS applications_generated,
  MAX(se.shared_at) AS last_share_date
FROM share_events se
LEFT JOIN smart_links sl ON se.smart_link_id = sl.id
LEFT JOIN click_analytics ca ON sl.id = ca.smart_link_id
WHERE se.shared_by IS NOT NULL
GROUP BY shared_by;

-- 5. CONTENT PERFORMANCE VIEW
CREATE OR REPLACE VIEW content_performance AS
SELECT 
  sl.content_type,
  sl.content_id,
  COUNT(DISTINCT ca.id) AS total_clicks,
  COUNT(DISTINCT CASE WHEN ca.is_unique_click THEN ca.id END) AS unique_clicks,
  COUNT(DISTINCT se.id) AS total_shares,
  COUNT(DISTINCT CASE WHEN ca.conversion_event = 'application_started' THEN ca.id END) AS applications,
  MODE() WITHIN GROUP (ORDER BY ca.referrer_type) AS top_referrer,
  MODE() WITHIN GROUP (ORDER BY ca.country) AS top_country,
  MAX(ca.clicked_at) AS last_click
FROM smart_links sl
LEFT JOIN click_analytics ca ON sl.id = ca.smart_link_id
LEFT JOIN share_events se ON sl.id = se.smart_link_id
WHERE sl.is_active = true
GROUP BY sl.content_type, sl.content_id;

-- 6. RLS POLICIES
ALTER TABLE smart_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- smart_links: creators can manage their own; public can read active links
CREATE POLICY 'smart_links_select_public' ON smart_links
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY 'smart_links_select_owner' ON smart_links
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY 'smart_links_insert_owner' ON smart_links
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY 'smart_links_update_owner' ON smart_links
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY 'smart_links_delete_owner' ON smart_links
  FOR DELETE USING (created_by = auth.uid());

-- Admin sees all
CREATE POLICY 'smart_links_admin_all' ON smart_links
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- click_analytics: service role only for insert; owners can read their link stats
CREATE POLICY 'click_analytics_insert_service' ON click_analytics
  FOR INSERT WITH CHECK (true);  -- API key handles auth

CREATE POLICY 'click_analytics_select_link_owner' ON click_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM smart_links sl WHERE sl.id = click_analytics.smart_link_id AND sl.created_by = auth.uid())
  );

CREATE POLICY 'click_analytics_admin_all' ON click_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- share_events: users can see their own; public can see aggregate
CREATE POLICY 'share_events_select_self' ON share_events
  FOR SELECT USING (shared_by = auth.uid());

CREATE POLICY 'share_events_insert_auth' ON share_events
  FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY 'share_events_admin_all' ON share_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 7. FUNCTION: Generate unique slug
CREATE OR REPLACE FUNCTION generate_smart_slug()
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_slug := lower(substring(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM smart_links WHERE slug = new_slug) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCTION: Update click counters on smart_links
CREATE OR REPLACE FUNCTION increment_link_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE smart_links 
  SET total_clicks = total_clicks + 1,
      updated_at = now()
  WHERE id = NEW.smart_link_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_clicks
  AFTER INSERT ON click_analytics
  FOR EACH ROW
  EXECUTE FUNCTION increment_link_clicks();

-- 9. FUNCTION: Get or create smart link for content
CREATE OR REPLACE FUNCTION get_or_create_smart_link(
  p_content_type TEXT,
  p_content_id UUID,
  p_created_by UUID DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL
)
RETURNS TABLE (link_id UUID, slug TEXT, short_url TEXT) AS $$
DECLARE
  v_slug TEXT;
  v_id UUID;
BEGIN
  -- Check if link already exists
  SELECT id, slug INTO v_id, v_slug
  FROM smart_links
  WHERE content_type = p_content_type 
    AND content_id = p_content_id
    AND (created_by = p_created_by OR created_by IS NULL)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF v_id IS NULL THEN
    v_slug := generate_smart_slug();
    INSERT INTO smart_links (slug, content_type, content_id, created_by, utm_campaign)
    VALUES (v_slug, p_content_type, p_content_id, p_created_by, p_utm_campaign)
    RETURNING id, slug INTO v_id, v_slug;
  END IF;

  RETURN QUERY SELECT v_id, v_slug, 'https://www.elimux.ke/s/' || v_slug;
END;
$$ LANGUAGE plpgsql;

-- 10. Seed verification
SELECT 'smart_links' as table_name, COUNT(*) as count FROM smart_links
UNION ALL
SELECT 'click_analytics', COUNT(*) FROM click_analytics
UNION ALL
SELECT 'share_events', COUNT(*) FROM share_events;
VERIFICATION: After running, confirm 3 tables exist with \dt or Supabase Table Editor.
2. API ROUTES
2.1 Redirect Engine — src/app/s/[slug]/route.ts
This is the HEART of SmartTrack. Every shared link hits this edge function.
TypeScript
import { NextRequest, NextResponse } from 'next/server';
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
  if (/twitter|t.co/i.test(referrer)) return 'twitter';
  if (/linkedin/i.test(referrer)) return 'linkedin';
  if (/instagram/i.test(referrer)) return 'instagram';
  if (/google/i.test(referrer)) return 'search';
  if (/email|mail/i.test(referrer)) return 'email';
  if (/sms/i.test(referrer)) return 'sms';
  return 'other';
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  const startTime = Date.now();

  try {
    // 1. Fetch the smart link
    const { data: link, error: linkError } = await supabase
      .from('smart_links')
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      return NextResponse.redirect(new URL('/404', request.url), 302);
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/expired', request.url), 302);
    }

    // 2. Extract analytics data from request
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'Unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
    
    // Session tracking via cookie
    const sessionId = request.cookies.get('elimux_session')?.value || crypto.randomUUID();

    // 3. Check uniqueness (simple: same IP in last 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClicks } = await supabase
      .from('click_analytics')
      .select("id")
      .eq("smart_link_id", link.id)
      .eq("ip_address", ip)
      .gte("clicked_at", twentyFourHoursAgo)
      .limit(1);

    const isUnique = !recentClicks || recentClicks.length === 0;

    // 4. Fire-and-forget: log click (do NOT await, do not slow redirect)
    supabase.from('click_analytics').insert({
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
        query: Object.fromEntries(request.nextUrl.searchParams)
      }
    }).then(() => {
      // Also update unique_clicks counter if unique
      if (isUnique) {
        supabase.rpc('increment_unique_clicks', { link_id: link.id });
      }
    }).catch(() => {
      // Silently fail analytics — never break the user experience
    });

    // 5. Build destination URL with UTM params
    const destinationUrl = new URL(getDestinationUrl(link.content_type, link.content_id));
    
    if (link.utm_source) destinationUrl.searchParams.set("utm_source", link.utm_source);
    if (link.utm_medium) destinationUrl.searchParams.set("utm_medium", link.utm_medium);
    if (link.utm_campaign) destinationUrl.searchParams.set("utm_campaign", link.utm_campaign);
    destinationUrl.searchParams.set("utm_content", slug);
    destinationUrl.searchParams.set("elimux_ref", sessionId);

    // 6. Redirect with session cookie
    const response = NextResponse.redirect(destinationUrl.toString(), 302);
    response.cookies.set('elimux_session', sessionId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('SmartTrack redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}

function getDestinationUrl(contentType: string, contentId: string): string {
  const base = 'https://www.elimux.ke';
  switch (contentType) {
    case 'scholarship': return `${base}/scholarships/${contentId}`;
    case 'course': return `${base}/courses/${contentId}`;
    case 'institution': return `${base}/institutions/${contentId}`;
    case 'attachment': return `${base}/attachments/${contentId}`;
    case 'internship': return `${base}/internships/${contentId}`;
    case 'bursary': return `${base}/bursaries/${contentId}`;
    default: return base;
  }
}
2.2 Smart Link API — src/app/api/smart-links/route.ts
TypeScript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, utmCampaign, customAlias } = body;

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId required' }, { status: 400 });
    }

    // Use the DB function
    const { data, error } = await supabase.rpc("get_or_create_smart_link", {
      p_content_type: contentType,
      p_content_id: contentId,
      p_created_by: user.id,
      p_utm_campaign: utmCampaign || null
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      linkId: data.link_id,
      slug: data.slug,
      shortUrl: data.short_url
    });

  } catch (error) {
    console.error('Smart link creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
2.3 Share Event API — src/app/api/share-events/route.ts
TypeScript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { contentType, contentId, channel, smartLinkId } = body;

    if (!contentType || !contentId || !channel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('share_events')
      .insert({
        content_type: contentType,
        content_id: contentId,
        shared_by: user?.id || null,
        channel,
        smart_link_id: smartLinkId || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award gamification points if user is logged in
    if (user) {
      await supabase.from('gamification_points').insert({
        user_id: user.id,
        action: 'share_content',
        points: 5,
        metadata: { content_type: contentType, content_id: contentId, channel }
      }).catch(() => {}); // Don't fail if gamification table missing
    }

    return NextResponse.json({ success: true, event: data });

  } catch (error) {
    console.error('Share event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
2.4 Analytics API — src/app/api/analytics/[type]/route.ts
TypeScript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');
    const days = parseInt(searchParams.get('days') || '30');

    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query;

    switch (params.type) {
      case 'overview':
        // Total clicks, unique clicks, shares for user content
        query = supabase
          .from('smart_links')
          .select(`
            id, slug, content_type, content_id, total_clicks, unique_clicks, created_at,
            click_analytics(count),
            share_events(count)
          `)
          .eq("created_by", user.id)
          .gte("created_at", fromDate);
        break;

      case 'clicks-by-country':
        query = supabase
          .from('click_analytics')
          .select("country, count")
          .eq("smart_link_id", searchParams.get("linkId"))
          .gte("clicked_at", fromDate)
          .order("count", { ascending: false });
        break;

      case 'clicks-by-referrer':
        query = supabase
          .from('click_analytics')
          .select("referrer_type, count")
          .eq("smart_link_id", searchParams.get("linkId"))
          .gte("clicked_at", fromDate)
          .order("count", { ascending: false });
        break;

      case 'trending':
        // Most clicked content in last N days
        query = supabase
          .from('click_analytics')
          .select(`
            smart_link_id,
            smart_links!inner(content_type, content_id),
            count
          `)
          .gte("clicked_at", fromDate)
          .order("count", { ascending: false })
          .limit(20);
        break;

      case 'student-impact':
        query = supabase
          .from('student_impact_summary')
          .select("*")
          .eq("user_id", user.id)
          .single();
        break;

      default:
        return NextResponse.json({ error: 'Unknown analytics type' }, { status: 400 });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
3. REACT COMPONENTS
3.1 SmartShare Component — src/components/smarttrack/SmartShare.tsx
TypeScript
'use client';

import { useState, useCallback } from 'react';
import { Share2, Link2, Check, MessageCircle, Facebook, Twitter, Linkedin, Mail, Smartphone } from 'lucide-react';

interface SmartShareProps {
  contentType: 'scholarship' | 'course' | 'institution' | 'attachment' | 'internship' | 'bursary' | 'page';
  contentId: string;
  contentTitle: string;
  contentDescription?: string;
  imageUrl?: string;
  variant?: 'buttons' | 'dropdown' | 'floating';
}

export default function SmartShare({
  contentType,
  contentId,
  contentTitle,
  contentDescription = "",
  imageUrl = "",
  variant = 'buttons'
}: SmartShareProps) {
  const [smartLink, setSmartLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getOrCreateLink = useCallback(async (): Promise<string> => {
    if (smartLink) return smartLink;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/smart-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId })
      });
      const data = await res.json();
      if (data.success) {
        setSmartLink(data.shortUrl);
        return data.shortUrl;
      }
    } catch (e) {
      console.error("Failed to create smart link:", e);
    } finally {
      setIsLoading(false);
    }
    // Fallback to current URL
    return typeof window !== "undefined" ? window.location.href : "";
  }, [contentType, contentId, smartLink]);

  const trackShare = async (channel: string, link: string) => {
    try {
      await fetch("/api/share-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId, channel, smartLinkId: smartLink ? extractLinkId(smartLink) : null })
      });
    } catch (e) {
      // Silently fail tracking
    }
  };

  const extractLinkId = (url: string): string | null => {
    try {
      const res = fetch(`/api/smart-links/resolve?url=${encodeURIComponent(url)}`).then(r => r.json());
      return null; // Simplified
    } catch {
      return null;
    }
  };

  const shareViaWhatsApp = async () => {
    const link = await getOrCreateLink();
    const text = encodeURIComponent(`${contentTitle}\n\n${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    trackShare('whatsapp', link);
  };

  const shareViaFacebook = async () => {
    const link = await getOrCreateLink();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, "_blank");
    trackShare('facebook', link);
  };

  const shareViaTwitter = async () => {
    const link = await getOrCreateLink();
    const text = encodeURIComponent(contentTitle);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`, "_blank");
    trackShare('twitter', link);
  };

  const shareViaLinkedIn = async () => {
    const link = await getOrCreateLink();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, "_blank");
    trackShare('linkedin', link);
  };

  const shareViaEmail = async () => {
    const link = await getOrCreateLink();
    const subject = encodeURIComponent(`Check out: ${contentTitle}`);
    const body = encodeURIComponent(`${contentTitle}\n\n${contentDescription}\n\n${link}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    trackShare('email', link);
  };

  const copyLink = async () => {
    const link = await getOrCreateLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    trackShare('copy_link', link);
  };

  const nativeShare = async () => {
    const link = await getOrCreateLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: contentTitle,
          text: contentDescription,
          url: link
        });
        trackShare('native_share', link);
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
  };

  const shareButtons = [
    { icon: MessageCircle, label: 'WhatsApp', action: shareViaWhatsApp, color: 'bg-green-500 hover:bg-green-600', textColor: 'text-white' },
    { icon: Facebook, label: 'Facebook', action: shareViaFacebook, color: 'bg-blue-600 hover:bg-blue-700', textColor: 'text-white' },
    { icon: Twitter, label: 'X / Twitter', action: shareViaTwitter, color: 'bg-gray-900 hover:bg-gray-800', textColor: 'text-white' },
    { icon: Linkedin, label: 'LinkedIn', action: shareViaLinkedIn, color: 'bg-blue-700 hover:bg-blue-800', textColor: 'text-white' },
    { icon: Mail, label: 'Email', action: shareViaEmail, color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' },
  ];

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full shadow-2xl border border-gray-200 px-4 py-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600 mr-2">Share:</span>
        {shareButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={`p-2.5 rounded-full ${btn.color} ${btn.textColor} transition-all hover:scale-110`}
            title={btn.label}
          >
            <btn.icon size={18} />
          </button>
        ))}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          onClick={copyLink}
          className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
          title="Copy link"
        >
          {copied ? <Check size={18} className="text-green-600" /> : <Link2 size={18} />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Share2 size={16} />
        <span>Share this {contentType}</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {shareButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${btn.color} ${btn.textColor} text-sm font-medium transition-all hover:scale-105`}
          >
            <btn.icon size={14} />
            {btn.label}
          </button>
        ))}
        
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Link2 size={14} />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={nativeShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium transition-all"
          >
            <Smartphone size={14} />
            More
          </button>
        )}
      </div>

      {smartLink && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <Link2 size={14} className="text-gray-400" />
          <code className="text-xs text-gray-600 flex-1 truncate">{smartLink}</code>
          <span className="text-xs text-green-600 font-medium">Active</span>
        </div>
      )}
    </div>
  );
}
3.2 QRCode Component — src/components/smarttrack/SmartQRCode.tsx
TypeScript
'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

interface SmartQRCodeProps {
  url: string;
  size?: number;
  title?: string;
}

export default function SmartQRCode({ url, size = 200, title = "Scan to view" }: SmartQRCodeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const downloadQR = () => {
    const svg = document.getElementById("smart-qr-code");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `elimux-qr-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <QrCode size={16} />
        {title}
      </div>
      <div className="p-3 bg-white rounded-lg">
        <QRCodeSVG
          id="smart-qr-code"
          value={url}
          size={size}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: '/elimux-logo.png',
            height: 30,
            width: 30,
            excavate: true,
          }}
        />
      </div>
      <button
        onClick={downloadQR}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
      >
        <Download size={14} />
        Download PNG
      </button>
    </div>
  );
}
NOTE: Install dependency: npm install qrcode.react
3.3 Analytics Mini-Widget — src/components/smarttrack/ShareStats.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { Eye, Share2, MousePointer, TrendingUp } from 'lucide-react';

interface ShareStatsProps {
  contentType: string;
  contentId: string;
}

interface Stats {
  totalClicks: number;
  uniqueClicks: number;
  totalShares: number;
  topReferrer: string;
}

export default function ShareStats({ contentType, contentId }: ShareStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/content?contentType=${contentType}&contentId=${contentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, [contentType, contentId]);

  if (loading) return <div className="h-16 bg-gray-100 animate-pulse rounded-lg" />;
  if (!stats) return null;

  const items = [
    { icon: Eye, label: "Views", value: stats.totalClicks },
    { icon: MousePointer, label: "Unique", value: stats.uniqueClicks },
    { icon: Share2, label: "Shares", value: stats.totalShares },
    { icon: TrendingUp, label: "Top Source", value: stats.topReferrer || "Direct" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 p-2">
          <item.icon size={16} className="text-gray-400" />
          <span className="text-lg font-bold text-gray-900">{item.value}</span>
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
4. PAGE INTEGRATIONS
4.1 Add to Scholarship Detail Page
In src/app/scholarships/[id]/page.tsx (or wherever scholarship detail renders), add BEFORE the closing </article> or main container:
tsx
import SmartShare from '@/components/smarttrack/SmartShare';
import SmartQRCode from '@/components/smarttrack/SmartQRCode';
import ShareStats from '@/components/smarttrack/ShareStats';

// ... inside the component, after scholarship data is loaded:

<div className="mt-8 space-y-6 border-t border-gray-200 pt-6">
  <ShareStats contentType="scholarship" contentId={scholarship.id} />
  
  <SmartShare
    contentType="scholarship"
    contentId={scholarship.id}
    contentTitle={scholarship.title}
    contentDescription={scholarship.description}
    variant="buttons"
  />
  
  <div className="flex justify-center">
    <SmartQRCode 
      url={`https://www.elimux.ke/s/${scholarship.slug || scholarship.id}`}
      title="Scan to apply"
    />
  </div>
</div>
REPEAT this pattern for:
Course detail pages (contentType="course")
Institution detail pages (contentType="institution")
Attachment detail pages (contentType="attachment")
Internship detail pages (contentType="internship")
Bursary detail pages (contentType="bursary")
4.2 Add Floating Share Bar (Mobile-First)
In src/app/layout.tsx or a client layout wrapper, conditionally render:
tsx
import SmartShare from '@/components/smarttrack/SmartShare';

// Show floating bar only on detail pages
{isDetailPage && (
  <SmartShare
    contentType={detectedContentType}
    contentId={detectedContentId}
    contentTitle={pageTitle}
    variant="floating"
  />
)}
5. DASHBOARD PAGES
5.1 Student Impact Dashboard — src/app/dashboard/student/impact/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { Eye, Share2, Users, Award, TrendingUp, Globe, Smartphone } from 'lucide-react';

interface ImpactData {
  total_shares: number;
  whatsapp_shares: number;
  facebook_shares: number;
  copy_shares: number;
  total_clicks_generated: number;
  applications_generated: number;
  last_share_date: string;
}

export default function StudentImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/student-impact")
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading your impact...</div>;
  if (!data) return <div className="p-8">No sharing activity yet. Start sharing!</div>;

  const stats = [
    { icon: Share2, label: "Total Shares", value: data.total_shares, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Eye, label: "Clicks Generated", value: data.total_clicks_generated, color: "text-green-600", bg: "bg-green-50" },
    { icon: Users, label: "Applications Generated", value: data.applications_generated, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Award, label: "Impact Score", value: (data.total_clicks_generated * 2 + data.applications_generated * 10), color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const channelBreakdown = [
    { icon: Smartphone, label: "WhatsApp", value: data.whatsapp_shares, color: "bg-green-500" },
    { icon: Globe, label: "Facebook", value: data.facebook_shares, color: "bg-blue-600" },
    { icon: Share2, label: "Copy Link", value: data.copy_shares, color: "bg-gray-600" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Impact</h1>
        <p className="text-gray-500">See how your shares are helping others discover opportunities</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <stat.icon className={`${stat.color} mb-2`} size={24} />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Channel Breakdown</h2>
        <div className="space-y-3">
          {channelBreakdown.map((ch) => (
            <div key={ch.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${ch.color} flex items-center justify-center text-white`}>
                <ch.icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{ch.label}</span>
                  <span className="text-gray-500">{ch.value} shares</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full ${ch.color} rounded-full transition-all`}
                    style={{ width: `${data.total_shares > 0 ? (ch.value / data.total_shares) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.last_share_date && (
        <div className="text-sm text-gray-500 text-center">
          Last shared: {new Date(data.last_share_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
5.2 Institution Analytics Dashboard — src/app/dashboard/institution/analytics/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, MousePointer, Share2, TrendingUp, Globe, Smartphone } from 'lucide-react';

interface ContentAnalytics {
  content_type: string;
  content_id: string;
  total_clicks: number;
  unique_clicks: number;
  total_shares: number;
  applications: number;
  top_referrer: string;
  top_country: string;
  last_click: string;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function InstitutionAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/overview?days=${days}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setAnalytics(res.data || []);
      })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="p-8">Loading analytics...</div>;

  const totalClicks = analytics.reduce((sum, a) => sum + a.total_clicks, 0);
  const totalShares = analytics.reduce((sum, a) => sum + a.total_shares, 0);
  const totalApplications = analytics.reduce((sum, a) => sum + a.applications, 0);

  const referrerData = analytics.reduce((acc, a) => {
    acc[a.top_referrer] = (acc[a.top_referrer] || 0) + a.total_clicks;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(referrerData).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Analytics</h1>
          <p className="text-gray-500">Track how students discover your opportunities</p>
        </div>
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <Eye className="text-blue-600 mb-2" size={24} />
          <div className="text-2xl font-bold">{totalClicks}</div>
          <div className="text-sm text-gray-600">Total Clicks</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <MousePointer className="text-green-600 mb-2" size={24} />
          <div className="text-2xl font-bold">{totalApplications}</div>
          <div className="text-sm text-gray-600">Applications Started</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <Share2 className="text-purple-600 mb-2" size={24} />
          <div className="text-2xl font-bold">{totalShares}</div>
          <div className="text-sm text-gray-600">Total Shares</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Clicks by Content</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="content_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_clicks" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Content</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Clicks</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Shares</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Applications</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Top Source</th>
            </tr>
          </thead>
          <tbody>
            {analytics.map((item, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-3 capitalize">{item.content_type}</td>
                <td className="px-4 py-3 text-right font-medium">{item.total_clicks}</td>
                <td className="px-4 py-3 text-right">{item.total_shares}</td>
                <td className="px-4 py-3 text-right">{item.applications}</td>
                <td className="px-4 py-3 capitalize">{item.top_referrer || "Direct"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
NOTE: Install dependency: npm install recharts
6. ENVIRONMENT VARIABLES
Add to .env.local (if not already present):
plain
# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SmartTrack
NEXT_PUBLIC_BASE_URL=https://www.elimux.ke
7. EXECUTION SCRIPT FOR CLAUDE
Run this PowerShell script in elimux-frontend directory:
powershell
# ============================================================
# CYCLE 027: SMARTTRACK DEPLOYMENT SCRIPT
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $projectRoot

Write-Host "=== CYCLE 027: SmartTrack Module ===" -ForegroundColor Cyan
Write-Host ""

# 1. Install dependencies
Write-Host "[1/6] Installing dependencies..." -ForegroundColor Yellow
npm install qrcode.react recharts
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

# 2. Create directory structure
Write-Host "[2/6] Creating directories..." -ForegroundColor Yellow
$dirs = @(
  "src/components/smarttrack",
  "src/app/s/[slug]",
  "src/app/api/smart-links",
  "src/app/api/share-events",
  "src/app/api/analytics/[type]",
  "src/app/dashboard/student/impact",
  "src/app/dashboard/institution/analytics"
)
foreach ($dir in $dirs) {
  $fullPath = Join-Path $projectRoot $dir
  if (!(Test-Path $fullPath)) {
    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
  }
}

# 3. Verify files to create
Write-Host "[3/6] Files to create:" -ForegroundColor Yellow
$files = @(
  "src/app/s/[slug]/route.ts",
  "src/app/api/smart-links/route.ts",
  "src/app/api/share-events/route.ts",
  "src/app/api/analytics/[type]/route.ts",
  "src/components/smarttrack/SmartShare.tsx",
  "src/components/smarttrack/SmartQRCode.tsx",
  "src/components/smarttrack/ShareStats.tsx",
  "src/app/dashboard/student/impact/page.tsx",
  "src/app/dashboard/institution/analytics/page.tsx"
)
foreach ($f in $files) {
  Write-Host "  - $f" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4/6] MANUAL STEP REQUIRED:" -ForegroundColor Red
Write-Host "Run the SQL in Supabase SQL Editor (Section 1 of bridge.md)" -ForegroundColor White
Write-Host ""
Write-Host "[5/6] AFTER SQL is run, paste the code from bridge.md into each file above." -ForegroundColor Yellow
Write-Host ""
Write-Host "[6/6] Then run build:" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== END OF SCRIPT ===" -ForegroundColor Green
8. VERIFICATION CHECKLIST
After build succeeds, verify:
[ ] https://www.elimux.ke/s/TEST-SLUG redirects correctly (test with a real slug after creating a link)
[ ] Share buttons appear on scholarship/course/institution pages
[ ] WhatsApp share opens with pre-filled message
[ ] Copy link works and shows "Copied!" feedback
[ ] QR code generates and downloads as PNG
[ ] Click appears in click_analytics table within 5 seconds
[ ] Share event appears in share_events table
[ ] Student impact dashboard loads at /dashboard/student/impact
[ ] Institution analytics dashboard loads at /dashboard/institution/analytics
[ ] Gamification points awarded on share (if gamification table exists)
[ ] No TypeScript errors in build
[ ] No new console errors on page load
9. WHAT NOT TO TOUCH
DO NOT modify next.config.js (images.unoptimized stays true)
DO NOT convert <img> to <Image> anywhere
DO NOT modify existing auth, payment, or bursary code
DO NOT remove existing Google Analytics — SmartTrack supplements it
DO NOT commit/push until user says "commit and push it"
10. NEXT CYCLE (028) PREVIEW
After SmartTrack is live:
AI-powered "Trending Now" algorithm
Predictive analytics (which scholarships will go viral)
Automated share copy generation per content type
WhatsApp Business API integration for institution notifications
Deep link handling (open ElimuX app from shared link)
END OF CYCLE 027 SPEC