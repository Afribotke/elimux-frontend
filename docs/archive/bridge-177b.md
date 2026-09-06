# CYCLE 177-B — Permission Consolidation + Navigation Fix
# File: docs/bridge.md

## GOAL
Unify the three parallel institution-permission systems into one source of truth
(`institution_accounts.status = 'active'`), add navigation between built-but-invisible
dashboard pages, fix RLS on `institution_accounts`, and rename the duplicate "Analytics"
surface.

## MANDATORY LOCAL BUILD VERIFICATION PROTOCOL
After ALL code changes are applied:
1. Run `npm run build` (with heap flags: `NODE_OPTIONS="--max-old-space-size=4096" NEXT_PRIVATE_SKIP_SOURCEMAPS=1 npm run build`)
2. Confirm exit code 0, zero TypeScript errors
3. Verify in local browser:
   - `/institution/login` → log in → redirects to `/institution/dashboard`
   - Dashboard shows left sidebar with: Dashboard, Alerts, Link Performance
   - Click each nav item → page loads, sidebar stays visible, active state correct
   - Alerts page loads data (not permanently empty)
   - Sign out button works
4. Stage changes with EXPLICIT pathspec (never `git add -A`)
5. DO NOT commit or push until user explicitly says "commit and push it"

---

## PART 0 — PRE-FLIGHT

### Step 0.1: Ensure clean working tree
```bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
git status
If there are uncommitted changes, stash them:
bash
git stash push -m "cycle-177-b-pre-stash"
Step 0.2: Check for references to old analytics path
bash
grep -r "institution/dashboard/analytics" src/ --include="*.tsx" --include="*.ts" --include="*.md"
Note any matches — they will be updated in Part 5.
PART 1 — Database Migration (Supabase Dashboard)
Open Supabase Dashboard → SQL Editor → New query. Paste and run:
sql
-- ============================================
-- CYCLE 177-B: Permission Consolidation
-- ============================================

-- 1. Backfill institutions.admin_user_id from institution_accounts
--    (Safety net for any legacy data during transition)
UPDATE public.institutions i
SET admin_user_id = ia.user_id
FROM public.institution_accounts ia
WHERE i.id = ia.institution_id
  AND i.admin_user_id IS NULL
  AND ia.status = 'active';

-- 2. Add RLS policy: users can SELECT their own institution account row
CREATE POLICY IF NOT EXISTS "Users can view own institution account"
ON public.institution_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Add RLS policy: users can UPDATE their own institution account row
CREATE POLICY IF NOT EXISTS "Users can update own institution account"
ON public.institution_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Verify policies were created
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'institution_accounts'
ORDER BY policyname;
Stop and confirm: The verify query should return 2 rows (SELECT and UPDATE policies).
PART 2 — Rewrite Alerts API (Unified Permission)
Step 2.1: Replace src/app/api/institution/alerts/route.ts
Overwrite the entire file with:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // UNIFIED PERMISSION: resolve institution via institution_accounts (active only)
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (accountError || !account) {
    // Return empty array with 200 to preserve existing frontend contract
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .eq('institution_id', account.institution_id)
    .order('created_at', { ascending: false });

  if (alertsError) {
    console.error('Alerts fetch error:', alertsError);
    return NextResponse.json({ success: false, error: alertsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: alerts || [] });
}
Step 2.2: Replace src/app/api/institution/alerts/[id]/read/route.ts
Overwrite the entire file with:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // UNIFIED PERMISSION: resolve institution via institution_accounts (active only)
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
    .from('alerts')
    .update({ read_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('institution_id', account.institution_id);

  if (updateError) {
    console.error('Alert read error:', updateError);
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
PART 3 — Rewrite Attachment Upload API (Unified Permission)
Step 3.1: Read current file first
Read src/app/api/institutions/attachment/upload/route.ts and note the business logic
below the auth check (the part that parses students and inserts rows).
Step 3.2: Replace auth section only, preserve business logic
Replace the entire file, but keep the existing student-processing logic intact.
The auth block at the top must be replaced with this pattern:
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // UNIFIED PERMISSION: resolve institution via institution_accounts (active only)
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (accountError || !account) {
    return NextResponse.json(
      { success: false, error: 'Active institution account required' },
      { status: 403 }
    );
  }

  const institutionId = account.institution_id;

  // ============================================
  // PRESERVE ALL EXISTING BUSINESS LOGIC BELOW
  // (student parsing, auth user creation, attachment_eligible_students insert)
  // Just replace any hardcoded institution_id resolution with `institutionId` above.
  // ============================================
  
  // ... existing payload parsing ...
  // ... existing loop creating auth users ...
  // ... existing insert into attachment_eligible_students using `institutionId` ...
  
  // Return shape must match existing frontend expectation.
}
Critical: Do not change the request/response contract. Only the auth check and
institution resolution change.
PART 4 — Add Shared Dashboard Layout + Navigation
Step 4.1: Create src/app/institution/dashboard/layout.tsx
Create this new file:
tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Bell,
  Link as LinkIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/institution/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/institution/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/institution/dashboard/link-performance', label: 'Link Performance', icon: LinkIcon },
];

export default function InstitutionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/institution/login');
        return;
      }
      setIsLoading(false);
    };
    checkSession();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/institution/login');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white shadow-sm transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <span className="text-lg font-bold text-gray-900">Institution Portal</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1 hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="border-t p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
          <span className="text-lg font-bold text-gray-900">Institution Portal</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
Step 4.2: Remove duplicate headers from child pages
Read these files and remove any top-level header, nav, or "Institution Portal" title
that duplicates the sidebar layout:
src/app/institution/dashboard/alerts/page.tsx
src/app/institution/dashboard/analytics/page.tsx (will be renamed in Part 5)
Rule: Each page should render ONLY its main content. The layout provides the shell.
If a page has its own <header>, <nav>, or sign-out button, remove it.
Do NOT modify src/app/institution/dashboard/page.tsx — its internal tabs
(Profile / Programs / Analytics) are part of the dashboard content, not duplicate chrome.
PART 5 — Rename Analytics Page to Link Performance
Step 5.1: Copy and rename
bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
# Create new directory
mkdir src\app\institution\dashboard\link-performance
# Copy the old analytics page to the new location
copy src\app\institution\dashboard\analytics\page.tsx src\app\institution\dashboard\link-performance\page.tsx
Step 5.2: Update the new page title
Open src/app/institution/dashboard/link-performance/page.tsx.
Find and replace any page title or heading that says "Analytics" with "Link Performance".
Example changes:
<h1>Analytics</h1> → <h1>Link Performance</h1>
<title>Analytics</title> → <title>Link Performance</title>
Any breadcrumb or header text: "Analytics" → "Link Performance"
Step 5.3: Create redirect at old path
Overwrite src/app/institution/dashboard/analytics/page.tsx with:
tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/institution/dashboard/link-performance');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-500">Redirecting to Link Performance...</p>
    </div>
  );
}
Step 5.4: Update any hardcoded references
If Step 0.2 found any matches for institution/dashboard/analytics, update them to
institution/dashboard/link-performance.
PART 6 — Local Build Verification
Run the build:
bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_PRIVATE_SKIP_SOURCEMAPS=1
npm run build
Confirm:
Exit code 0
Zero TypeScript errors
No new warnings related to institution/dashboard routes
Then verify in browser:
http://localhost:3000/institution/login → log in with a test institution account
Should redirect to /institution/dashboard with sidebar visible on left
Sidebar shows: Dashboard (active), Alerts, Link Performance
Click Alerts → page loads, sidebar stays, URL is /institution/dashboard/alerts
Click Link Performance → page loads, sidebar stays, URL is /institution/dashboard/link-performance
Click Dashboard → returns to main dashboard
Click Sign Out → redirects to /institution/login
Mobile: hamburger menu opens/closes sidebar
If any step fails, fix before proceeding.
PART 7 — Staging Protocol (DO NOT COMMIT YET)
After build passes and browser verification is complete:
bash
git status
Stage ONLY the files touched in this cycle with explicit pathspec:
bash
git add src/app/api/institution/alerts/route.ts
git add src/app/api/institution/alerts/\[id\]/read/route.ts
git add src/app/api/institutions/attachment/upload/route.ts
git add src/app/institution/dashboard/layout.tsx
git add src/app/institution/dashboard/link-performance/
git add src/app/institution/dashboard/analytics/page.tsx
git add src/app/institution/dashboard/alerts/page.tsx
Review the diff:
bash
git diff --cached --stat
STOP. Report the diff stat to the user.
DO NOT run git commit or git push until user explicitly says "commit and push it."