# Cycle 041 — Step 0 Audit ONLY (per the cycle's own gate: "Do NOT
# proceed to Step 1 until this audit is complete and reported")

Archived as `docs/archive/bridge-112.md` before this report replaced it.

## Headline finding
This admin dashboard is not "partially implemented." It's a large, mature
system already covering nearly everything the spec asks for — often in
more granular, more production-real form than the spec imagines (an
immutable hash-chained bursary disbursement ledger with a fraud registry
and M-Pesa/Paystack integration is not what "partially implemented"
usually means). Executing the spec's 13 steps literally would build
duplicate, conflicting pages next to ones that already exist, and get
several steps flat-out wrong because the spec's assumed data model
doesn't match this database. Stopping here, as instructed, before Step 1.

## EXISTING

**Pages** (`src/app/admin/` — 50 page files, not counted in the spec's
"partially implemented" framing): `page.tsx` (dashboard home),
`dashboard`, `users`, `institutions`, `institution-claims`,
`institutions-performance`, `programs`, `scholarships` (+`/sponsors`),
`scholarship-providers`, `scholarship-applications`, `bursary-providers`,
`bursary/funds`, `bursary/applications`, `bursary/disbursements`,
`bursary/cron`, `advertisers`, `ads`, `ad-pricing`, `campaigns`,
`major-sponsors`, `revenue`, `payments`, `pricing`, `reviews`, `messages`,
`analytics`, `searches`, `settings`, `audit`, `approvals`, `reports`,
`compliance`, `nita`, `accreditation`, `bulk-upload`, `student-assignments`,
`students`, `internships`, `employers` (+5 sub-pages: discover-names,
names, outreach, outreach/dashboard, outreach/team, upload),
`potential-employers`, `scraper` (+`/changes`, `/sources`),
`tveta-scraper`, `layout.tsx`.

**Components** (`src/components/admin/`): `StatCard`, `RecentActivity`,
`VisitorStatsWidget`, `AdminApplications`, `ProviderStatus`,
`AdminKeyContext`, `AddInstitutionForm`, `AddProgramForm`,
`AddScholarshipForm`, `AddScholarshipSponsorForm`, `MajorSponsorForm`,
`PlanForm`, `SponsorAdForm`, plus `charts/LineChart`, `charts/PieChart`,
`charts/RankedBarList` — a chart library is already integrated and in
active use (spec's Step 2.4 said "if no chart library exists, skip" —
one exists).

**Navigation** (`src/app/admin/layout.tsx`): explicitly commented "ALL 29
VERIFIED ADMIN ROUTES — SINGLE SOURCE OF TRUTH", organized into 6
collapsible sections (Platform, Content, Bursary Engine, Revenue, Users,
System) covering 40+ nav items — more granular than the spec's flat
13-item list. Already has: a global admin search box (type-ahead across
all nav items, not in the spec), notification badges on nav items,
mobile hamburger toggle with backdrop overlay and slide-in sidebar
(spec's Step 1.2, already done), breadcrumb header, sign-out.

**Dashboard home** (`/admin`, `page.tsx`): a 5-card "Platform Analytics"
row with week-over-week trend percentages (Users, Revenue, Searches,
Reviews, Applications) — beyond the spec's flat 4-card ask — plus a
separate 7-card raw-count row (Countries, Institutions, Programs,
Reviews, Messages, Institution Types, Categories). A `LineChart` of
30-day search activity. `RecentActivity` (messages + institutions).
`AdminApplications` and `ProviderStatus` widgets. Recent Reviews list.
Most Reviewed Programs list. Three working Quick Actions with real forms
(Add Institution, Add Program, View Messages) — not stubs.

**Supabase access pattern**: two parallel paths, both real. (1) Direct
client reads via `@/lib/supabase` (`supabase.from('table').select(...)`)
for public-RLS-readable tables — this is what `admin/page.tsx` uses for
counts and reference data. (2) A backend-gated path via `@/lib/api`
wrapper functions (`getAdminDashboardStats`, `getAnalyticsOverview`,
etc.) that take an `adminKey` param and hit the backend, which uses a
service-role key — this is how anything RLS would otherwise block (e.g.
`contact_messages`, which the code comments explicitly say "has no
public RLS policy by design — submissions contain PII") gets read.

**Admin auth model — important, and different from what the spec
assumes**: `/admin/*` is gated by `AdminGate` in `layout.tsx`, which
posts a key to the backend's `GET /api/admin/verify` (`x-admin-key`
header) and stores it in React context + sessionStorage — not a Supabase
session check, not RLS, not `profiles.role`. There is a real `admin_users`
table in the DB (0 rows currently) but the live gate is the shared
`ADMIN_KEY` env var compared server-side, per a prior cycle's audit
(`project_elimux_auth_endpoint_hole` — the same incident that fixed a
role-escalation hole in this exact area).

**Real Supabase tables** (queried live via the Supabase MCP tool against
the actual `ohlgjvenwekpbpkykutz` project — 120 tables total, listing
only what's relevant here): `applications` (0 rows — internship/
attachment/employer flow), `program_applications` (0 rows), `institution_
applications` (1 row), `scholarship_applications` (2 rows),
`bursary_applications`/`bursary_applicants`/`bursary_documents`/
`bursary_disbursements` (immutable hash-chained ledger, per its own
table comment)/`bursary_fraud_registry`/`bursary_mpesa_transactions`/
`bursary_paystack_transfers` — a full bursary subsystem far beyond
anything the spec describes. Also: `tenants`/`tenant_branding`/
`user_tenant_roles` — a multi-tenant white-label system, not mentioned
anywhere in the spec, and **no admin page exists for it** (see MISSING).

## MISSING or genuinely incomplete (the real gaps)

- **No reusable `DataTable` component** (spec's Step 11) — confirmed via
  filesystem search, zero matches. This is real and worth building if
  more table-heavy admin pages get added, but 40+ existing pages
  currently roll their own table markup inline without it — retrofitting
  every page onto a new shared component is a large, separate refactor,
  not something to bundle into "add missing features."
- **`admin/users/page.tsx` (254 lines) has no search, filter, sort,
  pagination, or bulk actions** — confirmed via grep, only a plain list
  with per-row disable. This is the one spec item (3.2) that's a genuine,
  scoped, real gap.
- **No admin page for the `applications` table** (internship/attachment/
  employer applications) — confirmed via grep, this table has real
  frontend usage (employer portal, internships, student dashboard) but
  zero admin visibility. This is the closest real match to the spec's
  Step 4, though shaped around internships/attachments, not "program
  applications" as the spec imagines.
- **`program_applications` table exists in the database (0 rows) but is
  wired into *no* code anywhere** — not the frontend, not any admin page.
  Either dead/reserved schema from an earlier design, or a genuinely
  unbuilt feature. Worth asking about before building an admin page for
  a table nothing else uses yet.
- **`admin/approvals/page.tsx` runs on hardcoded mock data** — and says so
  in its own header comment, in detail: the real target table
  (`university_student_uploads`) exists (0 rows) but has no backend API
  route at all, and lacks an approval-status column. This is a real,
  already-self-documented gap — not something this cycle can finish
  without backend work first (which the spec's own rules say not to do:
  "do NOT create Supabase tables").
- **No admin page for the `tenants`/`tenant_branding` white-label
  system.** Not in the spec at all, but if this multi-tenant feature is
  live/active, it currently has zero admin oversight.

## Where the spec's assumptions don't match reality
- **Step 3 and Step 12 both assume a single `profiles` table** with
  `full_name`, `email`, `role`, `institution_id`, `status` columns.
  **No such table exists.** Confirmed via a live query of all 120 public
  tables. User identity here is split across Supabase's built-in
  `auth.users`, plus `user_roles` (4 rows), `student_profiles` (2 rows),
  `institution_accounts` (0 rows), `employers` (6 rows), `advertisers`
  (2 rows), and `admin_users` (0 rows) — a per-role-table model, not a
  unified profile. A real "Users Management" page has to join across
  whichever of these tables actually holds a given user's data, which is
  a materially different (and harder) build than the spec's single-table
  assumption.
- **Step 12's RLS assumption** ("Check `profiles.role = 'admin'` on
  load") doesn't apply — see the admin auth model above. The actual
  security boundary is the backend's `ADMIN_KEY` check, not client-side
  RLS keyed on a role column. Flagging rather than inventing a
  `profiles.role` check against a table that doesn't exist.

## What I did not do
Per the cycle's own Step 0 gate, I did not write any code, create any
pages, or touch the sidebar/dashboard/RLS. This report is the full
deliverable for Step 0.

## Recommendation
Given how much of the spec is already done or exceeded, and how much of
the remainder either has a fundamentally different real shape (Users,
Applications) or isn't safely buildable without backend/schema decisions
first (Approvals, `program_applications`, RLS), I'd rather scope the next
step with you than build all 12 remaining steps against these corrected
assumptions in one uninterrupted pass. My suggested priority order, if
useful: (1) `admin/users` search/filter/pagination — real, scoped, safe;
(2) an `applications` admin page for internship/attachment applications;
(3) everything else, re-scoped once we know if `program_applications`
and the tenant white-label system are meant to be built out or left
alone.
