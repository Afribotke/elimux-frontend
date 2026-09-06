# CYCLE 179 — Smart Invite Pages (Path A)
# File: docs/bridge.md

## GOAL
Build a beautiful, trackable, shareable invite landing page for institutions.
Every university gets a personalized URL like `www.elimux.ke/invite/institution/abc123` that
shows the ElimuX logo, the institution's name, a value proposition, and a "Claim Profile" CTA.
Every click is tracked. A QR code is generated for physical sharing.

## WHAT EXISTS (from audit — do not rebuild)
- `/join` — public institution search with "Claim Profile" CTA
- `/institution/register` — registration with domain auto-verification
- `institutions` table — master directory with name, website_url, etc.
- `program_views` table — existing tracking pattern to follow

## WHAT WE BUILD
1. `institution_invites` table + `invite_clicks` table (Supabase)
2. `POST /api/invites/institution` — generate an invite token
3. `GET /api/invites/institution/[token]` — validate token, return institution data
4. `POST /api/invites/institution/[token]/track` — log a click
5. `/invite/institution/[token]` — beautiful invite landing page (logo, QR code, CTA)
6. Update `/join` — add "Invite this institution" flow for unclaimed/unlisted institutions

## MANDATORY LOCAL BUILD VERIFICATION PROTOCOL
After ALL code changes:
1. Run `npm run build` (heap flags: `NODE_OPTIONS="--max-old-space-size=2560" NEXT_PRIVATE_SKIP_SOURCEMAPS=1 npm run build`)
2. Confirm exit code 0, zero TypeScript errors
3. Local browser verification:
   - `http://localhost:3000/invite/institution/test` shows 404 or "Invalid invite" (no crash)
   - `http://localhost:3000/join` renders correctly
4. DO NOT commit or push until user explicitly says "commit and push it"

---

## PART 0 — PRE-FLIGHT

### Step 0.1: Ensure clean working tree
```bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
git status
If uncommitted changes exist, stash them:
bash
git stash push -m "cycle-179-pre-stash"
Step 0.2: Check for existing logo file
bash
ls public/ | grep -i logo
ls public/ | grep -i elimux
Report what logo files exist. We need the path for the invite page.
Step 0.3: Check if qrcode package exists
bash
npm ls qrcode
If NOT installed, install it:
bash
npm install qrcode
npm install --save-dev @types/qrcode
PART 1 — Database Schema (Supabase SQL Editor)
Run this as a single query:
sql
-- ============================================
-- CYCLE 179: Invite System Schema
-- ============================================

-- 1. Institution invites table
CREATE TABLE IF NOT EXISTS public.institution_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    token VARCHAR(16) NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_institution_invites_token 
ON public.institution_invites(token);

-- Index for institution lookups
CREATE INDEX IF NOT EXISTS idx_institution_invites_institution 
ON public.institution_invites(institution_id);

-- 2. Detailed click tracking (follows program_views pattern)
CREATE TABLE IF NOT EXISTS public.invite_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_token VARCHAR(16) NOT NULL REFERENCES public.institution_invites(token) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    referrer TEXT,
    country TEXT,
    device_type TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_clicks_token 
ON public.invite_clicks(invite_token);

CREATE INDEX IF NOT EXISTS idx_invite_clicks_created 
ON public.invite_clicks(created_at DESC);

-- 3. RLS
ALTER TABLE public.institution_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_clicks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend uses service key)
CREATE POLICY "Service role full access on institution_invites"
ON public.institution_invites
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on invite_clicks"
ON public.invite_clicks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('institution_invites', 'invite_clicks');
Confirm: Verify query returns 2 rows.
PART 2 — Backend API Routes
Step 2.1: Create src/app/api/invites/institution/route.ts
Create this new file:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function generateToken(): string {
  return randomBytes(8).toString('hex').slice(0, 16);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { institution_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.institution_id) {
    return NextResponse.json({ success: false, error: 'institution_id required' }, { status: 400 });
  }

  // Verify institution exists
  const { data: institution, error: instError } = await supabase
    .from('institutions')
    .select('id')
    .eq('id', body.institution_id)
    .single();

  if (instError || !institution) {
    return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });
  }

  // Generate unique token
  let token = generateToken();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('institution_invites')
      .select('id')
      .eq('token', token)
      .single();

    if (!existing) break;
    token = generateToken();
    attempts++;
  }

  const { data: invite, error: insertError } = await supabase
    .from('institution_invites')
    .insert({
      institution_id: body.institution_id,
      token,
      created_by: user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (insertError) {
    console.error('Invite creation error:', insertError);
    return NextResponse.json({ success: false, error: 'Failed to create invite' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      token: invite.token,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.elimux.ke'}/invite/institution/${invite.token}`,
      expires_at: invite.expires_at,
    },
  });
}
Step 2.2: Create src/app/api/invites/institution/[token]/route.ts
Create directory and file:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invite, error: inviteError } = await supabase
    .from('institution_invites')
    .select('*, institutions(*)')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ success: false, error: 'Invalid or expired invite' }, { status: 404 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: 'Invite expired' }, { status: 410 });
  }

  return NextResponse.json({
    success: true,
    data: {
      institution: invite.institutions,
      token: invite.token,
      click_count: invite.click_count,
    },
  });
}
Step 2.3: Create src/app/api/invites/institution/[token]/track/route.ts
Create this new file:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // Resolve invite
  const { data: invite, error: inviteError } = await supabase
    .from('institution_invites')
    .select('token, institution_id')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ success: false, error: 'Invalid invite' }, { status: 404 });
  }

  // Increment click count
  await supabase.rpc('increment_invite_clicks', { invite_token: token });

  // Log detailed click
  const { error: clickError } = await supabase.from('invite_clicks').insert({
    invite_token: token,
    institution_id: invite.institution_id,
  });

  if (clickError) {
    console.error('Click tracking error:', clickError);
  }

  return NextResponse.json({ success: true });
}
Step 2.4: Create the RPC function in Supabase
Run this in Supabase SQL Editor:
sql
-- ============================================
-- CYCLE 179: Increment invite clicks safely
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_invite_clicks(invite_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.institution_invites
  SET click_count = click_count + 1, updated_at = now()
  WHERE token = invite_token;
END;
$$;

-- Verify
SELECT proname FROM pg_proc WHERE proname = 'increment_invite_clicks';
PART 3 — Invite Landing Page
Step 3.1: Create src/app/invite/institution/[token]/page.tsx
Create directory and file:
tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Users, ArrowRight, Share2 } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

async function getInviteData(token: string) {
  const supabase = await createClient();

  const { data: invite, error } = await supabase
    .from('institution_invites')
    .select('*, institutions(*)')
    .eq('token', token)
    .single();

  if (error || !invite) return null;
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return null;

  return invite;
}

async function getInstitutionCount() {
  const supabase = await createClient();
  const { count } = await supabase
    .from('institutions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  return count || 0;
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { token } = await params;
  const invite = await getInviteData(token);

  if (!invite) {
    return { title: 'Invite Not Found | ElimuX' };
  }

  const institution = invite.institutions as { name: string; description?: string; logo_url?: string };
  return {
    title: `${institution.name} — Join ElimuX`,
    description: institution.description || `Claim your institution's profile on ElimuX and connect with students worldwide.`,
    openGraph: {
      title: `${institution.name} is invited to ElimuX`,
      description: 'Join 200+ institutions already on the platform.',
      images: institution.logo_url ? [institution.logo_url] : [],
    },
  };
}

export default async function InstitutionInvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invite = await getInviteData(token);

  if (!invite) {
    notFound();
  }

  const institution = invite.institutions as {
    id: string;
    name: string;
    description?: string;
    city?: string;
    country?: string;
    website_url?: string;
    logo_url?: string;
    type?: string;
  };

  const institutionCount = await getInstitutionCount();

  // Generate QR code data URL
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.elimux.ke'}/invite/institution/${token}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(inviteUrl, { width: 200, margin: 2 });
  } catch {
    // QR generation failed, continue without it
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ElimuX"
              width={40}
              height={40}
              className="rounded-lg"
              unoptimized
            />
            <span className="text-xl font-bold text-gray-900">ElimuX</span>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Explore Platform
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero Card */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          {/* Top accent */}
          <div className="h-2 bg-primary" />

          <div className="p-8 text-center sm:p-12">
            {/* Institution Logo */}
            {institution.logo_url ? (
              <Image
                src={institution.logo_url}
                alt={institution.name}
                width={80}
                height={80}
                className="mx-auto mb-6 rounded-xl object-contain"
                unoptimized
              />
            ) : (
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-10 w-10 text-primary" />
              </div>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {institution.name}
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-lg text-gray-600">
              Your students are searching for you. Claim your free profile on ElimuX and get discovered by thousands of prospective students.
            </p>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              {institution.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {institution.city}
                  {institution.country ? `, ${institution.country}` : ''}
                </span>
              )}
              {institution.type && (
                <span className="rounded-full bg-gray-100 px-3 py-1">{institution.type}</span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-10">
              <a href={`/institution/register?invite=${token}&institution=${institution.id}`}>
                <Button size="lg" className="gap-2 px-8 py-6 text-lg">
                  Claim Your Free Profile
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <p className="mt-3 text-sm text-gray-400">Free forever. No credit card required.</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid divide-y border-t bg-gray-50/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">{institutionCount}+</p>
              <p className="text-sm text-gray-500">Institutions</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">50K+</p>
              <p className="text-sm text-gray-500">Monthly Searches</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">Global</p>
              <p className="text-sm text-gray-500">Reach</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrDataUrl && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">Share this invite</span>
            </div>
            <Image
              src={qrDataUrl}
              alt="QR Code"
              width={200}
              height={200}
              className="mx-auto mt-4"
              unoptimized
            />
            <p className="mt-2 text-xs text-gray-400">Scan to open on mobile</p>
          </div>
        )}

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>Trusted by leading institutions across Africa</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-white py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} ElimuX. All rights reserved.</p>
      </footer>
    </div>
  );
}
CRITICAL: If the logo file is NOT at /public/logo.png, update the <Image src="..."> path in the header to match the real file found in Step 0.2.
PART 4 — Update /join with Invite Flow
Step 4.1: Read current /join page
Read src/app/join/page.tsx (or wherever the public institution search lives). Identify:
Where search results render
Where "Claim Profile" CTA appears
Where "no results" state renders
Step 4.2: Add "Invite Institution" button
In the search results section, when an institution is found but NOT claimed, add a button that generates an invite:
tsx
// Inside the search result card, next to "Claim Profile":
<button
  onClick={async () => {
    const res = await fetch('/api/invites/institution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institution_id: institution.id }),
    });
    const json = await res.json();
    if (json.success) {
      // Copy invite URL to clipboard
      await navigator.clipboard.writeText(json.data.url);
      alert(`Invite link copied: ${json.data.url}`);
    } else {
      alert('Failed to generate invite');
    }
  }}
  className="..."
>
  Generate Invite Link
</button>
In the "no results" state, add:
tsx
<div className="text-center">
  <p className="text-gray-500">Can't find your institution?</p>
  <a href="/contact" className="text-primary hover:underline">
    Suggest an institution
  </a>
</div>
Note: The exact insertion point depends on the current /join page structure. Read the file first, then add the invite button in the appropriate place.
PART 5 — Client-Side Click Tracking
Step 5.1: Add tracking script to invite page
In src/app/invite/institution/[token]/page.tsx, add a client component that fires the tracking POST on page load.
Create src/app/invite/institution/[token]/tracker.tsx:
tsx
'use client';

import { useEffect } from 'react';

export default function InviteTracker({ token }: { token: string }) {
  useEffect(() => {
    // Fire tracking ping
    fetch(`/api/invites/institution/${token}/track`, { method: 'POST' }).catch(() => {
      // Silent fail — don't block the page
    });
  }, [token]);

  return null;
}
Then import and render it in the page component:
tsx
import InviteTracker from './tracker';

// Inside the page component, before the return:
<InviteTracker token={token} />
PART 6 — Local Build Verification
bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
set NODE_OPTIONS=--max-old-space-size=2560
set NEXT_PRIVATE_SKIP_SOURCEMAPS=1
npm run build
Confirm:
Exit code 0
Zero TypeScript errors
No qrcode import errors
No Image component errors
Browser verification (unauthenticated):
http://localhost:3000/invite/institution/faketoken → shows 404 page (no crash)
http://localhost:3000/join → renders correctly
PART 7 — Staging Protocol (DO NOT COMMIT YET)
After build passes:
bash
git status
Stage with explicit pathspec:
bash
git add src/app/api/invites/
git add src/app/invite/institution/
git add src/app/join/page.tsx
If qrcode was installed, also stage:
bash
git add package.json package-lock.json
Review diff:
bash
git diff --cached --stat
STOP. Report the diff stat.
DO NOT run git commit or git push until user explicitly says "commit and push it."
