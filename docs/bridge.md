# Cycle 044 Status (in progress, 2026-08-27T23:24:52Z) — Auth Security
## Hardening: gate cleared, Scenario B confirmed, implementing now

Archived as `docs/archive/bridge-117.md` before this replaced it (full
history of the OAuth fix + re-audit is there and in earlier archives -
this is a fresh status page, not a replacement of that record).

## Section 0 audit — complete

- **0.1** No `signUp` call anywhere in `src/app/auth/login/page.tsx` -
  only `signInWithPassword` and `signInWithOAuth`.
- **0.2** Founder confirmed: Supabase's "Confirm email" toggle is **OFF**.
  Tried to check this myself first (connected browser wasn't logged into
  the Supabase dashboard, the Supabase MCP connector has no auth-config
  read endpoint, no Management API token exists in this project's env
  files) - genuinely needed the founder's manual check, unlike the
  Google Cloud Console fix earlier where the browser was already
  authenticated.
- **0.3** Confirmed absent: `auth/callback/route.ts` has no
  `email_confirmed_at` check; the one "verified" match in
  `AuthContext.tsx` was a false positive (unrelated comment about a past
  GoTrueClient bug); a codebase-wide sweep for `email_confirmed_at`
  returns zero matches anywhere.

**→ Scenario B** (no signUp on login / toggle OFF / no gate) - meaning
until this ships, any email/password signup anywhere in the app gets a
live, fully-privileged session with zero email verification. Real gap,
live right now.

## Section 2 fix — in progress

**Done:** `src/app/auth/login/page.tsx` - added the verification check
right after `signInWithPassword` succeeds. Used `data.session.user.
email_confirmed_at` directly from the sign-in response instead of the
brief's suggested extra `getUser()` call - same effect, one fewer
network round trip, since Supabase's sign-in response already includes
the full user object.

**Next, not yet done:**
- `src/app/auth/callback/route.ts` (OAuth path - real path, not `app/
  auth/callback/route.ts` as the brief had it)
- `src/middleware.ts` - the brief says "add inside the existing auth
  check," but there is no existing Supabase-client-based check in
  middleware to add into. Cycle 043 already established this file only
  checks cookie *presence*, it never calls Supabase at all. Building the
  actual client creation (with proper cookie forwarding) rather than
  assuming it's already there.

**Known coverage gap, flagging now rather than after the fact:** exactly
like Cycle 043's session-marker work, `middleware.ts` only gates 3 paths
(`/dashboard`, `/admin`, `/bursary/provider/dashboard`). The email
verification check as scoped by this brief (login page + callback +
middleware) will **not** reach the role-specific dashboards (employer,
student, institution, advertiser, nita, etc.) that have their own
independent auth guards - same structural gap Cycle 043 mapped in full.
Not expanding scope to fix that here without asking first, since it's
the same 30+-file blast radius as before; noting it as a likely
follow-up once this narrower brief ships.

## Still needed from the founder

Flip the "Confirm email" toggle ON in Supabase Dashboard → Authentication
→ Providers → Email. I can't do this - no dashboard access and no
Management API token available to do it programmatically. Without it,
new email/password signups still won't require verification even after
this code ships (the code-level gate only catches sign-*in*, not the
initial signup step itself - Supabase's own toggle is what blocks an
unconfirmed signup from getting a session in the first place).
