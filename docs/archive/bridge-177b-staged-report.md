CYCLE 177-B REPORT — Parts 0-7 done. Build clean, staged with explicit pathspec, NOT committed
per the brief's own rule. One major finding changes what "success" means for Part 2; several
smaller corrections applied and documented below. SQL (Part 1) already run live - it's a database
change, not a file to stage/hold, and was independently verified safe before running.

Archived: this cycle's own brief is `docs/archive/bridge-177b.md`.

MAJOR FINDING, found before writing any code - the alerts table doesn't exist anywhere
Checked `information_schema.tables` across all schemas before touching `route.ts`: neither
`alerts` (the brief's assumed name) nor `trending_alerts` (the *original* code's real table name,
confirmed by re-reading the file before rewriting it) exists anywhere in this database. Also
checked both repos for any migration file or backend code that creates or writes to either name -
nothing. This means the "Trending Alerts" feature (Cycle 028) has almost certainly returned a 500
on every real call since it shipped - the frontend's own empty `.catch(() => {})` on the fetch
masks that as "no alerts yet" rather than a real error. **Unifying the permission-resolution logic
cannot fix this** - the data layer itself doesn't exist. Applied the permission fix anyway (real
value for consistency, matches the "one source of truth" goal, and is forward-compatible), using
the *real* original table name (`trending_alerts`) rather than the brief's `alerts`, and the real
order column (`sent_at`, matching what the frontend renders) - but the build-verification
checklist's "Alerts page loads data (not permanently empty)" cannot be satisfied by this cycle's
scope. That needs a separate, explicit decision: create `trending_alerts` (and a real data source
for it - nothing currently populates trending content), or retire the alerts feature.

PART 1 — SQL: RUN, verified, one syntax correction
`CREATE POLICY IF NOT EXISTS` is not valid PostgreSQL syntax (unlike `CREATE TABLE`/`INDEX`) -
hit a real syntax error on first attempt, removed `IF NOT EXISTS` and ran plain `CREATE POLICY`
(safe since Cycle 177's own audit had already confirmed zero existing policies on this table).
Backfill step: ran clean, affected 0 rows - checked why rather than assuming success silently:
`institution_accounts` currently has 0 rows with `status='active'` in production (nobody has
completed a real claim yet), so there was nothing to backfill. Not a failure, just confirms this
is genuinely a forward-looking safety net, not fixing existing broken data. Verify query confirms
both policies exist: `"Users can update own institution account"` (UPDATE),
`"Users can view own institution account"` (SELECT).

PART 2 — Alerts API: rewritten with corrections, see MAJOR FINDING above
Real table name (`trending_alerts`) and order column (`sent_at`) used instead of the brief's
`alerts`/`created_at`. The `[id]/read/route.ts` rewrite also needed a real Next.js 15 fix the
brief's snippet didn't have: this project's dynamic route params are `Promise<{ id: string }>`
(confirmed against the original file's own working code, and against this exact same lesson from
Cycle 176-C-A's Suspense-boundary fix) - the brief's synchronous `{ params }: { params: { id:
string } }` would have been a type error. Fixed to `await params`.

PART 3 — Attachment upload: rewritten, one judgment call flagged rather than silently applied
The brief's rewrite pattern would have dropped `admin`/`super_admin` platform-role access to this
endpoint entirely (those roles have no `institution_accounts` row to resolve). Read the original
file's real role check before rewriting: it explicitly allowed `institution_admin`,
`institution_owner`, `admin`, AND `super_admin` - four values, not just the two institution-
specific ones. Preserved the `admin`/`super_admin` role path as a fallback alongside the new
`institution_accounts`-active check, rather than remove a capability that wasn't asked to be
removed and looked like an unintended side effect of "unify" rather than a deliberate decision.
Business logic (student parsing, auth-user creation, `attachment_eligible_students` insert)
otherwise untouched, per the brief's own "preserve" instruction - only the `institution_id: null`
placeholder now uses the resolved `institutionId` when the institution_accounts path is taken.

PART 4 — Layout: built as specified
`cn` utility confirmed to exist (`src/lib/utils.ts`) before use. Step 4.2 ("remove duplicate
headers from child pages") turned out to be a no-op for both `alerts/page.tsx` and the old
`analytics/page.tsx` - neither actually has a `<header>`, `<nav>`, or sign-out button; their own
`<h1>` titles are page content, not layout chrome, so nothing needed stripping per the rule's own
literal wording. Left both content-wise untouched. Main `dashboard/page.tsx` correctly left alone
entirely, per the brief's own explicit instruction.

PART 5 — Analytics renamed to Link Performance: done as specified
Copied, retitled (`<h1>Content Analytics</h1>` -> `<h1>Link Performance</h1>`, function renamed to
`InstitutionLinkPerformancePage`), old path now redirects. Step 0.2's grep found only the file's
own self-referencing path comment (updated) - nothing else in the codebase linked to the old path,
confirmed both before and after.

PART 6 — Build & local verification
Build flags: used this machine's own confirmed-safe recipe (2.5GB heap +
`NEXT_PRIVATE_SKIP_SOURCEMAPS=1`) instead of the brief's `--max-old-space-size=4096` - this
machine has ~3.9GB physical RAM and 4GB+ heaps have reliably OOM'd here in past cycles (documented
in this project's own memory). `npm run build`: exit 0, zero errors. Confirmed every route
(`dashboard`, `dashboard/alerts`, `dashboard/link-performance`, `dashboard/analytics` redirect,
`login`, `register`) actually present in `.next/server/app/institution/`, not just trusted the
exit code alone.

Browser verification: **could not complete the brief's full checklist** (log in, see sidebar,
click through nav, sign out) - every one of those needs a real authenticated session, and entering
a password into any field, even a test account, is a hard rule in this session that isn't mine to
waive (same wall hit in Cycle 176-C-BD's Part D). What was verified instead, unauthenticated:
`/institution/login` renders correctly; the new layout's session gate correctly redirects all
three dashboard sub-routes (`/alerts`, `/link-performance`, and the old `/analytics` path) *and*
the main `/dashboard` page itself to `/institution/login` with no crash, no infinite-redirect
loop, and a clean console (checked specifically for "Maximum update depth" given the page now has
two independent session checks stacked - the layout's new one and the main dashboard page's
existing one - confirmed they don't conflict). Sidebar rendering, active-state highlighting, and
sign-out itself are unverified pending a real logged-in test - flagged plainly rather than assumed
working from a clean build.

PART 7 — Staged, NOT committed, per the brief's own explicit rule
```
 src/app/api/institution/alerts/[id]/read/route.ts  |  77 ++++++------
 src/app/api/institution/alerts/route.ts            |  83 +++++++------
 .../api/institutions/attachment/upload/route.ts    |  82 ++++++-------
 src/app/institution/dashboard/analytics/page.tsx   | 121 ++----------------
 src/app/institution/dashboard/layout.tsx           | 136 +++++++++++++++++++++
 .../dashboard/link-performance/page.tsx            | 126 +++++++++++++++++++
 6 files changed, 393 insertions(+), 232 deletions(-)
```
Staged with explicit pathspec (each file named individually, no `git add -A`). This report
(`docs/bridge.md`) is being committed and pushed as usual - that's this session's established
communication channel with Kimi, distinct from the 6 code files above, which stay staged-only
until told "commit and push it."

WAITING ON
1. A real decision on `trending_alerts` (create the table + a data source, or retire the alerts
   feature) - permission unification alone doesn't fix it.
2. Explicit "commit and push it" for the 6 staged code files.
3. Someone with real login credentials to complete the authenticated portion of Part 6's browser
   checklist (sidebar, nav clicks, sign-out) - the one thing this session genuinely cannot verify
   itself.
