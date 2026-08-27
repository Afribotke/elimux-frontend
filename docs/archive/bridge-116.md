# Cycle 043 Report — Auth Guard Hardening: SHIPPED to preview branch,
## BLOCKED on manual testing (Vercel Deployment Protection)

## Status: Code implemented, committed, pushed to `auth-hardening-preview`,
## preview build green. NOT merged to main - waiting on YOU to run the
## 8-test matrix manually and report pass/fail.

Archived as `docs/archive/bridge-114.md` before this report replaced it
(was Cycle 042's report plus your two Gap-fill additions — the 8-test
matrix and the Cycle 043 code. Both used, with corrections below.)

## ✅ RESOLVED (2026-08-27T22:33:20Z): Google sign-in fixed, verified
## working in both production and preview

Root cause found: the "Elimux" OAuth client in Google Cloud Console was
created fresh on **Aug 26, 2026** (checked its own Creation date field) -
not reverted, a brand-new client - and only had `https://www.elimux.ke/
auth/callback` (our app's own page) registered as an Authorized redirect
URI. That's not what Google validates in this flow: Supabase brokers the
OAuth exchange, so Google checks the `redirect_uri` **Supabase** sends,
`https://ohlgjvenwekpbpkykutz.supabase.co/auth/v1/callback` - which
wasn't in the list at all.

With your go-ahead, added that URI as a second entry (kept the existing
one too - didn't remove anything) via the Google Cloud console at
console.cloud.google.com/auth/clients/133718286331-no02nn68qt8i9g2lrjnd2k3eav1qfvf5.apps.googleusercontent.com,
already logged into your account in the connected browser. Saved
successfully ("OAuth client saved" toast), verified persisted after a
fresh page reload.

Re-ran the same curl reproduction from before immediately after saving -
no propagation wait needed despite the console's own "5 minutes to a few
hours" note. Both confirmed fixed:
- `redirect_to=https://www.elimux.ke/auth/callback` (production) → lands
  on `accounts.google.com/v3/signin/identifier`, zero mismatch
- `redirect_to=<preview>/auth/callback` → same, zero mismatch

Google sign-in is live and working again, on both production and the
Cycle 043 preview branch. Matrix tests 1/2/5/7/8 are unblocked now.

## What was broken (for the record, now fixed - see above)

While you were testing, you hit `Error 400: redirect_uri_mismatch` for
`https://ohlgjvenwekpbpkykutz.supabase.co/auth/v1/callback` — the exact
URI Cycle 039 already fixed and verified working. Reproduced with a raw
curl straight to Supabase's `/authorize` endpoint, no app/Vercel involved:

```
curl -sL "https://ohlgjvenwekpbpkykutz.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://www.elimux.ke/auth/callback"
```

Same `redirect_uri_mismatch`, same client_id
(`133718286331-no02nn68qt8i9g2lrjnd2k3eav1qfvf5.apps.googleusercontent.com`),
**using production's own redirect target** — this has nothing to do with
the preview branch or this cycle's code. Google sign-in is dead on
`www.elimux.ke` right now, for every user, independent of whether Cycle
043 ever merges.

Confirmed cause (see resolution above): not a revert - the client itself
was recreated fresh on Aug 26 and simply never had this URI added.

## Preview URL

**https://elimux-frontend-app-git-auth-hardening-preview-afribotke.vercel.app**

This is the stable git-branch alias (rebuilds automatically on every push
to `auth-hardening-preview`), not a one-off deployment hash URL.

## Why I can't run the 8-test matrix myself

Tried. Two separate blockers, both real:

1. **Tests 1, 2, 5, 7, 8 need an actual Google OAuth click-through or a
   real password login, then a literal full browser close/reopen.**
   Browser automation can't do either safely — driving Google's real
   consent screen risks this machine's actual saved Google credentials
   (flagged as a hard no in Cycle 040's audit), and there's no way to
   simulate "close all windows, reopen" that actually proves cookie
   behavior — an automation-driven tab isn't a real browser restart.
2. **The preview URL itself is gated by Vercel Deployment Protection**
   (team SSO) — even test 6 (`?code=invalid`, no login needed at all)
   redirected straight to `vercel.com/login` instead of the app. Checked
   for a `VERCEL_AUTOMATION_BYPASS_SECRET` locally (not set) and tried the
   Vercel MCP tool for protection settings (403/404 — same access gap
   noted in a prior cycle's memory, MCP lacks this project's permissions;
   the authenticated `vercel` CLI works for deploys/inspect but project
   settings aren't exposed as a CLI subcommand either).

Asked you directly which way to unblock this - you chose "run the matrix
yourself." So: **please run all 8 tests from the matrix you gave me
(Gap 1, archived in `docs/archive/bridge-113.md`) against the preview URL
above, in incognito, and report back pass/fail per test.** I will not
touch `main` until you do.

## What I implemented (Gap 2), and what I corrected from your pasted code

Verified every file path and function shape against the real codebase
before applying anything (per the standing lesson that pasted scripts
tend to invent paths/schema) - found and fixed four real mismatches:

1. **File C's path was wrong.** You wrote `components/auth/AuthContext.tsx`
   — the real file is `src/context/AuthContext.tsx`. Patched the right one.
2. **File B's return shape would have broken all 34 callers.**
   `getUserWithTimeout()` returns `{ data: { user }, error }` (confirmed
   by reading a live caller, `student/dashboard/page.tsx:94`, which
   destructures `const { data: { user } } = await getUserWithTimeout()`).
   Your snippet returned `{ user: null, error }` - fixed to match the real
   shape.
3. **File D/E's plan (a shared `useRequireAuth()` hook, mechanically
   swapped into all 13 files) doesn't fit how those files are actually
   written.** Checked all 13: every one of them uses the session/user
   object *after* the guard check for its own data-fetching (role checks,
   `Authorization: Bearer ${session.access_token}` API calls, etc.) - a
   hook that only redirects and discards the session would break that
   downstream logic. Instead, patched each file's own existing
   `if (!session) {...}` check in place - same redirect target, same
   surrounding logic, just also requiring `hasValidSessionMarkers()`. Did
   not create `lib/hooks/useRequireAuth.ts`.
4. **The 13-file list itself had 2 wrong entries.** `advertiser/campaigns/
   [id]/page.tsx` doesn't exist - the real file is `advertiser/campaigns/
   detail/page.tsx` (query param `?id=`, not a dynamic segment - static
   export site, documented in that file's own header comment). And
   `advertiser/register/page.tsx` was missing from your list but isn't
   actually a guard anyway (only pre-fills an email field if a session
   happens to exist, never redirects) - correctly left out either way,
   for a different reason than the list implies. Also excluded
   `advertiser/page.tsx`, which your original audit counted as one of the
   13 `getSession()` call sites but is a dispatcher (session → dashboard,
   no session → login), not a protective guard - applying a marker check
   there would conflict with its own already-correct logic. **Real count:
   11 files, not 13.**

Also added one thing beyond what you specified: `AuthContext.tsx`'s
`onAuthStateChange` handler (not just its initial `getSession()` call)
now gets the same marker check. Without it, a background `TOKEN_REFRESHED`
event (Supabase's automatic silent refresh) would have silently
re-established `user`/`session` state a few seconds after the initial
check correctly logged someone out - undoing the whole feature. Flagging
this as an addition since you didn't ask for it, but the initial-check-only
version had this gap.

One more correction: `hasValidSessionMarkers()` checks for the cookie
value being exactly `elimux_active=1` / `elimux_remember=1`, not merely
`.includes('elimux_active=')` as your snippet had it - the looser check
would also match the *cleared* cookie (`elimux_active=; Max-Age=0`) in the
brief window before the browser actually drops it.

## Files changed (11 guard files + 3 shared files + docs)

`lib/supabase/client.ts` (added `hasValidSessionMarkers`),
`lib/client-auth.ts`, `src/context/AuthContext.tsx`,
`institution/dashboard`, `advertiser/dashboard`, `advertiser/campaigns`,
`advertiser/campaigns/detail`, `advertiser/billing`, `nita/dashboard`,
`nita/reports`, `nita/compliance`, `employer/attachments`,
`student/logbook`, `university/placements`. Also carried over Cycle 042's
files (callback route, login page, middleware) into the same commit,
since they hadn't been pushed yet. `npx tsc --noEmit`: 0 errors, both
before and after.

## Separate finding, not fixed (out of scope for this cycle)

`institution/dashboard/page.tsx` and all 4 advertiser guard files import
the *old* `@/lib/supabase` client, not the `@/lib/supabase/client`
singleton that `AuthContext.tsx`'s own header comment documents as the
fix for a past "Multiple GoTrueClient instances" production bug (broke
employer registration). Didn't touch it here - swapping a page's Supabase
client instance is a separate, larger-blast-radius change than adding one
condition to an existing check, and these 5 pages aren't reported broken
today. Flagging in case it's worth its own cycle.

## Git state right now

- `main` (local): 1 commit ahead of `origin/main` (`a95ea08`), NOT pushed.
  `origin/main` / production is untouched.
- `auth-hardening-preview`: pushed to origin, same commit, preview build
  green.
- Your in-progress Admin Users Page work (`admin/users/page.tsx`,
  `DataTable.tsx`, `UserDetailDrawer.tsx`, the two CSVs, the preview PNGs)
  was stashed before the auth commit and restored on `main` afterward -
  untouched, still uncommitted, exactly where you left it.

## What's needed from you

Run the 8-test matrix (archived in `docs/archive/bridge-113.md`) against
the preview URL above, in incognito, and report pass/fail per test. On an
all-pass, tell me to push local `main` to `origin/main` (equivalent to
"merge," since main already has the commit locally) - I'll do that and
then monitor for 30 minutes post-deploy per your original checklist,
watching Vercel for anything to roll back.

## Appendix: diagnostic check output (requested 2026-08-27, run from
## elimux-frontend/)

One note on how this was run: your original command 2 (`Select-String
-Pattern "google|signInWithOAuth"` over all `*.ts*` files) swept up
`tsconfig.tsbuildinfo` - a 480KB single-line build-cache JSON file, not
real code - and matched "google" somewhere inside TypeScript's bundled
`lib.dom.d.ts` type declarations it caches, producing ~481KB of noise.
Re-ran it excluding `.tsbuildinfo` files; every other command below is
your original command, output as-is.

### 1. Supabase project

```
NEXT_PUBLIC_SUPABASE_URL="https://ohlgjvenwekpbpkykutz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obGdqdmVud2VrcGJwa3lrdXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzMwMDcsImV4cCI6MjA5NzA0OTAwN30.8TeXK398gxeVawc5hn_fKUN6JrQqYWSmcXJnVrc-SgA"
```
(This is the public anon key - safe by design, meant to ship in the
client bundle; RLS is what actually gates access, not this key.)

### 2. Google/OAuth code references (16 matches, tsbuildinfo excluded)

```
src\app\layout.tsx:2:import { Inter } from "next/font/google";
src\app\layout.tsx:74:    googleBot: {
src\app\auth\login\page.tsx:85:  const handleGoogleSignIn = async () => {
src\app\auth\login\page.tsx:87:    // The redirect to Google navigates away from this page, so the markers
src\app\auth\login\page.tsx:93:    const { error: oauthError } = await supabase.auth.signInWithOAuth({
src\app\auth\login\page.tsx:94:      provider: 'google',
src\app\auth\login\page.tsx:186:              onClick={handleGoogleSignIn}
src\app\auth\login\page.tsx:195:              Sign in with Google
src\app\employer\page.tsx:111:              description="Your logo, your colors, your domain. SSO integration with Active Directory or Google Workspace."
src\app\internships\[id]\apply\page.tsx:258:                  placeholder="https://drive.google.com/..."
src\app\internships\[id]\apply\page.tsx:263:                    : 'Upload to Google Drive/Dropbox and paste the shareable link.'}
src\app\internships\[id]\apply\page.tsx:278:                  <p className="text-xs text-muted-foreground">Upload to Google Drive/Dropbox and paste the shareable link.</p>
src\app\s\[slug]\route.ts:45:  if (/google/i.test(referrer)) return 'search';
src\components\InstitutionLogo.tsx:9:// 2. Google's favicon service, derived from the institution's website domain,
src\components\InstitutionLogo.tsx:34:    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
src\components\skolex\SkolexHome.tsx:1:import { Libre_Baskerville, DM_Sans } from 'next/font/google'
tests\elimux-e2e.spec.ts:230:        !e.includes("google-analytics") &&
```
Only one is the actual OAuth call site (`auth/login/page.tsx`) - the
rest are an unrelated font import, SEO bot config, Drive-link upload
copy, referrer-sniffing, a favicon service, and an analytics exclusion
filter. No other page implements or references Google sign-in.

### 3. Login page OAuth call, with context

```
      // must be set now rather than after the round trip completes - they're
      // real cookies on the elimux.ke domain and survive the navigation.
      setSessionMarkers(rememberMe)
      const redirectParam = searchParams.get('redirect')
      const callbackUrl = `${window.location.origin}/auth/callback${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`
>     const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      })
      if (oauthError) setError(oauthError.message)
    }
```

### 4. Hardcoded client ID check

No matches for `133718286331` or `googleusercontent` anywhere in the
codebase (tsbuildinfo excluded). Confirms the Google OAuth client ID is
never referenced in app code at all - it's entirely a Supabase Auth
provider config, matching this cycle's earlier finding that the fix
lived in Google Cloud Console, not in this repo.

### 5. Middleware auth paths

```
  // Protected routes that require authentication
> const PROTECTED_PATHS = ["/dashboard", "/admin", "/bursary/provider/dashboard"]

  // Matches "bursary.elimux.ke" or "bursary.elimux.ke:<port>" (local/preview
  // dev) exactly — deliberately NOT a startsWith() check, since
  // host.startsWith('bursary.elimux.ke') would also match a spoofed host like
  // "bursary.elimux.ke.attacker.com".
> const BURSARY_HOST = /^bursary\.elimux\.ke(:\d+)?$/

  export async function middleware(request: NextRequest) {
    const host = request.headers.get('host') || ''

>   // Bursary Engine "Opening Soon" subdomain: rewrite every path to /bursary
    // (single coming-soon page today, per Cycle 016 — Task 2 creates only the
    // one page, so anything beyond the root still resolves to it via this
    // catch-all rewrite rather than 404ing).
>   if (BURSARY_HOST.test(host)) {
      ...
  export const config = {
>   // Broadened from the original ["/dashboard/:path*", "/admin/:path*",
    // "/internships", "/internships/"] — a strict superset, not a narrowing —
>   // because the bursary-host rewrite above needs to run on every path on
    // that subdomain (root "/", not just the four previously-matched
>   // patterns), not only on /dashboard, /admin, and /internships.
```
(Full file is `src/middleware.ts`, not `middleware.ts` at repo root - the
requested command was adjusted to the real path.)

### 6. bridge.md OAuth history

Skipped re-pasting verbatim - grepping bridge.md for OAuth/redirect_uri/
google/sign-in at this point mostly returns this same document's own
Cycle 043 + Google OAuth sections above, since that's what's live in the
file right now. Nothing from earlier archived cycles matched within the
30-line cap requested (Cycle 039's report is archived in
`docs/archive/bridge-110.md`/`111.md`, outside this file).

### 7. Git state

```
7a4d858 docs: Google OAuth redirect_uri_mismatch fixed - root cause + resolution
d3d7b13 docs: flag Google OAuth broken in production, unrelated to Cycle 043
3d7f4b6 docs: Cycle 043 status - shipped to preview, blocked on manual testing
a95ea08 Cycle 042/043: OAuth callback hardening + browser-close session expiry + auth guard hardening
367d959 docs: Step 0 audit for admin dashboard cycle - stopped per its own gate

 M src/app/admin/users/page.tsx
?? public/elimux-complete-image-inventory.pdf
?? public/og-image-solid-bg.png
?? public/previews/
?? public/table-1787829636220.csv
?? public/table-1787829673294.csv
?? src/components/admin/DataTable.tsx
?? src/components/admin/UserDetailDrawer.tsx
```
The 7 modified/untracked entries are your in-progress Admin Users Page
work (Cycle brief archived in `docs/archive/bridge-113.md`) - unchanged
since it was stashed and restored earlier this cycle. `main` is 3 commits
ahead of `origin/main` (the auth-hardening commit plus 2 docs commits),
none of it pushed to `origin/main` yet - still holding for your test
results before that push.
