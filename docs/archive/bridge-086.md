Cycle 027 — SmartTrack Module (CORRECTED POST-AUDIT)
ElimuX Education Intelligence Layer
AUDIT RESULTS APPLIED
SQL ran successfully: smart_links, click_analytics, share_events all created (0 rows, confirmed).
Policy names unquoted (syntax fix applied).
Using @supabase/ssr (existing src/lib/supabase/server.ts) — NOT installing deprecated @supabase/auth-helpers-nextjs.
Next.js 15 async params convention used everywhere.
URL mapping fixed: course -> /programs/{id}, bursary -> /bursary/fund/{id}.
NEXT_PUBLIC_BASE_URL not used; hardcoded https://www.elimux.ke fallback.
ShareStats endpoint fixed: content case added to analytics route.
QR logo uses /icon-192x192.png (real file).
recharts already installed; only qrcode.react needs install.
SmartShare.tsx NOT created — instead, upgrade EXISTING ShareButton.tsx + ShareBottomSheet.tsx to use smart links.
Dashboard paths: /student/dashboard/impact and /institution/dashboard/analytics (real app tree).
1. INSTALL DEPENDENCIES
powershell
cd "C:/Users/ELON/Projects-2026/IDEA STORE/elimux-frontend"
npm install qrcode.react
Skip recharts — already installed (^3.10.1).
Skip @supabase/auth-helpers-nextjs — deprecated, use existing @supabase/ssr pattern.
2. CREATE DIRECTORIES
powershell
$projectRoot = "C:/Users/ELON/Projects-2026/IDEA STORE/elimux-frontend"
Set-Location $projectRoot
$dirs = @(
  "src/components/smarttrack",
  "src/app/s/[slug]",
  "src/app/api/smart-links",
  "src/app/api/share-events",
  "src/app/api/analytics/[type]",
  "src/app/student/dashboard/impact",
  "src/app/institution/dashboard/analytics"
)
foreach ($dir in $dirs) {
  $fullPath = Join-Path $projectRoot $dir
  if (!(Test-Path $fullPath)) { New-Item -ItemType Directory -Path $fullPath -Force | Out-Null }
}
3. API ROUTES
3.1 Redirect Engine — src/app/s/[slug]/route.ts
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

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry') || 'Unknown';
    const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
    const sessionId = request.cookies.get('elimux_session')?.value || crypto.randomUUID();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentClicks } = await supabase
      .from('click_analytics')
      .select("id")
      .eq("smart_link_id", link.id)
      .eq("ip_address", ip)
      .gte("clicked_at", twentyFourHoursAgo)
      .limit(1);

    const isUnique = !recentClicks || recentClicks.length === 0;

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
      if (isUnique) {
        supabase.from('smart_links').update({ unique_clicks: link.unique_clicks + 1 }).eq('id', link.id);
      }
    }).catch(() => {});

    const destinationUrl = new URL(getDestinationUrl(link.content_type, link.content_id));
    if (link.utm_source) destinationUrl.searchParams.set("utm_source", link.utm_source);
    if (link.utm_medium) destinationUrl.searchParams.set("utm_medium", link.utm_medium);
    if (link.utm_campaign) destinationUrl.searchParams.set("utm_campaign", link.utm_campaign);
    destinationUrl.searchParams.set("utm_content", slug);
    destinationUrl.searchParams.set("elimux_ref", sessionId);

    const response = NextResponse.redirect(destinationUrl.toString(), 302);
    response.cookies.set('elimux_session', sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('SmartTrack redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
3.2 Smart Link API — src/app/api/smart-links/route.ts
TypeScript
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
3.3 Share Event API — src/app/api/share-events/route.ts
TypeScript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    if (user) {
      await supabase.from('gamification_points').insert({
        user_id: user.id,
        action: 'share_content',
        points: 5,
        metadata: { content_type: contentType, content_id: contentId, channel }
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, event: data });

  } catch (error) {
    console.error('Share event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
3.4 Analytics API — src/app/api/analytics/[type]/route.ts
TypeScript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');
    const days = parseInt(searchParams.get('days') || '30');
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query: any;

    switch (type) {
      case 'overview':
        query = supabase
          .from('smart_links')
          .select(`id, slug, content_type, content_id, total_clicks, unique_clicks, created_at`)
          .eq("created_by", user.id)
          .gte("created_at", fromDate);
        break;

      case 'content':
        if (!contentType || !contentId) {
          return NextResponse.json({ error: 'contentType and contentId required' }, { status: 400 });
        }
        query = supabase
          .from('content_performance')
          .select("*")
          .eq("content_type", contentType)
          .eq("content_id", contentId)
          .single();
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
        query = supabase
          .from('click_analytics')
          .select(`smart_link_id, smart_links!inner(content_type, content_id), count`)
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
4. NEW COMPONENTS
4.1 SmartQRCode — src/components/smarttrack/SmartQRCode.tsx
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

  useEffect(() => { setMounted(true); }, []);

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
            src: '/icon-192x192.png',
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
4.2 ShareStats — src/components/smarttrack/ShareStats.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { Eye, Share2, MousePointer, TrendingUp } from 'lucide-react';

interface ShareStatsProps {
  contentType: string;
  contentId: string;
}

interface Stats {
  total_clicks: number;
  unique_clicks: number;
  total_shares: number;
  top_referrer: string;
}

export default function ShareStats({ contentType, contentId }: ShareStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/content?contentType=${contentType}&contentId=${contentId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.data); })
      .finally(() => setLoading(false));
  }, [contentType, contentId]);

  if (loading) return <div className="h-16 bg-gray-100 animate-pulse rounded-lg" />;
  if (!stats) return null;

  const items = [
    { icon: Eye, label: "Views", value: stats.total_clicks || 0 },
    { icon: MousePointer, label: "Unique", value: stats.unique_clicks || 0 },
    { icon: Share2, label: "Shares", value: stats.total_shares || 0 },
    { icon: TrendingUp, label: "Top Source", value: stats.top_referrer || "Direct" },
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
5. MODIFY EXISTING SHARE COMPONENTS
5.1 Upgrade ShareButton.tsx
File: src/components/share/ShareButton.tsx (or wherever the existing share button lives)
Add this function INSIDE the component (before the return statement):
TypeScript
// Add to imports:
import { useState } from 'react';

// Inside the component, add state:
const [smartLink, setSmartLink] = useState<string>("");

// Add this function:
const getSmartLink = async (contentType: string, contentId: string): Promise<string> => {
  if (smartLink) return smartLink;
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
    console.error("Smart link failed:", e);
  }
  return typeof window !== "undefined" ? window.location.href : "";
};
Then, in the onClick handler that opens the share sheet, call getSmartLink() first and pass the resulting short URL into the share sheet instead of the raw page URL.
5.2 Upgrade ShareBottomSheet.tsx
File: src/components/share/ShareBottomSheet.tsx
Add to the share action handlers (WhatsApp, Facebook, X, LinkedIn, Email, Copy):
TypeScript
// After a share channel is used, fire the tracking event:
const trackShare = async (channel: string) => {
  try {
    await fetch("/api/share-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId, channel })
    });
  } catch { /* silently fail */ }
};
Call trackShare("whatsapp"), trackShare("facebook"), etc. in each respective handler.
Add a QR Code button at the bottom of the share sheet:
tsx
import SmartQRCode from '@/components/smarttrack/SmartQRCode';

// Inside the bottom sheet, after the share grid:
<div className="mt-4 pt-4 border-t border-gray-200">
  <SmartQRCode url={shareUrl} title="Scan to share" size={160} />
</div>
6. ADD SHARESTATS TO DETAIL PAGES
On pages that already have share buttons (scholarships, programs, institutions, attachments, internships, bursaries), add the stats widget above the share button:
tsx
import ShareStats from '@/components/smarttrack/ShareStats';

<div className="mt-6 space-y-4">
  <ShareStats contentType="scholarship" contentId={scholarship.id} />
  {/* existing share button below */}
</div>
Use the correct contentType for each page: scholarship, course (for programs), institution, attachment, internship, bursary.
7. DASHBOARD PAGES
7.1 Student Impact — src/app/student/dashboard/impact/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { Eye, Share2, Users, Award, Smartphone, Globe } from 'lucide-react';

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
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading your impact...</div>;
  if (!data) return <div className="p-8">No sharing activity yet. Start sharing opportunities!</div>;

  const stats = [
    { icon: Share2, label: "Total Shares", value: data.total_shares, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Eye, label: "Clicks Generated", value: data.total_clicks_generated, color: "text-green-600", bg: "bg-green-50" },
    { icon: Users, label: "Applications Generated", value: data.applications_generated, color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Award, label: "Impact Score", value: (data.total_clicks_generated * 2 + data.applications_generated * 10), color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const channels = [
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
          {channels.map((ch) => (
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
7.2 Institution Analytics — src/app/institution/dashboard/analytics/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, MousePointer, Share2 } from 'lucide-react';

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
      .then(res => { if (res.success) setAnalytics(res.data || []); })
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="p-8">Loading analytics...</div>;

  const totalClicks = analytics.reduce((sum, a) => sum + (a.total_clicks || 0), 0);
  const totalShares = analytics.reduce((sum, a) => sum + (a.total_shares || 0), 0);
  const totalApplications = analytics.reduce((sum, a) => sum + (a.applications || 0), 0);

  const referrerData = analytics.reduce((acc, a) => {
    if (a.top_referrer) acc[a.top_referrer] = (acc[a.top_referrer] || 0) + (a.total_clicks || 0);
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
          {pieData.length > 0 ? (
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
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No referrer data yet</div>
          )}
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
                <td className="px-4 py-3 text-right font-medium">{item.total_clicks || 0}</td>
                <td className="px-4 py-3 text-right">{item.total_shares || 0}</td>
                <td className="px-4 py-3 text-right">{item.applications || 0}</td>
                <td className="px-4 py-3 capitalize">{item.top_referrer || "Direct"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
8. EXECUTION ORDER
Run in this exact sequence:
powershell
cd "C:/Users/ELON/Projects-2026/IDEA STORE/elimux-frontend"

# 1. Install only qrcode.react
npm install qrcode.react

# 2. Create directories
$dirs = @(
  "src/components/smarttrack",
  "src/app/s/[slug]",
  "src/app/api/smart-links",
  "src/app/api/share-events",
  "src/app/api/analytics/[type]",
  "src/app/student/dashboard/impact",
  "src/app/institution/dashboard/analytics"
)
foreach ($dir in $dirs) {
  $fullPath = Join-Path $projectRoot $dir
  if (!(Test-Path $fullPath)) { New-Item -ItemType Directory -Path $fullPath -Force | Out-Null }
}
Then create each file with the code above:
Table
#	File	Action
1	src/app/s/[slug]/route.ts	Create new
2	src/app/api/smart-links/route.ts	Create new
3	src/app/api/share-events/route.ts	Create new
4	src/app/api/analytics/[type]/route.ts	Create new
5	src/components/smarttrack/SmartQRCode.tsx	Create new
6	src/components/smarttrack/ShareStats.tsx	Create new
7	src/app/student/dashboard/impact/page.tsx	Create new
8	src/app/institution/dashboard/analytics/page.tsx	Create new
9	src/components/share/ShareButton.tsx	Modify — add getSmartLink
10	src/components/share/ShareBottomSheet.tsx	Modify — add trackShare + QR
11	Detail pages (scholarships, programs, etc.)	Modify — add ShareStats
Finally: npm run build
9. VERIFICATION CHECKLIST
[ ] npm run build passes with zero TypeScript errors
[ ] https://www.elimux.ke/s/TEST-SLUG redirects to correct content page
[ ] Click logged in click_analytics within 5 seconds of redirect
[ ] Share button on scholarship page generates smart link before sharing
[ ] WhatsApp share opens with pre-filled message containing short URL
[ ] Copy link shows "Copied!" and copies short URL
[ ] QR code generates with ElimuX logo and downloads as PNG
[ ] Share event logged in share_events when any channel used
[ ] Gamification points awarded on share (if user logged in)
[ ] ShareStats widget shows views/shares on detail pages
[ ] /student/dashboard/impact loads student impact dashboard
[ ] /institution/dashboard/analytics loads institution analytics
[ ] No duplicate share buttons on any page
[ ] No <img> converted to <Image>
[ ] images.unoptimized unchanged in next.config.js
10. GUARDRAILS — DO NOT
DO NOT install @supabase/auth-helpers-nextjs (deprecated)
DO NOT install recharts (already installed)
DO NOT create SmartShare.tsx (upgrade existing share components instead)
DO NOT create dashboards at /dashboard/student or /dashboard/institution (use real paths)
DO NOT modify next.config.js
DO NOT convert <img> to <Image>
DO NOT modify auth, payment, or bursary logic
DO NOT commit/push until user says "commit and push it"
END OF CORRECTED SPEC — EXECUTE NOW
