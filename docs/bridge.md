CYCLE 176-A REPORT — audit-only, nothing built. The real picture is very different from what
the original anomalous spec (Cycle 172) assumed: substantial, real, working infrastructure
already exists for institutions and employers. The actual gap is narrower and different than
"nothing was built."

Archived: this cycle's own brief is `docs/archive/bridge-176a.md`.

1. EXISTING ADMIN CLAIMS PAGE (`src/app/admin/institution-claims/page.tsx`)
Full contents read. It's an admin review/approve UI for `institution_accounts` rows - filters by
status (pending/active/suspended), search-by-name/contact/email (client-side, not server-side),
approve/suspend buttons. Calls `GET/PATCH /api/admin/institution-accounts` (mounted in
`routes/admin.ts`, not a dedicated file - the brief's Step 4 assumed
`routes/institution-accounts.ts` exists; it doesn't). Uses `X-Admin-Key` auth via
`useAdminKey()`/`AdminKeyContext`.

2. EXISTING API CLIENT FUNCTIONS (`src/lib/api.ts`)
Two genuinely separate institution systems already have full client bindings:
- **Applications** (new institution requesting to be listed): `applyInstitution(data)` -> POST
  `/api/institutions/apply` (public, no auth); `getApplicationStatus(token)` -> GET
  `/api/institutions/apply/:token` (public, token-based); admin side: `listAdminApplications`,
  `approveApplication`, `rejectApplication` -> `/api/admin/applications` (admin-key gated).
- **Claims** (existing institution's admin self-registering): no dedicated `api.ts` wrapper found
  for `/api/institution-portal/*` - the pages that use it (see #7) call it directly via a local
  `institutionFetch()` helper, not through `lib/api.ts`.
- Plus generic CRUD: `listInstitutions`, `createInstitution`, `updateInstitution`,
  `deleteInstitution` (admin-key gated, all hit `/api/institutions`).

3. BACKEND INSTITUTION FILES (`elimux-backend`)
`src/routes/institutions.ts` (274 lines), `src/routes/institution-portal.ts` (428 lines),
`src/middleware/institution-auth.ts` (85 lines). No `institution-accounts.ts` exists anywhere -
that logic lives inside `routes/admin.ts` instead (not re-read this cycle, out of the brief's
explicit file list, but confirmed its existence via the admin page's own header comment).

4. FULL CONTENTS OF THE TWO BACKEND FILES
`institutions.ts`: public `GET /`  (list, supports `search` via real SQL `ilike`), `GET /:id`,
`GET /:id/accreditations`, public `POST /apply` (creates an `institution_applications` row,
returns an `access_token`), public `GET /apply/:token` (status check, also returns any
`program_applications` filed under it), then admin-only `POST /`, `PUT /:id`, `DELETE /:id`.

`institution-portal.ts` (mounted at `/api/institution-portal`): `POST /register` (public but
requires a Supabase Auth JWT - the flow is sign up via Supabase Auth client-side first, then call
this with the token + an `institution_id` to claim; blocks double-claiming the same institution
and blocks one user claiming twice; creates a `status: 'pending'` `institution_accounts` row for
admin approval), then `institutionAuth`-gated (JWT -> `institution_accounts` lookup -> must be
`status: 'active'`): `GET /profile`, `PUT /institution` (strict field whitelist: description,
website_url, email, phone, logo_url, cover_image_url, city - identity fields like name/type/
country stay admin-only), `GET/POST/PUT/DELETE /programs` (ownership-checked against
`req.institutionId`), `GET /analytics` (30-day views/applications/reviews/top-search-terms,
scoped to own institution).

Notably: this system does NOT do domain-based auto-verification at all (no domain matching
anywhere in `institution-portal.ts`) - claiming just requires knowing the target `institution_id`
and signing in; approval is entirely manual via the admin claims page. Any future "auto-approve if
email domain matches" feature would be new, not something to preserve from existing code.

5. `institution_accounts` SCHEMA (live query)
`id` (uuid, not null), `institution_id` (uuid, not null), `user_id` (uuid, not null),
`contact_name` (varchar, nullable), `email` (varchar, not null), `role` (varchar, not null - not
in the admin page's own type union, worth checking what values exist if this gets touched),
`status` (varchar, not null), `created_at`/`updated_at` (timestamptz, nullable). Exactly matches
the admin page's own header comment.

6. `institutions` / `employers` / `schools` SCHEMAS (live query, full column lists)
- `institutions`: has `search_text` (text) and `embedding` (vector/USER-DEFINED) columns -
  semantic search infrastructure already exists at the schema level. Also has `slug`,
  `admin_user_id`, a free-text `country` column (separate from `country_id` - see
  [[project_elimux_disconnected_kenya_institutions]] memory, this free-text column is the
  disconnected TVET-scraper batch, not reliable for anything program-related), `tveta_*` fields.
- `employers`: much richer than institutions for self-service - `admin_user_id`, `user_id`,
  `slug`, `invitation_token`, `nita_verified`, `subscription_tier`, `max_departments`/
  `max_team_members`/`max_active_interns`, `branding_*`/`brand_colors` (jsonb). This table already
  supports a fuller self-service/team-management model than institutions does.
- `schools`: this is the *headteacher self-registration* table (`school_name`, `slug`, `user_id`,
  `headteacher_name/email/phone`, `tsc_code`, `subscription_tier`) - a completely different table
  from `senior_schools` (the 204-row government registry the public `/schools` page displays, per
  Cycle 159's audit). Per that same audit, `schools` has 0 rows - built but never used.

7. EXISTING PUBLIC CLAIM/JOIN PAGES
None found under the filenames `*claim*`/`*join*` in `src/app` (only the admin claims page
matches `*claim*`). But real, live, working pages exist under different names:
- `src/app/institution-onboarding/page.tsx` - the public "apply as a new institution" flow, calls
  `applyInstitution()`/`getApplicationStatus()`.
- `src/app/institution/register/page.tsx` and `src/app/institution/login/page.tsx` - the public
  "claim an existing institution" flow, both call `POST /api/institution-portal/register`.
- `src/app/institution/dashboard/page.tsx` - the self-service dashboard once a claim is approved.
- The exact same pattern exists in parallel for employers: `src/app/employer/register`,
  `src/app/employer/activate`, `src/app/employer/(portal)`. Schools have no equivalent - only the
  public directory (`src/app/schools`, currently Coming-Soon shielded) and the API layer
  (`src/app/api/schools`), no self-service registration UI at all.

8. NAVIGATION CHECK
Exactly one nav entry point exists anywhere: `src/components/Footer.tsx` - "Are you an
institution? List your programs on ElimuX" -> `/institution-onboarding` (the apply-as-new flow
only). The claim flow (`/institution/register`) has **zero** nav entry point anywhere in the
codebase - it's live and functional but effectively undiscoverable unless someone already knows
the URL. No unified "search first, then get routed to claim-or-apply" entry point exists for
institutions, employers, or schools.

WHAT THIS MEANS FOR THE ACTUAL GAP
The user's original framing ("never built") isn't quite right - substantial, real,
already-shipped infrastructure exists for institutions (claim + apply + admin review + self-
service dashboard, live since 2026-08-08 per project history) and a parallel, richer system
exists for employers. What's genuinely missing:
1. A unified public search page (search by name/domain -> "here's your match, claim it" or "not
   found, apply here") - neither existing flow has this, both assume the user already knows which
   path they need.
2. The claim flow's total lack of discoverability (no nav link anywhere).
3. No domain-based auto-verification anywhere in the real claim flow (unlike what the earlier
   anomalous spec assumed existed to preserve).
4. Schools have no self-service system at all - would be new work, not a gap in something
   existing.
Recommend Bridge 176-B build against these real endpoints/pages (add a search-first entry point
and a nav link) rather than the parallel `pending_institutions`/`institution_claims` schema the
earlier anomalous spec proposed - that would fork a second, incompatible system next to this real
one.
