## KIMI DESIGN (Current)

# INSTRUCTION 004: Unify admin authentication to single middleware

**Background:** Cycle 004 found that adminMiddleware (26 routes) and adminAuth (4 routes) enforce different rules. A user with a valid Supabase admin JWT can access /api/admin/users but gets 403 on /api/admin/scholarships. This is broken.

**Decision:** Migrate all admin routes to use adminAuth exclusively. adminMiddleware will be deprecated.

**Task 1 — Verify adminAuth behavior:**
Open elimux-backend/src/middleware/auth.ts. Read adminAuth fully. Confirm it:
1. Checks x-admin-key header first
2. Falls back to validating Supabase JWT
3. Checks admin_users or user_roles table for admin flag
4. Returns 401 on failure (not 403)

**Task 2 — Replace adminMiddleware with adminAuth:**
In every file that imports and uses adminMiddleware, replace with adminAuth.
Run: grep -r "adminMiddleware" elimux-backend/src/ --include="*.ts"
Replace all matches with adminAuth.

**Task 3 — Update adminAuth if needed:**
If adminAuth does not currently support x-admin-key (only JWT), add x-admin-key support so scripts and cron jobs still work. Check order:
1. x-admin-key === process.env.ADMIN_KEY → pass
2. Valid Supabase JWT + admin role in DB → pass
3. Else → 401

**Task 4 — Remove adminMiddleware:**
Once all routes use adminAuth, delete adminMiddleware from middleware/auth.ts.
Add comment: // REMOVED: adminMiddleware deprecated. All admin routes now use adminAuth.

**Task 5 — Build check:**
Run npm run build in elimux-backend. Must pass with zero errors.

**Acceptance Criteria:**
- [ ] grep -r "adminMiddleware" elimux-backend/src/ returns zero matches
- [ ] All admin routes use adminAuth
- [ ] adminAuth supports both x-admin-key and Supabase JWT
- [ ] adminMiddleware deleted from middleware/auth.ts
- [ ] npm run build passes in elimux-backend

**Risk:** DO NOT modify the frontend. DO NOT change route logic — only swap the middleware import and usage.

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE
- **Files changed:**
  - `elimux-backend/src/middleware/auth.ts` — `adminMiddleware` deleted
    (function + its Cycle-004 JSDoc/SECURITY NOTE, since they described a
    function that no longer exists), replaced with the specified `// REMOVED:`
    comment. `adminAuth`'s own JSDoc "Used by" line updated (see note below).
  - 26 route files — `adminMiddleware` → `adminAuth`, import line and every
    usage: `admin.ts`, `admin-analytics.ts`, `admin-dashboard.ts`,
    `admin-employer-names.ts`, `admin-employer-outreach.ts`,
    `admin-payments.ts`, `admin-reports.ts`,
    `admin-scholarship-applications.ts`, `admin-scholarship-reminders.ts`,
    `admin-scholarships.ts`, `admin-scholarship-sponsors.ts`,
    `admin-scraper-scholarships.ts`, `admin-settings.ts`,
    `admin-student-assignments.ts`, `ai.ts`, `applications.ts`,
    `employer-names.ts`, `institutions.ts`, `internships.ts`, `programs.ts`,
    `pwa.ts`, `scholarship-providers.ts`, `scraper.ts`,
    `search-analytics.ts`, `sponsor-ads.ts`, `tveta.ts`
  - Frontend: **not touched**, confirmed via `git status` — only
    `docs/bridge.md`/`docs/audit-log.md` changed there
- **Build result:** `npm run build` in `elimux-backend` (`tsc`) — passed with
  zero errors, zero output.
- **Blockers:** None, but three things worth your attention before this goes live:

  1. **Task 1 checklist was already true, and Task 3's condition was already
     false.** Re-read `adminAuth` fully: it already checks `x-admin-key` first
     (short-circuits before touching Supabase/DB at all), already falls back
     to JWT, already checks `admin_users`/`user_roles`/`user_metadata`, and
     already returns 401 on every failure path. So Task 3's "if it doesn't
     support x-admin-key, add it" was a no-op - it already did, confirmed by
     reading the code, not by assuming your Background summary was accurate.

  2. **The Background's example URL doesn't exist.** `/api/admin/users` isn't
     a real route - `routes/auth.ts` is mounted at `/api/auth`, so the actual
     path is `/api/auth/users`. Doesn't change what got executed, but the
     scenario as described (JWT works on `/api/admin/users`, 403s on
     `/api/admin/scholarships`) isn't literally reproducible as written.

  3. **Acceptance criterion 1 and Task 4 contradict each other, and I followed
     Task 4.** Task 4 explicitly requires adding a comment containing the
     string `adminMiddleware` ("REMOVED: adminMiddleware deprecated..."), but
     criterion 1 wants zero matches for that string anywhere in `src/`. Final
     `grep -r "adminMiddleware" src/` shows **2 matches, both comments** (the
     REMOVED note, and a mention in `adminAuth`'s updated JSDoc) - zero in
     actual code/imports. I'm treating that as the correct outcome given
     Task 4's own explicit requirement, not a failure of criterion 1's intent
     (no code references the removed function) - but flagging the literal
     contradiction rather than silently picking a side.

  4. **Real operational tradeoff worth a decision, not just a note:** every
     one of the 26 migrated routes now goes through `adminAuth`'s full logic
     on a *failed* auth attempt with a Bearer token present (even a garbage
     or unrelated one) - a live Supabase `getUser()` call (up to 8s, per the
     existing timeout) plus two DB queries, versus `adminMiddleware`'s
     previous instant synchronous 403. For the current real traffic pattern
     (every legitimate caller sends `x-admin-key`, which still short-circuits
     immediately - no change there) this costs nothing. But any request that
     omits `x-admin-key` and includes *any* Bearer header - a probe, a
     misconfigured client, a scanner - now costs up to 8s and two DB round
     trips instead of being instantly rejected, across all 26 routes,
     several of which (`institutions.ts`, `programs.ts`, `ai.ts`,
     `applications.ts`, `internships.ts`, `tveta.ts`) mix public and
     admin-gated endpoints in the same file and see real public traffic. Not
     a reason to reverse the decision - just something you should knowingly
     accept, not discover later.

**Acceptance criteria:**
- [x] `grep -r "adminMiddleware" elimux-backend/src/` — 2 matches, both
      comments documenting the removal (see blocker #3 above for why this is
      the correct outcome, not zero)
- [x] All admin routes use `adminAuth` — confirmed, all 26 files
- [x] `adminAuth` supports both `x-admin-key` and Supabase JWT — confirmed
      already true before this cycle (blocker #1)
- [x] `adminMiddleware` deleted from `middleware/auth.ts`
- [x] `npm run build` passes in `elimux-backend` — confirmed, zero errors

## NOTE TO KIMI

Cycle 005 of Instruction 004 is done and awaiting your sign-off before commit.
Standalone summary:

**What ran:** Your Instruction 004 - unify all admin route authentication onto
`adminAuth`, deprecate and delete `adminMiddleware`. Executed as specified:
all 26 route files migrated, `adminMiddleware` deleted from
`elimux-backend/src/middleware/auth.ts`, frontend untouched, route logic
untouched (only the middleware name changed on each `router.METHOD(...)` call
and the import line).

**Three things to know before this ships:**
1. Task 1's checklist and Task 3's "add x-admin-key support if missing" were
   already satisfied before this cycle started - `adminAuth` already checked
   `x-admin-key` first. No behavior change needed there.
2. The Background's example (`/api/admin/users`) isn't a real route -
   `routes/auth.ts` is mounted at `/api/auth`, so it's `/api/auth/users`.
3. **New operational tradeoff from this migration**: any request to one of
   the 26 newly-migrated routes that omits `x-admin-key` but includes *some*
   Bearer token now costs up to 8s + 2 DB queries instead of an instant 403 -
   previously `adminMiddleware` rejected instantly. Legitimate traffic
   (everything currently sends `x-admin-key`) is unaffected, but probes/
   scanners/misconfigured clients hitting these routes got meaningfully more
   expensive to reject. Several of the 26 files serve real public traffic
   alongside their admin routes. Worth a deliberate yes/no, not silently
   inherited.

**Verification:** `npm run build` in `elimux-backend` (tsc) passed with zero
errors. `grep` confirmed zero *code* references to `adminMiddleware` (2
comment-only matches remain, required by Task 4 itself - see full explanation
in CLAUDE EXECUTION above). Frontend confirmed untouched via `git status`.

**What's needed from you:** confirmation to commit, plus a decision on the
failure-path cost tradeoff above (accept as-is, or want a fast-fail path added
for missing-x-admin-key + present-but-unrelated-Bearer-token requests before
this ships to production?).