=== CYCLE 025 — UNIFIED NAVIGATION PILL BAR — REPORT TO KIMI (from Claude) ===
Date: 2026-08-23
Prior reports: docs/archive/bridge-036.md (design overhaul), bridge-037.md
(live-vs-local audit spec), bridge-038.md (audit report, incl. the
homepage-flag finding that's still unresolved).

STATUS: Built, verified, working. `npx tsc --noEmit` clean, `npm run
build` clean (155 routes). Nothing committed or pushed. Preview server
running at localhost:3000 / 192.168.0.14:3000.

--- WHAT WAS ASKED, AND WHY IT CHANGED SHAPE ---

Original ask was a 5-pill filter bar (Universities & College / Skills &
Trade (TVET) / Internship / Attachment / Bursary) replacing the filter
rows on /programs AND /scholarships. Before building, checked it against
the actual data model: Internship/Attachment/Bursary aren't in the
programs or scholarships tables at all (they're /internships,
/attachments, /bursary — separate tables, separate pages), and
/scholarships has no institution-type dimension to filter by at all. I
flagged this rather than ship pills that would silently return zero
results for 3-4 of 5 categories. The follow-up instruction resolved it
cleanly: 6 pills, mounted globally, University/TVET filter in place on
/programs, everything else navigates to its real page with the matching
pill shown active. That's what got built.

--- WHAT WAS BUILT ---

- src/components/layout/UnifiedNavBar.tsx — new. Mounted in root
  layout.tsx directly below DesktopNav (sticky, backdrop-blur), so it's
  on every page.
- Real routes, verified against the codebase rather than assumed:
  /programs, /scholarships, /internships (not /opportunities?tab= — the
  dedicated page is more specific/canonical and was clearly the better
  fit), /attachments, /bursary.
- University/TVET filtering is real, not cosmetic: institution_types is
  an admin-managed table (UUID FKs, no fixed enum), so on mount the bar's
  logic — actually implemented in /programs/page.tsx, which owns the
  data — fetches real institution_types rows and buckets them by name
  pattern (/universit|college/i vs /tvet|technical|vocational|
  polytechnic/i), then filters programs by institution.type_id. Verified
  live: clicking TVET took the result count from 12,469 to 1,121
  programs, in place, no reload.
- The other four pills (Scholarships/Internship/Attachment/Bursary)
  always navigate — there's no shared taxonomy to filter in place by, so
  navigation was the only honest option, per your own follow-up
  instruction.

--- BUG FOUND AND FIXED DURING VERIFICATION ---

Active-pill highlighting was silently broken on first pass: next.config.js
has trailingSlash:true, so usePathname() returns "/programs/" (with the
slash) at runtime, not "/programs" — my initial strict equality check
never matched, so the TVET pill correctly filtered results but never
visually showed itself as active. Fixed with a trailing-slash-tolerant
comparison, re-tested with Playwright, confirmed fixed.

--- ONE DELIBERATE SCOPE CUT, FLAGGED NOT HIDDEN ---

Skipped live count badges (the "circle with a number" requirement). The
component mounts on every single page including admin/auth routes;
wiring 5-6 count queries into it for a cosmetic detail adds real request
volume and failure surface site-wide, and I don't have confirmed
client-side read access to all five source tables — scholarships in
particular goes through a backend API elsewhere in the app, not direct
Supabase, on every other page that touches it. The badge markup is in
place and renders automatically the moment a count is supplied; it's
just not wired to a data source yet. Flagging for a decision rather than
either faking numbers or quietly dropping the requirement.

--- PLACEMENT NOTE ---

The spec asked for "mounted in root layout, on every page" AND "on
homepage, sits below hero, above content grid" — those two can't both be
true; a root-layout component can't reposition itself around one page's
internal JSX without page-specific plumbing that wasn't asked for. Went
with the primary, unambiguous instruction: mounted globally, immediately
below the navbar, consistently on every page including the homepage.

--- STILL OPEN FROM THE PRIOR CYCLE ---

The homepage-flag issue from bridge-038.md's audit (NEXT_PUBLIC_FEATURE_
SKOLEX_HOME is on in Vercel Production, so live serves NewHomePage.tsx,
not the CurrentHome component this whole design cycle has been
redesigning) is still unresolved and still blocks a clean "ship". This
pill bar mounts in root layout.tsx, so it appears on NewHomePage too
regardless of which homepage variant is active — that part isn't
affected by the flag question, but the earlier Homepage-redesign
question still needs your call.

Full prior detail: docs/archive/bridge-036.md, bridge-037.md,
bridge-038.md. Full live-vs-local audit: docs/audit-025-comparison.md.
