# Cycle 045 Report — "Login Page Critical Error Fix": NOT implemented,
## needs clarification first

## Status: Audited the brief against the real codebase before touching
## anything. Found it doesn't match this project closely enough to apply
## safely - would fail the build outright, revert Cycles 042-044's work,
## and its own Step 4 skips straight to `git push origin main` with no
## preview/testing gate, unlike every other change this session.

Archived as `docs/archive/bridge-120.md` before this replaced it.

## What the brief assumes vs. what's actually here

**Step 1 targets `app/login/page.tsx` (i.e. `src/app/login/page.tsx`),
not the page we've been hardening.** That file already exists, and it's
a deliberately thin 30-line redirect shim to `/auth/login` (preserving
query params) - zero Supabase calls, zero session logic, nothing for a
"defensive" rewrite to protect against. The brief's version would replace
it with a 160-line stateful component that:
- imports `{ supabase }` from `@/lib/supabase/client` - that file exports
  a `createClient()` function, there is no `supabase` named export
- imports `@supabase/auth-ui-react` and `@supabase/auth-ui-shared` -
  **neither is in package.json.** Checked directly: only `@supabase/ssr`
  and `@supabase/supabase-js` are installed. This alone would fail
  `npm run build` with unresolved-module errors.
- Would also functionally collide with the real login page at
  `src/app/auth/login/page.tsx` this shim redirects to, which already has
  its own session check, remember-me, and error handling built this
  session.

**Step 2 targets `auth/callback/route.ts` - the exact file Cycles 042 and
044 hardened.** The brief's version uses `@supabase/auth-helpers-nextjs`
(also not in package.json - deprecated years ago, superseded by
`@supabase/ssr`, which is what this project actually uses throughout)
and calls `cookies()` without `await` (wrong for Next.js 15, confirmed
this project runs 15.5.22 - our real `server.ts` correctly awaits it).
Applying it would revert: the no-code check, the exchange-error handling
with specific `?error=` codes, `?redirect=` passthrough, and the
`email_confirmed_at` check from Cycle 044 - replacing all of it with a
version that redirects unconditionally to `/dashboard` and uses a
different error-param name (`auth_error` vs. this project's established
`error`/`message`) that the actual login page doesn't even read.

**Step 3 proposes creating `global-error.tsx` "if not present."** It's
present - `src/app/global-error.tsx`, existing since Aug 5 (predates this
session), functionally equivalent to what's proposed (same "Critical
Error" messaging, reset button, home link) but already using this
project's icon system and `error.digest` instead of a raw stack trace.
Nothing to fix here.

**Step 4 says `git add -A && git commit && git push origin main`** -
directly to production, no branch, no preview deploy, no test checklist.
Every other change this session (Cycles 042/043/044) went through a
preview branch first specifically because the founder asked for that
workflow. Given the above, this step would push code that fails to build
in the first place.

## Checked for a real underlying bug before dismissing this

Tried `get_runtime_errors` via the Vercel MCP tool (403 - same
per-project access gap as every other MCP call on this project this
session) and `vercel logs www.elimux.ke` via the authenticated CLI
instead. No errors in recent production traffic - `/login/` and
`/auth/login/` both returning healthy `304`s. Nothing corroborates an
actual crash matching this brief's premise.

## What I need from you before doing anything here

What's the actual symptom? A screenshot, a Sentry/error-tracking link, a
user report, a specific reproduction ("clicked X, saw Y") - anything
concrete. If there's a real bug, I'd rather fix the actual thing that's
broken in this codebase's real shape than adapt a template that assumes
a different one. If nothing is actually broken right now, this may be
worth shelving rather than spending a cycle "fixing" a page that
currently works and has no error reports behind it.
