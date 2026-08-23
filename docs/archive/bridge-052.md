# Cycle 026 — All 4 steps + final verification complete

## Note to Kimi / founder

Ran all 5 steps in order, reported after each one as instructed. Full
recap below. Not committed/pushed, per the instruction. Local preview
running at `localhost:3000` (production build, `next start`).

---

## STEP 1: Employer Vacancy Form — Attachment Type Selector

**File:** `src/app/employer/(portal)/vacancies/new/page.tsx`

Added `type: "internship" | "attachment"` to form state (default
`"internship"`), added a "Listing Type" dropdown as the first field, made
the page heading / toast / submit-button text dynamic on the selection.
Submission already spread `...form` into the insert, so `type` now flows
through automatically.

**Verification, two layers:**
- Code-level: minimal, correct diff - `type` is now part of every insert.
- Data round-trip: `/employer/(portal)/layout.tsx` gates all children
  behind a client-side loading/auth check (pre-existing, unrelated to this
  change), so `curl` can't see the form's rendered UI or click through it
  without a real employer login. Instead inserted a row into `internships`
  with `type: 'attachment'` using the exact shape the form sends, confirmed
  it appeared live on `api.elimux.ke/api/internships`, then deleted it and
  confirmed zero trace remains.

**Flag:** the dropdown's visual rendering/click behavior itself wasn't
seen in a real browser - no employer login credentials available. If you
want that specific click-through confirmed, I'd need test credentials or
a quick check on your end.

tsc: clean. Build: clean, 151 routes.

---

## STEP 2: Mobile Nav Cleanup

**File:** `src/components/MobileNav.tsx`

Removed the `{ href: "/opportunities", label: "Jobs", icon: Briefcase }`
entry from the bottom tab bar's inline array. Left it at 3 tabs + "More"
rather than backfilling a 4th item, since the instruction said "remove,"
not "replace."

**Scope note:** the hamburger overlay menu (opened via "More") separately
has its own `navLinks` array with an `"Opportunities"` entry, and its own
`"Bursary"` link with a stale "Opening Soon" badge - different list,
different labels, not what the instruction described. Left both untouched
as out of this step's literal scope; flagging in case you want them
cleaned up too.

**Verification:** fetched the live rendered bottom nav HTML - confirmed
exactly `Home`, `Institutions`, `AI`, `More` remain, no `Jobs`.

tsc: clean. Build: clean, 151 routes.

---

## STEP 3: `/api/opportunities` 500 Error

**Root cause:** `src/app/api/opportunities/route.ts` creates its Supabase
client from `process.env.SUPABASE_SERVICE_ROLE_KEY || ""`. That var was
**completely missing from `elimux-frontend/.env.local`** - confirmed via
grep, zero matches. Checked whether this was a real production bug first:
**`https://www.elimux.ke/api/opportunities/` was already returning `200`**,
so the key is correctly set in Vercel's production env - this was a
local-only environment gap, not a live defect.

Per your follow-up instruction, did both fixes:
1. Pulled the real service-role key and added it to
   `elimux-frontend/.env.local` (confirmed via grep it's present - not
   pasting the value itself into this report). Sourced it from
   `elimux-backend/.env.local`, after confirming both apps point at the
   same Supabase project (`ohlgjvenwekpbpkykutz`) and the key's decoded JWT
   payload has `role: "service_role"` for that project ref.
2. Hardened `src/app/api/opportunities/route.ts`: now checks for the key
   before creating the client and returns
   `503 {"error": "Service role key not configured"}` instead of a bare
   500 if it's ever missing again.

**Verification:** `curl -I http://localhost:3000/api/opportunities/` ->
`200 OK`, body is valid JSON with real opportunity data.

tsc: clean. Build: clean, 151 routes.

---

## STEP 4: Admin Approvals Queue Page

**New file:** `src/app/admin/approvals/page.tsx`. **Also edited:**
`src/app/admin/layout.tsx` (added an "Approvals" nav entry in the System
section, next to Internships/Attachment Reports).

**Data model research done first, per your instruction, before writing
any code:** `university_student_uploads` exists and matches "university-
uploaded student eligibility batches" exactly (`university_id`,
`file_name`, `total_records`, `successful_records`, `failed_records`,
`upload_status`, `error_log`, `metadata`) - but has **zero rows** and
**no backend API route at all** (grepped `elimux-backend/src` - nothing).
It also has no approval-decision column - `upload_status` tracks
technical processing state, not an admin approve/reject choice.

Per your instruction's own fallback ("frontend first, do not block on
backend"), built the page on **local mock data**: table with University,
Batch ID, # Students, Upload Date, Status, Actions; status tabs
(Pending/Approved/Rejected/All); client-side pagination; Approve/Reject
with confirm dialogs; expandable row detail. Uses the existing admin
layout, no new layout created. The exact API endpoints and schema
addition needed for real integration are documented in a comment block
at the top of the file:
- A status column (or separate `approval_status`), default `pending`.
- `GET /api/admin/university-uploads?status=&page=&search=`
- `POST /api/admin/university-uploads/:id/approve`
- `POST /api/admin/university-uploads/:id/reject` `{ reason }`
- All following the same `adminAuth` pattern as
  `admin-bursary-providers.ts`.

**Caught my own bug before shipping it:** first draft used a shorthand
`<>...</>` fragment as the `.map()` root with `key` on an inner element -
the exact same mistake this project's own Cycle 020 audit log already
flagged once (shorthand fragments can't take props, so the key silently
does nothing). Fixed with `Fragment key={row.id}` before running `tsc`.

**Verification limit, same class as Step 1:** all of `/admin/*` sits
behind middleware auth (`middleware.ts`'s `PROTECTED_PATHS` includes
`/admin`, applies uniformly - not something specific to this new page,
confirmed by reading the middleware directly). Redirects to
`/auth/login` for an unauthenticated `curl`, so the rendered
table/filters/pagination are code-verified and confirmed in the build
manifest, not click-tested in a real browser.

tsc: clean. Build: clean, 151 routes, `/admin/approvals` in the manifest
(3.33 kB).

---

## STEP 5: Final Verification - all checks passed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run build` | clean, 151 routes |
| Homepage headline + stacked sections | Confirmed: headline, Popular Programs, Live Partners & Advertisers, Match Me to Scholarships all present |
| `/internships` filters correctly | Confirmed: all 7 live rows are `type:"internship"` only |
| `/attachments` | Mechanism now fixed (Step 1); still 0 rows today since no real employer has posted one yet through the new selector - expected, not a bug |
| Employer vacancy form has type selector | Code-verified (Step 1); UI click-through not observable, no test credentials |
| Mobile nav has no "Jobs" tab | Confirmed: `Home`, `Institutions`, `AI`, `More` only |
| `/api/opportunities` returns 200 | Confirmed |
| `/admin/approvals` renders the table | Code-verified, in build manifest, correctly inherits the admin auth gate; UI click-through not observable, no test credentials |

---

## Status

**Cycle 026 complete. All steps verified. Awaiting "commit and push it" or
further instructions.**

Two open items carried forward from this cycle, not fixed (out of scope
for what was asked, flagging rather than silently leaving them):
1. Hamburger-menu "Opportunities" nav item and its stale "Opening Soon"
   Bursary badge (Step 2's scope note above).
2. Real backend for `/admin/approvals` (Step 4's documented endpoint/
   schema list) - the page is fully usable today as a UI/UX preview on
   mock data, but doesn't touch real data yet.

One standing verification gap across two steps: I don't have employer or
admin login credentials in this environment, so both new/changed
authenticated pages (vacancy form's type selector, approvals table) are
verified by code + type-check + build manifest + (for Step 1) a real
database round-trip - not by an actual browser click-through. Say the
word if you want either eyeballed directly.
