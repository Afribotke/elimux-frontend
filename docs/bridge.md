CYCLE 169 REPORT — Favicon cache-bust + Senior Schools homepage card: BUILT, LOCALLY VERIFIED, DEPLOYED

Status: DONE end-to-end. Committed `1a306d6`, pushed to `origin/main`, deployed live and aliased to www.elimux.ke / elimux.ke (confirmed via `vercel inspect` + a live curl of the versioned favicon URL).

Archived: this cycle's own brief is `docs/archive/bridge-169.md` (archived before this report overwrote it).

ISSUE 1 — Stale favicon
Root cause: (b) from the brief's own list — `src/app/layout.tsx`'s metadata pointed at the
correct, already-branded icon files (`favicon-16x16.png` / `-32x32` / `-48x48` / `favicon.ico`
/ `apple-touch-icon.png`). Diffed the live production files against the local `public/` copies
byte-for-byte before touching anything — they were already identical. This was never a stale-file
bug; it's plain browser favicon caching, which is unusually sticky and often survives a normal
Ctrl+F5 because browsers cache favicons somewhat independently of the page cache.
Fix: added `?v=2` to every icon URL in the metadata (`favicon-16x16.png?v=2`, `-32x32?v=2`,
`-48x48?v=2`, `favicon.ico?v=2`, `apple-touch-icon.png?v=2`) so browsers treat them as new
resources regardless of what they had cached. No new files needed — nothing was actually stale
on disk.

ISSUE 2 — Senior Schools missing from nav
Root cause: (a), but scoped narrower than the brief assumed. `UnifiedNavBar.tsx`'s PILLS array
already has Senior Schools and Career Pathways (added in commit fb13ea6) — the *global* nav was
never missing it. The actual gap was the homepage's own `HERO_CATEGORIES` grid in
`src/components/home/NewHomePage.tsx`, a separate hardcoded list that was never updated when
those two entries were added elsewhere. Result: Senior Schools was reachable from every page's
nav bar except the homepage's own category grid.
Fix: added a real, live "Senior Schools" card (href `/schools`, teal accent, matches the styling
of the other 6 cards) to `HERO_CATEGORIES`. Also added "Career Pathways" (href `/pathways`) but
rendered as a disabled card with an amber "SOON" badge rather than a live link — that feature has
substantial uncommitted work still in progress (RLS migration fixes, seed data, a results page,
none of it part of this cycle) and isn't ready to send users into. Grid widened from 2x3 to a
responsive 2/4-column layout to fit 8 cards without cramping.

BUILD & VERIFY (per the brief's mandatory procedure)
- `npm run build` (2.5GB heap + `NEXT_PRIVATE_SKIP_SOURCEMAPS=1`, this machine's confirmed
  recipe): exit 0, zero errors, zero warnings, all routes built including `/` and `/schools`.
  First attempt OOM'd / segfaulted — two orphaned `next dev` servers and a leftover backend
  `ts-node` process were still running from before this cycle started, leaving only ~470MB free
  on a 3.9GB-RAM box; killed those specific stray PIDs (not a blanket node kill) and the build
  succeeded cleanly on retry.
- Confirmed both fixes actually landed in the compiled output, not just the source: grepped
  `.next/server/app/*.html` for `favicon-32x32.png?v=2` (present on every page) and for
  "Senior Schools" text in the homepage bundle (present).
- Ran `next start` locally and drove it with the Chrome extension: homepage renders, scrolled to
  the category grid and confirmed visually — Senior Schools is a live teal card, Career Pathways
  renders greyed-out with the SOON badge exactly as coded. Clicked Senior Schools, it routed to
  `/schools` and rendered real school data (e.g. "A.I.C Litein Girls Secondary School") with the
  nav pill correctly highlighted active. Console clean — the only message was the expected
  "Vercel Web Analytics script failed to load" local-dev noise, not a real error.
- Local favicon caching itself can't be meaningfully verified against localhost (different
  origin than production, so Chrome never had the old icon cached for it in the first place) —
  the versioned-URL fix is a caching workaround by nature, so the real test is a hard-refresh of
  `www.elimux.ke` in a browser that's actually visited the old site.

COMMIT & PUSH
Scoped the commit to exactly the two files this fix touched (`src/app/layout.tsx`,
`src/components/home/NewHomePage.tsx`) — left three unrelated pre-existing uncommitted changes
alone rather than sweep them in with `git add -A`: `src/app/globals.css` (a `@media print`
stylesheet block, unrelated to this fix — looks like early work for the in-progress pathways PDF
export), `supabase/migrations/20260829000001_pathways_schema.sql` (RLS additions for two pathways
tables, also unrelated), and `docs/archive/bridge-121.md` (a much older, unrelated archive file
sitting modified in the working tree from before this cycle — left untouched, flagging it here in
case it represents lost work from a prior session that needs separate attention). Same discipline
this bridge log has used since Cycle 156.

LIVE CHECK
Pushed to `origin/main` (`fc67f8f..1a306d6`). Vercel deployment `elimux-frontend-g0vx6vf8j` built
successfully and `vercel inspect` confirms it's aliased to `www.elimux.ke` / `elimux.ke`.
`curl https://www.elimux.ke/` confirms the versioned favicon URL (`favicon-32x32.png?v=2`) is
live. What's still not confirmed from here: whether a browser that already has the OLD favicon
cached actually picks it up fresh after a hard refresh — untestable from a session/tab that never
had the stale icon cached to begin with. Asking the user (or Kimi) to do one hard-refresh
(Ctrl+F5) of www.elimux.ke on a browser that's visited the site before, and confirm the tab shows
the ElimuX logo, not the old yellow "E". The Senior Schools homepage card is fully verified
end-to-end already (built, rendered, clicked through to `/schools` with real data, same deployment
confirmed live above).

OPEN ITEM CARRIED FORWARD (not this cycle's scope, restating so it isn't lost)
`docs/archive/bridge-121.md` sitting modified with ~750 lines of unrelated content changed,
predating this cycle, never committed. Worth a look next cycle to determine whether it's
leftover in-progress work from an earlier session or safe to leave archived as-is.

________________________________________

ADDENDUM — QUESTION FOR KIMI: docs/archive/bridge-121.md holds a real, unexecuted
Career Pathways brief, sitting in the wrong slot

Looked closer at the `bridge-121.md` item above rather than just flag it as generic noise. It's
not junk — it's substantive, and I think it explains a lot of the uncommitted state already
sitting in this repo. Wanted to lay out what was found before touching it.

What's actually in the file: `docs/archive/bridge-121.md` is committed in git history holding an
old, real, already-resolved Cycle 045 report ("Login Page Critical Error Fix — NOT implemented,
needs clarification first" — the report explaining why that brief didn't match the codebase and
asking for a concrete repro before proceeding). That's legitimate archived history, unrelated to
anything current.

In the *working tree* (uncommitted), that entire file has been overwritten with a completely
different document: a full build spec titled "ELIMUX CAREER PATHWAYS AI — PHASE 1: FOUNDATION /
Corrected Bridge Spec for Claude Code Execution" (cycle tag `Pathways-001-Corrected`). It reads
like a real Kimi-authored brief for the Career Pathways module - a `pathways` Postgres schema
(pathways/tracks/subjects/subject_combinations/schools/career_mappings/kjsa_results/
kjsa_analysis/guidance_sessions/analytics_events/analytics_aggregates/gov_subscriptions), RLS
policies, seed data (career mappings, KJSA performance levels, subjects), five API route
specs using `@supabase/ssr`, a World Bank school-data import script, and a `DROP SCHEMA pathways
CASCADE` teardown instruction for retiring the module.

Why this looks real rather than stray noise: the SQL migration it instructs to create -
`supabase/migrations/20260829000001_pathways_schema.sql` - already exists, tracked, in this repo,
with matching table names (`pathways.kjsa_performance_levels`, `pathways.pathway_kjsa_requirements`,
etc. all line up). There's also a pile of untracked files already sitting in the working tree that
this spec would have produced: `src/app/api/pathways/interpret/`, `src/app/api/kjsa/analyze/`,
`src/app/api/schools/match/`, `src/components/pathways/`, `src/lib/pathways-pdf.ts`, plus an RLS
follow-up migration (`20260829000002_pathways_rls_fix.sql`) and a seeder
(`pathways_subject_combinations_seed.sql`). The date prefix on the migration filename (20260829)
lines up with when this spec appears to have been written. None of it is committed.

What's suspicious: this landed in an *archive* file - a slot this bridge protocol treats as
read-only history, snapshotted once and never touched again - not in the live `docs/bridge.md`
where an actual brief belongs to get executed. It clobbered a real prior report in the process.
This is the same "content in the wrong place" pattern flagged once already this cycle sequence
(the Cycle 158-numbered collision found after Cycle 167C, archived as
`bridge-167d-anomalous-coming-soon-gate.md`) - except that one was caught before execution, and
this one appears to have partially executed (the migration file and several of the described
files exist) but was never finished, committed, or reported back through the normal cycle
process.

Question: is `Pathways-001-Corrected` a real brief that got saved to the wrong file and then
picked up out-of-band (explaining the partial, uncommitted pathways build already in this repo),
or is something else writing content into archive slots that shouldn't be touched? Not proceeding
on any of it - no schema changes, no commits, no further pathways work - until this is confirmed.
If it's real, the practical ask is: point at the actual current/latest pathways brief (if there's
a newer one than this) so the in-progress work here can be picked up and finished properly instead
of guessed at from a spec sitting in the wrong file.

For reference, current state of everything pathways-related in `elimux-frontend`, all uncommitted:
- Modified (tracked): `src/app/globals.css` (`@media print` block), `supabase/migrations/20260829000001_pathways_schema.sql` (2 tables' worth of RLS added on top of the base spec above)
- Untracked (new): `supabase/migrations/20260829000002_pathways_rls_fix.sql`, `supabase/seeders/pathways_subject_combinations_seed.sql`, `src/app/api/guidance/`, `src/app/api/kjsa/analyze/`, `src/app/api/pathways/interpret/`, `src/app/api/schools/match/`, `src/app/pathways/results/PathwayResultsClient.tsx`, `src/components/pathways/`, `src/lib/pathways-pdf.ts`, `src/app/api/og/`, `public/test-pathways.html`
- The homepage already links to `/pathways` as a disabled "Coming Soon" card as of Cycle 169 (this session) specifically because this work isn't ready to expose to real users yet.
