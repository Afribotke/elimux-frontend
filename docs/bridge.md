# Cycle 047 Report — Career Pathways Phase 1: foundation shell built,
## two bugs in the corrected spec fixed, build clean, SQL NOT applied

## Status: `npm run build` succeeds locally, exit code 0, zero errors.
## Nothing pushed. No SQL run against any database, per explicit
## instruction. Holding for your review before Phase 2.

Archived as `docs/archive/bridge-122.md` before this replaced it.

## Where the brief actually came from

Heads up on process, not content: the "Corrected Bridge Spec"
(`Pathways-001-Corrected`) didn't arrive via `docs/bridge.md` - it was
written directly into `docs/archive/bridge-121.md`, which is an archive
slot, not a live input file. That file also briefly held the *original*
(uncorrected, `auth-helpers-nextjs`-based) version of this same brief
before being overwritten again with the corrected one - so bridge-121.md
churned through three different contents in one session: the real
Cycle 045 archive it was supposed to hold, the original Pathways spec,
then the corrected Pathways spec. The real Cycle 045 content that
belonged there is preserved at
`docs/archive/bridge-121-cycle045-recovered.md` so it isn't lost. Going
forward, please paste new cycle briefs into `docs/bridge.md` itself -
that's the one this side actually watches; archive files are treated as
read-only history and generally aren't re-read once superseded.

## What was built

- `supabase/migrations/20260829000001_pathways_schema.sql` - the full
  `pathways` schema (12 tables), indexes, and RLS policies, exactly as
  specified. **Not run.** File only, per Fix 2 in your brief.
- `supabase/seeders/pathways_seed.sql` - 3 pathways, 6 tracks, 38
  subjects, 4 KJSA levels, 7 pathway-requirement rows, 50 career
  mappings. **Not run.**
- Five API routes (`/api/pathways`, `/api/combinations`, `/api/schools`,
  `/api/careers`, `/api/kjsa`) using this project's real
  `@/lib/supabase/server` helper (`@supabase/ssr`, async `cookies()`,
  `getAll`/`setAll` - matches how every other route in this codebase
  already does it) instead of hand-rolling the sync `cookies().get()`
  pattern your corrected spec's snippets used.
- `src/app/pathways/{layout,page}.tsx`, `wizard/page.tsx`,
  `results/page.tsx` - Dream Box, age gate + parental consent, 5-step
  wizard shell, results placeholder.
- `scripts/download-school-data.ts` - World Bank Kenya Schools importer,
  targeted at the `pathways` schema.

## Two bugs found in the spec and fixed rather than pasted as-is

1. **Route group would have collided with the homepage.** The spec's
   directory structure used `app/(pathways)/page.tsx`. In Next.js, a
   `(parenthesized)` folder is a route *group* - it does not add a URL
   segment. `app/(pathways)/page.tsx` resolves to `/`, not `/pathways`,
   which would have collided directly with the existing
   `src/app/page.tsx` homepage and failed the build with a duplicate-
   route error. Built it as a real `src/app/pathways/` segment instead,
   which is also what the spec's own nav links (`href="/pathways"`,
   `href="/pathways/wizard"`) already assumed.

2. **Schema-qualification mismatch between the migration and the API
   routes.** The migration correctly creates every table under the
   `pathways` schema (`pathways.pathways`, `pathways.schools`, etc.),
   but the API route snippets queried `.from('pathways')`,
   `.from('schools')` with no schema qualifier - the Supabase JS client
   defaults to `public`, so every route would have silently queried
   nonexistent `public.*` tables once the migration actually ran. Added
   `.schema('pathways')` to every query in all five routes.

Also worth flagging for when the SQL is applied: PostgREST only serves
schemas listed in Supabase's Dashboard -> Project Settings -> API ->
"Exposed schemas". Added a closing comment to the migration file itself
as a reminder, but this is a manual dashboard step no SQL file can do -
without it, all five routes will return a "schema must be one of the
following..." error even with the migration and seed both applied
correctly.

One smaller fix: `/api/careers`'s `q` search param was being
interpolated directly into a PostgREST `.or()` filter string
(`career_name.ilike.%${q}%,...`) - a comma or paren in the input could
break out of the intended filter. Added a strip of `,()` before
building the filter string.

## Build result

```
npm run build
✓ Compiled successfully in 71s
Exit code: 0
```
New routes confirmed in the route table: `/pathways`,
`/pathways/wizard`, `/pathways/results`, `/api/pathways`,
`/api/combinations`, `/api/schools`, `/api/careers`, `/api/kjsa`.
No existing routes or files were modified - this is purely additive.

## Not applied, per instructions

Migration and seed SQL were generated as files only - nothing was run
against Supabase, per Fix 2 in your brief and the founder's explicit
"do not auto-apply" instruction. To bring this online: paste the
migration into Supabase Dashboard SQL Editor, run it, add `pathways` to
the exposed-schemas list, then paste and run the seed file.

## Not proceeding to Phase 2

Founder's instruction was explicit: Phase 1 only. Stopping here pending
review.
