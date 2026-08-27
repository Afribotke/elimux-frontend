# Cycle 042 Report — OAuth Callback Hardening + Session-Expiry-on-Browser-Close +
## Role-Dashboard Auth Guard Audit

## Status: OAuth callback + browser-close session expiry SHIPPED (build green,
## 0 TypeScript errors). Auth guard audit COMPLETE, found a real gap, fix
## NOT yet applied — needs a scoping decision before touching 30+ files.

Archived as `docs/archive/bridge-113.md` before this report replaced it
(was mid-flight: an "Admin Users Page: Search, Filter, Sort, Pagination,
Bulk Actions" cycle brief that had not yet been executed or reported on —
still there, untouched, ready to pick up after this).

## Part 1 — OAuth callback route hardening

`app/auth/callback/route.ts` previously called
`supabase.auth.exchangeCodeForSession(code)` without checking `code` was
present or that the exchange succeeded — a failed/cancelled OAuth flow
silently fell through to a redirect as if signed in, with no session and
no error shown. Fixed:
- No `code` in the URL → redirect to `/auth/login?error=oauth_no_code&message=...`
- `exchangeCodeForSession` error → logged server-side, redirect to
  `/auth/login?error=oauth_exchange_failed&message=<the real error>`
- Success → redirect honors `?redirect=` (falls back to `/dashboard`)

`app/auth/login/page.tsx`:
- Google sign-in now passes `?redirect=` through to the callback URL, so
  it's honored the same way the password flow already does (previously
  Google sign-in always landed on `/dashboard`, ignoring the original
  `?redirect=` on the login page itself).
- Added a `useEffect` that reads `?error=`/`?message=` on mount and shows
  them in the existing error banner, so a failed OAuth callback redirect
  is now actually visible to the user instead of failing silently.

## Part 2 — Session expires on browser close, unless "remember this device"

Founder wants: close the browser fully → logged out (protects
students/staff on shared/cyber-cafe computers), unless the user opts in
to staying signed in on that device for 30 days.

**Why this isn't just a cookie `maxAge` change:** `lib/supabase/client.ts`
caches the browser Supabase client as a module-level singleton (documented
fix from a prior cycle — without it, every re-render spun up its own
GoTrueClient and `getSession()` intermittently missed a valid session,
which broke employer registration in production). That singleton's cookie
options are fixed at construction time, which happens on component mount
— before a user has touched a "remember me" checkbox. Baking a dynamic
`maxAge` into it can't react to the checkbox, and hand-rolling a custom
cookie read/write adapter to make it dynamic risks breaking Supabase's own
chunked-cookie handling for large JWTs (`sb-*-auth-token.0`, `.1`, etc.).

**What shipped instead:** two independent marker cookies, layered on top
of (not replacing) Supabase's own auth cookie:
- `elimux_active` — a true browser-session cookie (no `Max-Age`), set on
  every sign-in. Disappears when the browser fully closes.
- `elimux_remember` — a 30-day cookie, set only if "Remember this device
  for 30 days" is checked (new checkbox on the login form).

`middleware.ts` (which already gated `/dashboard`, `/admin`, and
`/bursary/provider/dashboard` by checking for presence of the Supabase
auth cookie) now also requires `elimux_active` OR `elimux_remember` to be
present. The bursary-subdomain rewrite logic in the same file is
untouched.

`lib/supabase/client.ts` gained `setSessionMarkers(remember)` and
`clearSessionMarkers()`. Sign-out is handled by wrapping
`browserClient.auth.signOut` once, at the point the singleton is created,
rather than editing call sites — there are **nine** of them across the app
(`AdvertiserNav`, `partner/login`, `nita/login`, `institution/dashboard`,
`admin/layout`, `bursary/provider/dashboard/layout`,
`auth/reset-password`, plus the two shared `AuthContext`/`hooks.ts`
sign-out functions) and editing all nine individually risked missing one.

Files changed: `app/auth/callback/route.ts`, `app/auth/login/page.tsx`,
`lib/supabase/client.ts`, `middleware.ts`. `npx tsc --noEmit` clean, 0
errors.

## Part 3 — Auth guard audit (read-only, no code changes yet)

The middleware fix above only covers the 3 path prefixes middleware
itself gates. Everything else — every employer/student/institution/
advertiser/partner/nita/bursary page — enforces its own auth client-side,
and **none of it knows about `elimux_active`/`elimux_remember` yet.**
Audited every such route. Two patterns cover almost everything:

**Pattern A — shared helper, 34 files.** `lib/client-auth.ts`'s
`getUserWithTimeout()` (explicitly documented in that file as "use in
EVERY client page that checks auth state"). Covers all of
`employer/(portal)/*`, `student/dashboard`, `student/profile`,
`student/trade-test`, `partner/dashboard`, `partner/page.tsx`,
`ads/self-serve/*`, `bursary/*` (page, provider/dashboard, fund/[id],
profile, notifications, bookmarks, my-applications),
`internships/page.tsx`, `internships/my-applications`,
`internships/[id]/apply`, `scholarships/favorites`.

**Pattern B — ad-hoc `supabase.auth.getSession()` in a `useEffect`, no
shared helper, 13 files.** `institution/dashboard`, `advertiser/*` (page,
dashboard, campaigns, campaigns/detail, billing, register — 6 files),
`nita/*` (dashboard, reports, compliance — 3 files),
`employer/attachments`, `student/logbook`, `university/placements`.

**Plus `AuthContext.tsx`** — its own `getSession()` call feeds `useAuth()`,
consumed by `applications/*` and anything else using that hook.

Every route checked DOES redirect an unauthenticated user away — there's
no "wide open" page in this set. The gap is narrower: they all trust
Supabase's own session cookie validity, which is unrelated to our new
markers, so a session that should have died on browser close (no
"remember me") can still let someone back into these pages if Supabase's
own cookie happens to still be valid.

**Recommendation, not yet actioned:** patch two chokepoints instead of
30+ files —`getUserWithTimeout()` in `lib/client-auth.ts` and the session
effect in `AuthContext.tsx`, both adding the same marker check middleware
now does. That covers Pattern A and the `applications/*`/`useAuth()`
surface in one move each. The 13 Pattern-B files have no shared helper, so
each needs the same one-line check added individually, or a small shared
`hasValidSessionMarkers()` util pulled out of `lib/supabase/client.ts`
first.

## What's needed from you (or the founder)

Nothing blocking on Part 1/2 — both are live-ready pending normal
build/deploy. Part 3 is a decision point: confirm the two-chokepoint plan
before it touches `client-auth.ts`/`AuthContext.tsx` (shared by dozens of
pages), and confirm whether the 13 Pattern-B files should get a shared
util first or be patched inline one by one.
Gap 1: The 8-Test Matrix (here it is)
Table
#	Test	Steps	Expected Result
1	Google OAuth, no remember me, browser close	Sign in with Google → do NOT check "Remember me" → close all browser windows → reopen → visit preview URL	Redirected to /auth/login
2	Google OAuth, remember me, browser close	Sign in with Google → CHECK "Remember me" → close all browser windows → reopen → visit preview URL	Still logged in, lands on dashboard
3	Password login, no remember me, browser close	Sign in with email/password → do NOT check "Remember me" → close all browser windows → reopen → visit preview URL	Redirected to /auth/login
4	Password login, remember me, browser close	Sign in with email/password → CHECK "Remember me" → close all browser windows → reopen → visit preview URL	Still logged in, lands on dashboard
5	OAuth cancelled at Google consent screen	Click "Sign in with Google" → click "Cancel" on Google's consent screen	Back to /auth/login with error banner visible
6	OAuth callback with bad code	Manually visit /auth/callback?code=invalid	Redirected to /auth/login?error=oauth_exchange_failed with error banner
7	Redirect param honored (Google)	Visit /auth/login?redirect=/scholarships → sign in with Google	Lands on /scholarships
8	Redirect param honored (password)	Visit /auth/login?redirect=/scholarships → sign in with password	Lands on /scholarships
Gap 2: Cycle 043 Implementation (complete code for Claude)
File A: lib/supabase/client.ts — add hasValidSessionMarkers
Add this function to the existing file (after the createClient function, before exports):
TypeScript
export function hasValidSessionMarkers(): boolean {
  if (typeof document === 'undefined') return true; // SSR — let middleware handle it
  return document.cookie.includes('elimux_active=') || document.cookie.includes('elimux_remember=');
}
File B: lib/client-auth.ts — patch getUserWithTimeout
Find the function and add the marker check after the Supabase call succeeds but before returning:
TypeScript
// After: const { data: { user }, error } = await supabase.auth.getUser();
// Add this block before the final return:

if (user && !hasValidSessionMarkers()) {
  return { user: null, error: new Error('Session expired. Please sign in again.') };
}
File C: components/auth/AuthContext.tsx — patch session loader
Find the getSession() call inside the useEffect. After it resolves:
TypeScript
// After: const { data: { session } } = await supabase.auth.getSession();
// Add:

if (session && !hasValidSessionMarkers()) {
  setSession(null);
  setUser(null);
  setLoading(false);
  return;
}
File D: lib/hooks/useRequireAuth.ts — new shared hook (create this file)
TypeScript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, hasValidSessionMarkers } from '@/lib/supabase/client';

export function useRequireAuth(redirectTo: string = '/auth/login') {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !hasValidSessionMarkers()) {
        router.replace(redirectTo);
      }
    };
    check();
  }, [redirectTo, router]);
}
File E: Migrate 13 Pattern-B files to useRequireAuth
For each of these files, replace their ad-hoc useEffect + getSession auth check with:
TypeScript
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

// Inside the component:
useRequireAuth();
Files to migrate:
app/institution/dashboard/page.tsx
app/advertiser/page.tsx
app/advertiser/dashboard/page.tsx
app/advertiser/campaigns/page.tsx
app/advertiser/campaigns/[id]/page.tsx
app/advertiser/billing/page.tsx
app/nita/dashboard/page.tsx
app/nita/reports/page.tsx
app/nita/compliance/page.tsx
app/employer/attachments/page.tsx
app/student/logbook/page.tsx
app/university/placements/page.tsx
Execution Order for Claude
Implement all 5 files above (A through E)
Run npx tsc --noEmit — must be 0 errors
Create branch: git checkout -b auth-hardening-preview && git push -u origin auth-hardening-preview
Wait for Vercel preview URL
Run the 8-test matrix in incognito windows
Report back results — pass/fail per test
Only after all 8 pass: merge to main
Do not proceed to step 3 until step 2 shows 0 TypeScript errors.
