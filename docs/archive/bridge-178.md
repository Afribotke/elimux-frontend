# CYCLE 178 — Alerts Rebuild: Real Data, Real Notifications
# File: docs/bridge.md

## GOAL
Replace the broken Alerts feature (Cycle 028) with a working notification system:
1. Create the `trending_alerts` table that has never existed
2. Auto-generate alerts when real events happen (new program applications)
3. Display real, readable alerts in the institution dashboard
4. Proper error handling — no more silent `.catch(() => {})` masking 500s

## OUT OF SCOPE (future cycles)
- Email/push notifications
- Real-time WebSocket updates
- Alert preferences/settings
- Non-application alert types (reviews, view milestones) — keep it to one trigger for now

---

## MANDATORY LOCAL BUILD VERIFICATION PROTOCOL
After ALL code changes:
1. Run `npm run build` (heap flags: `NODE_OPTIONS="--max-old-space-size=2560" NEXT_PRIVATE_SKIP_SOURCEMAPS=1 npm run build`)
2. Confirm exit code 0, zero TypeScript errors
3. Local browser verification (unauthenticated routes only — no password entry):
   - `/institution/dashboard/alerts` redirects to login when not authenticated (no crash)
   - `/institution/login` renders correctly
4. DO NOT commit or push until user explicitly says "commit and push it"

---

## PART 0 — PRE-FLIGHT

### Step 0.1: Ensure clean working tree
```bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
git status
If uncommitted changes exist, stash them:
bash
git stash push -m "cycle-178-pre-stash"
Step 0.2: Verify what tables actually exist
Run in Supabase SQL Editor:
sql
-- Confirm program_applications exists and has institution_id (directly or via join)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'program_applications' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Confirm programs table has institution_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'programs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if reviews table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'reviews';
Report the results. If program_applications does NOT exist or lacks a path to institution_id, STOP and report — the trigger design below assumes it does.
PART 1 — Database Schema (Supabase SQL Editor)
Step 1.1: Create the trending_alerts table
Open Supabase Dashboard → SQL Editor → New query. Paste and run:
sql
-- ============================================
-- CYCLE 178: Create trending_alerts table
-- ============================================

CREATE TABLE IF NOT EXISTS public.trending_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_application', 'program_published', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by institution + read status
CREATE INDEX IF NOT EXISTS idx_trending_alerts_institution_read 
ON public.trending_alerts(institution_id, read_at);

-- Index for recent-first ordering
CREATE INDEX IF NOT EXISTS idx_trending_alerts_created 
ON public.trending_alerts(created_at DESC);

-- RLS: Enable
ALTER TABLE public.trending_alerts ENABLE ROW LEVEL SECURITY;

-- RLS: Institution admins can only see their own alerts
CREATE POLICY "Institution admins can view own alerts"
ON public.trending_alerts
FOR SELECT
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM public.institution_accounts 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- RLS: Institution admins can update own alerts (mark as read)
CREATE POLICY "Institution admins can update own alerts"
ON public.trending_alerts
FOR UPDATE
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM public.institution_accounts 
        WHERE user_id = auth.uid() AND status = 'active'
    )
)
WITH CHECK (
    institution_id IN (
        SELECT institution_id FROM public.institution_accounts 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- RLS: Service role can insert (for triggers/functions)
CREATE POLICY "Service role can insert alerts"
ON public.trending_alerts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Verify
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename = 'trending_alerts' ORDER BY policyname;
Step 1.2: Create trigger function for new applications
Run this in the same SQL Editor session:
sql
-- ============================================
-- CYCLE 178: Auto-generate alert on new application
-- ============================================

CREATE OR REPLACE FUNCTION public.create_application_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_institution_id UUID;
    v_program_name TEXT;
    v_institution_name TEXT;
BEGIN
    -- Get institution_id via programs table
    SELECT p.institution_id, p.name 
    INTO v_institution_id, v_program_name
    FROM public.programs p
    WHERE p.id = NEW.program_id;

    -- Only proceed if we resolved an institution
    IF v_institution_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get institution name for the message
    SELECT name INTO v_institution_name
    FROM public.institutions
    WHERE id = v_institution_id;

    -- Insert the alert
    INSERT INTO public.trending_alerts (
        institution_id,
        type,
        title,
        message,
        metadata
    ) VALUES (
        v_institution_id,
        'new_application',
        'New Application Received',
        format('A new student has applied for %s at %s.', v_program_name, v_institution_name),
        jsonb_build_object(
            'application_id', NEW.id,
            'program_id', NEW.program_id,
            'program_name', v_program_name,
            'applicant_name', COALESCE(NEW.applicant_name, 'A student')
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists, then create trigger
DROP TRIGGER IF EXISTS application_alert_trigger ON public.program_applications;

CREATE TRIGGER application_alert_trigger
    AFTER INSERT ON public.program_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.create_application_alert();

-- Verify trigger exists
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE trigger_name = 'application_alert_trigger';
Stop and confirm: The verify query should return 1 row. If program_applications table or applicant_name column doesn't exist, the trigger will fail — report the actual error and STOP.
PART 2 — Update Alerts API (Real Data, Real Errors)
Step 2.1: Replace src/app/api/institution/alerts/route.ts
Overwrite the entire file:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve institution via institution_accounts (active only)
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { success: false, error: 'No active institution account found' },
      { status: 403 }
    );
  }

  const { data: alerts, error: alertsError } = await supabase
    .from('trending_alerts')
    .select('*')
    .eq('institution_id', account.institution_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (alertsError) {
    console.error('Alerts fetch error:', alertsError);
    return NextResponse.json(
      { success: false, error: 'Failed to load alerts' },
      { status: 500 }
    );
  }

  const unreadCount = (alerts || []).filter((a) => !a.read_at).length;

  return NextResponse.json({
    success: true,
    data: alerts || [],
    unreadCount,
  });
}
Step 2.2: Update src/app/api/institution/alerts/[id]/read/route.ts
Overwrite the entire file:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve institution via institution_accounts (active only)
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { success: false, error: 'No active institution account found' },
      { status: 403 }
    );
  }

  const { error: updateError } = await supabase
    .from('trending_alerts')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('institution_id', account.institution_id);

  if (updateError) {
    console.error('Alert read error:', updateError);
    return NextResponse.json(
      { success: false, error: 'Failed to mark alert as read' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
PART 3 — Update Alerts Frontend (Real UI, No Silent Failures)
Step 3.1: Replace src/app/institution/dashboard/alerts/page.tsx
Overwrite the entire file:
tsx
'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export default function InstitutionAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/institution/alerts');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load alerts');
      }

      setAlerts(json.data || []);
      setUnreadCount(json.unreadCount || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/institution/alerts/${id}/read`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to mark as read');
      }
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <div>
          <p className="font-medium text-gray-900">Could not load alerts</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              // Mark all as read (fire and forget, refresh after)
              Promise.all(
                alerts.filter((a) => !a.read_at).map((a) => markAsRead(a.id))
              ).then(() => fetchAlerts());
            }}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
          <Bell className="h-10 w-10 text-gray-300" />
          <div>
            <p className="font-medium text-gray-900">No alerts yet</p>
            <p className="text-sm text-gray-500">
              Notifications appear here when students apply to your programs.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                alert.read_at
                  ? 'border-gray-200 bg-white'
                  : 'border-primary/20 bg-primary/5'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'new_application' ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
              {!alert.read_at && (
                <button
                  onClick={() => markAsRead(alert.id)}
                  className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
Step 3.2: Check for date-fns dependency
bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
npm ls date-fns
If NOT installed, install it:
bash
npm install date-fns
Then re-run build.
PART 4 — Local Build Verification
bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
set NODE_OPTIONS=--max-old-space-size=2560
set NEXT_PRIVATE_SKIP_SOURCEMAPS=1
npm run build
Confirm:
Exit code 0
Zero TypeScript errors
No date-fns import errors
Browser verification (unauthenticated only):
http://localhost:3000/institution/dashboard/alerts → redirects to /institution/login (no crash, no infinite loop)
Console is clean
PART 5 — Staging Protocol (DO NOT COMMIT YET)
After build passes:
bash
git status
Stage with explicit pathspec:
bash
git add src/app/api/institution/alerts/route.ts
git add src/app/api/institution/alerts/\[id\]/read/route.ts
git add src/app/institution/dashboard/alerts/page.tsx
If date-fns was installed, also stage:
bash
git add package.json package-lock.json
Review diff:
bash
git diff --cached --stat
STOP. Report the diff stat.
DO NOT run git commit or git push until user explicitly says "commit and push it."