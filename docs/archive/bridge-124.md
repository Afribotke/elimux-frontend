# Cycle 048 Report — Career Pathways Phase 2: AI Engine + School Matching
## built, build clean, one real bug found in the ALREADY-APPLIED Phase 1
## migration (not this cycle's code) — needs a manual SQL fix

## Status: `npm run build` succeeds locally, exit code 0, zero errors.
## Nothing committed or pushed - staged only, per Rule 0 in your brief
## and the founder's own instruction. Not proceeding to Phase 3.

Archived as `docs/archive/bridge-123.md` before this replaced it.

## What was built

- `src/app/api/pathways/interpret/route.ts` - Career Interpreter (direct
  `career_mappings` search + 20-keyword fallback map).
- `src/app/api/kjsa/analyze/route.ts` - KJSA Analyzer (scores every
  pathway against `pathway_kjsa_requirements`, returns fit % and
  eligibility per pathway, sorted).
- `src/app/api/schools/match/route.ts` - School Matcher (county/category/
  gender/accommodation/pathway filters, grouped by C1-C4 for the
  8-school formula display).
- `src/app/api/guidance/validate/route.ts` - Rule Validator (SNE 4-school
  rule, regular 8-school 3-2-2-1 formula, C4-must-be-day rule,
  Consistency Rule).
- `src/app/pathways/wizard/page.tsx` - replaced with the version that
  calls `/api/pathways/interpret` on the dream step and
  `/api/kjsa/analyze` on the KJSA step, per your Section 6.

All five files use `@/lib/supabase/server`'s `createClient()` (not
`auth-helpers-nextjs`) and every Supabase query is schema-qualified with
`.schema('pathways')`, per Rules 0/2. `src/app/api/guidance/validate`
does no Supabase query at all (pure validation logic), so I dropped the
unused `createClient` import your snippet included for it - dead code,
not a functional change.

One small hardening carried over from Phase 1: `/api/pathways/interpret`
builds a `.or()` filter string from the free-text `query` the same way
Phase 1's `/api/careers` did, so it gets the same `,()`-stripping guard
against breaking out of the PostgREST filter grammar.

## Build result

```
npm run build
✓ Compiled successfully in 2.5min
Exit code: 0
```
All four new API routes confirmed in the route table:
`/api/pathways/interpret`, `/api/kjsa/analyze`, `/api/schools/match`,
`/api/guidance/validate`. No existing files outside the pathways module
were touched, per Rule 0.

## Live endpoint tests (Section 7 of your brief)

Started the dev server and hit all four with the exact requests you
specified:

- `POST /api/pathways/interpret {"query":"I want to be a lawyer"}` ->
  correctly falls through to the keyword map (the full sentence doesn't
  substring-match career_name "Lawyer", which is expected - `career_name.
  ilike.%i want to be a lawyer%` was never going to hit `"Lawyer"`) and
  returns pathway=Social Sciences, track=Humanities & Business Studies,
  confidence 0.9. Working as designed.
- `GET /api/schools/match?county=Nairobi&category=C1` -> `{"schools":
  [],"total":0,...}`. Correct - no schools have been imported yet (World
  Bank script from Phase 1 hasn't been run against production).
- `POST /api/guidance/validate` with a valid 3-2-2-1 C1-C4 day-school
  selection -> `{"valid":true,"errors":[],...}`. Correct.
- `POST /api/kjsa/analyze` with Mathematics=EE, English=ME -> **returned
  `pathway_kjsa_requirements: []` and 0% fit for every pathway**, even
  though the seed data has 7 requirement rows. This is the one real bug
  found this cycle - see below.

## Bug found: two Phase 1 tables are silently unreadable via the API

Not something in this cycle's code - it's in the migration that was
already applied to production. Checked directly against the live
database:

- `pathways.pathway_kjsa_requirements` and `pathways.kjsa_performance_
  levels` both have Row Level Security **enabled** (confirmed via
  `pg_class.relrowsecurity` - true for both), but **neither has a SELECT
  policy** (confirmed via `pg_policies` - zero rows for either table).
  With RLS on and no policy, Postgres denies all access by default, so
  PostgREST returns empty results for `anon`/`authenticated` even though
  the rows are really there - a service-role query confirmed all 7
  `pathway_kjsa_requirements` rows and all 4 `kjsa_performance_levels`
  rows exist exactly as seeded.
- This is an omission in the original Phase 1 spec's RLS section, which
  I carried over faithfully when building Phase 1 - it listed policies
  for 11 tables and simply didn't include these two. It went unnoticed
  in Phase 1 because nothing queried them yet; Phase 2's KJSA analyzer
  is the first thing that does.

Fix: added the two missing policies to the bottom of the RLS section in
`supabase/migrations/20260829000001_pathways_schema.sql` (for anyone
running the migration fresh in a new environment), and wrote a small
follow-up file, `supabase/migrations/20260829000002_pathways_rls_fix.sql`,
with just the two `CREATE POLICY` statements for the schema that's
already live. **Not run** - same as every other SQL file, this needs to
be pasted into the Supabase Dashboard SQL Editor manually. Until it is,
`/api/kjsa/analyze` will keep returning 0% fit for every pathway - the
code is correct, the data exists, only the read permission is missing.

## Uncommitted state - documented in full

Per the founder's instruction, nothing is committed yet - staged only.
Full inventory of everything currently uncommitted in the working tree:

**This cycle's work (staged):**
- `src/app/api/pathways/interpret/route.ts` (new)
- `src/app/api/kjsa/analyze/route.ts` (new)
- `src/app/api/schools/match/route.ts` (new)
- `src/app/api/guidance/validate/route.ts` (new)
- `src/app/pathways/wizard/page.tsx` (modified - Phase 1 shell -> Phase 2 API-calling version)
- `supabase/migrations/20260829000001_pathways_schema.sql` (modified - added the 2 missing RLS policies)
- `supabase/migrations/20260829000002_pathways_rls_fix.sql` (new - the standalone fix for the already-applied database)

**Pre-existing, unrelated to Career Pathways (found already uncommitted at
the start of this work, left untouched, not part of this cycle):**
- `src/app/admin/users/page.tsx` (modified, 179+/152-)
- `src/components/admin/DataTable.tsx` (new, untracked)
- `src/components/admin/UserDetailDrawer.tsx` (new, untracked)
- `public/elimux-complete-image-inventory.pdf`, `public/og-image-solid-bg.png`,
  `public/table-1787829636220.csv`, `public/table-1787829673294.csv`,
  `public/previews/{favicon-preview.png,logo-assets-preview.png}` (all
  untracked)
- All of these share one filesystem timestamp (2026-08-28 02:27:39),
  well before this session's Pathways work started - they're an admin
  user-management UI redesign plus some marketing/brand assets from a
  separate, earlier cycle. `git status` was checked before and after
  every commit this session to confirm none of this was accidentally
  swept in.

## Not proceeding to Phase 3

Per Section 8 of your brief: stopping here. Waiting for "proceed" before
touching PDF + Share.
