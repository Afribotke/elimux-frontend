CYCLE 177 — PART 0 AUDIT REPORT — Institution Dashboard. Read-only, complete, per the template.
Mandatory build verification: `npm run build` (2.5GB heap + `NEXT_PRIVATE_SKIP_SOURCEMAPS=1`) ran
AFTER this audit (confirming the read-only file reads changed nothing) - exit 0, zero errors.

Archived: this cycle's own brief is `docs/archive/bridge-177.md`.

## AUDIT REPORT — Institution Dashboard

### Dashboard Structure

**Main dashboard (`/institution/dashboard`)** - `src/app/institution/dashboard/page.tsx`, 442
lines. Client component. On load: checks `supabase.auth.getSession()` + `hasValidSessionMarkers()`,
redirects to `/institution/login` if absent. Then calls `institutionFetch('/api/institution-portal/
profile')` - on a 403 shows a "Claim pending approval" screen (sign-out only); on success loads the
institution, programs, and analytics in sequence. Three tabs, all inline in this one file:
- **Profile tab**: editable fields (description, city, website_url, email, phone, logo_url,
  cover_image_url) via a form bound to `PUT /api/institution-portal/institution`. Name/type
  explicitly read-only ("managed by ElimuX").
- **Programs tab**: **a full program manager already exists here** - a table of the institution's
  programs (name/level/duration/fees/status/actions) plus an add/edit form, wired to the real
  `GET/POST/PUT/DELETE /api/institution-portal/programs[/:id]` CRUD endpoints. Soft-delete
  (confirms via `window.confirm`, sets `is_active: false`, doesn't hard-delete). This is a real,
  working feature, not a stub - important given this cycle's own title is "... + Program Manager."
- **Analytics tab**: profile views/applications/conversion-rate/reviews (30d) + a views-trend bar
  chart + top-programs-by-views + regional interest, via `GET /api/institution-portal/analytics`.

**Alerts page** (`/institution/dashboard/alerts`) - `src/app/institution/dashboard/alerts/page.tsx`,
99 lines, Cycle 028. Fetches `GET /api/institution/alerts` (a *different*, Next.js-native API
route, not the external backend), lists trending-content alerts with a "mark read" action
(`POST /api/institution/alerts/:id/read`). **Not linked from the main dashboard anywhere** -
confirmed via grep, zero references to this path in `dashboard/page.tsx`.

**Analytics page** (`/institution/dashboard/analytics`) - `src/app/institution/dashboard/
analytics/page.tsx`, 124 lines. **A second, different "analytics" surface** from the dashboard's
own Analytics tab - this one tracks smart-link (shareable listing) click performance via
`GET /api/analytics/overview?days=`, scoped to links `created_by` the signed-in user. Its own code
comment flags a real gap: no `institution_id` column on `content_performance` to join against yet,
so it can only show links the current user personally created, not the whole institution's.
**Also not linked from the main dashboard anywhere.**

**Layout/Sidebar**: none exists. No `institution/dashboard/layout.tsx`, no `institution/layout.tsx`
anywhere in the tree - confirmed both are absent. Each of the three pages (dashboard, alerts,
analytics) is fully self-contained with its own header; there is no shared nav connecting them.
Given neither sub-page is linked from the main dashboard, both are currently reachable only by
typing the URL directly.

**Login** (`/institution/login`) - `src/app/institution/login/page.tsx`. `supabase.auth.
signInWithPassword`; on success, completes any interrupted claim registration saved in
`sessionStorage` (for the email-confirmation-required path), then `router.push('/institution/
dashboard')`. No role/permission check happens in this file - the dashboard page itself is what
gates access (via the 403-on-`/profile` -> "pending" branch).

### API Routes

**`GET /api/institution/alerts`** - Next.js route (`src/app/api/institution/alerts/route.ts`).
Auth: cookie-based Supabase session (`@/lib/supabase/server`), then resolves the caller's
institution via `institutions.admin_user_id = user.id` (**not** `institution_accounts` - see
Database Schema section below for why this matters). Returns `{success, data: []}` if no
institution row has `admin_user_id` set for this user, rather than an error - looks like a normal
empty state but is actually silently gated on a column nothing in the real claim flow currently
populates.

**`POST /api/institution/alerts/:id/read`** - same auth/resolution pattern, 404s if no institution
found for the caller, otherwise updates `read_at`.

**`POST /api/institutions/attachment/upload`** - a *third*, separate auth mechanism: reads a raw
`sb-ohlgjvenwekpbpkykutz-auth-token` cookie directly (rather than the `@/lib/supabase/server`
helper the alerts routes use), verifies the session, then checks `users.role` for
`institution_admin`/`institution_owner`/`admin`/`super_admin` - **a third permission source**,
independent of both `institution_accounts.status` and `institutions.admin_user_id`. Creates auth
users + `attachment_eligible_students` rows for a bulk student upload.

**Auth middleware/helpers**: `src/lib/institutionAuth.ts` (frontend) - `institutionFetch()` wraps
calls to the external backend with a Bearer token from the current Supabase session; also holds
`savePendingInstitutionRegistration`/`takePendingInstitutionRegistration` (sessionStorage, for the
email-confirmation-interrupted claim flow). Backend-side: `institutionAuth` middleware
(`elimux-backend/src/middleware/institution-auth.ts`, already read in full in Cycles 176-A/176-C-A)
- JWT -> `institution_accounts` row lookup -> requires `status === 'active'`.

**Net finding: three parallel, inconsistent institution-permission systems coexist** -
`institution_accounts.status='active'` (the one the real, live claim/dashboard/programs flow
actually uses and the one this whole session's Cycles 176-A through 176-C-BD have been building
against), `institutions.admin_user_id` (used only by the two alerts routes), and `users.role`
(used only by attachment upload). A real institution admin who successfully claims via
`/institution/register` gets `institution_accounts.status='active'` set - nothing in that flow
sets `institutions.admin_user_id` or `users.role`, so the same admin could fully use the
dashboard's profile/programs/analytics tabs while getting a permanently-empty Alerts page and a
403 on attachment upload, unless something else (not found in this audit) reconciles these three
independently.

### Database Schema

**`institutions` columns** (33 total, key ones): `id` (uuid, default `uuid_generate_v4()`), `name`
(not null), `slug`, `type_id`, `country_id`, `city`, `website_url`, `email`, `phone`,
`description`, `logo_url`, `cover_image_url`, `is_verified` (default false), `is_active` (default
true), `is_featured` (default false), `accreditation_status` (default `'pending'`), `embedding`
(vector), `search_text`, `country` (free text - the disconnected TVET-scraper column, see
[[project_elimux_disconnected_kenya_institutions]]), `tveta_registration_number`/
`tveta_accredited`/`tveta_status`, and **`admin_user_id`** (uuid, nullable, no default - the
column the alerts routes gate on).

**`institution_accounts` columns** (9 total): `id` (uuid, default `uuid_generate_v4()`),
`institution_id` (not null), `user_id` (not null), `contact_name`, `email` (not null), `role`
(not null, default `'admin'`), `status` (not null, default `'pending'`), `created_at`/
`updated_at` (default `now()`).

**Programs/courses table exists?** YES - `programs` (the main one, columns match everything
already seen in `institution-portal.ts`'s CRUD: name, category_id, description, duration_months,
tuition_fees, currency, level, requirements, is_active), plus `program_categories`,
`program_applications`, `program_changes`, `program_views`. No separate "courses" table - programs
is the one and only unit.

**RLS policies**: `institutions` has 2 - `"Allow public read on institutions"` (SELECT, `qual:
true`) and `"Allow admin full access on institutions"` (ALL, gated on `auth.uid()` being in
`admin_users` with `role='admin'`). **`institution_accounts` has zero policies returned** -
confirmed via a separate query that RLS *is* enabled on it (`rowsecurity: true`), meaning it's
fully deny-all for any client that isn't using the service-role key. Harmless today only because
every real access path to this table goes through the backend's service-role `supabaseAdmin`
client (`institution-portal.ts`, confirmed) - no direct client-side Supabase query against
`institution_accounts` was found anywhere in the frontend. Flagging because this exact
enabled-but-policy-less shape is the same class of issue Cycle 048/173/175-A already found and
explained once for the `kjsa_*` tables in this project (silent empty results if anything ever
queries it as an authenticated/anon client directly) - not an active bug today, but a specific,
recognizable trap if this table is ever queried a new way.

### What's Missing (gap analysis)

- **Nothing** for basic profile/program management - it's built, live, and matches what a
  "Program Manager" cycle would otherwise be asked to build from scratch. If Part 1 of this
  cycle's original brief was going to build a program manager, that work already exists in
  `institution/dashboard/page.tsx`'s Programs tab.
- **Discoverability**: Alerts and Analytics sub-pages are both built and functional but have zero
  navigation path from the main dashboard - same "built but invisible" pattern already found and
  fixed once this session for the institution claim flow itself (Cycle 169/176-B).
- **Permission-system fragmentation**: an admin can be fully claimed-and-active
  (`institution_accounts`) yet see a permanently empty Alerts page and get denied on attachment
  upload, because those two features check different, unreconciled fields
  (`institutions.admin_user_id`, `users.role`) that the real claim flow never populates.
- **Duplicate "analytics" naming**: two different features are both called "analytics" (the
  dashboard's own tab vs. the separate `/dashboard/analytics` page) and track different things
  (institution-wide profile/program metrics vs. one user's own smart-link clicks) - a real source
  of confusion if surfaced together without renaming one of them.
- **`institution_accounts` RLS**: zero policies (deny-all for non-service-role clients) - not
  broken today, but worth a deliberate policy (even a narrow "own row" SELECT policy) before
  anything ever needs to query this table client-side.

STOPPING HERE per the brief's own rule - not proceeding to Part 1 until this report is reviewed
and "proceed" is given.
