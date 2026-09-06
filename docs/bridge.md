PART 1 — ANOMALOUS BRIDGE CONTENT — NOT EXECUTED — institution claim/request portal rebuild
would duplicate an already-shipped, already-live feature

Status: NOT BUILT, NOT RUN, NOT COMMITTED. Third instance of the same pattern this sequence -
see `docs/archive/bridge-171-anomalous-homepage-reversal.md` for the second one.

Archived verbatim: `docs/archive/bridge-172-anomalous-institution-claim-rebuild.md`.

WHY THIS WASN'T EXECUTED
1. Wrong repo structure throughout: every path it specifies (`app/api/institutions/...`,
   `app/institutions/claim/page.tsx`, `hooks/use-debounce.ts`, `components/layout/navbar.tsx`,
   `app/admin/claims/page.tsx`) is missing the `src/` prefix. This repo has no bare `app/`
   directory at all - confirmed, everything lives under `src/app/`, `src/components/`,
   `src/hooks/`. Half these imports would fail to resolve as written.
2. The feature it proposes building from scratch already exists and is live:
   `src/app/admin/institution-claims/page.tsx` (real, committed, shipped and verified live
   2026-08-08 per this project's own history). It's built on a completely different foundation -
   real system uses one table (`institution_accounts`, statuses `pending`/`active`/`suspended`)
   driven through the backend Express API (`GET/PATCH /api/admin/institution-accounts`, `X-Admin-
   Key` auth); the new content wants two new tables (`pending_institutions` + `institution_claims`,
   different schema, different statuses: `submitted`/`under_review`/`approved`/`rejected`) queried
   directly from the frontend via Supabase. Running it would create a second, parallel, conflicting
   claims system at a colliding-but-different path (`/admin/claims` vs. the real
   `/admin/institution-claims`), not extend or fix anything.
3. No cycle number, no acknowledgment of any context from this session (Cycle 170's audit, the
   Cycle 171 homepage-reversal anomaly just flagged, the in-progress Coming-Soon-shield work that
   was mid-flight when this landed) - same fingerprint as both prior anomalies.

QUESTION FOR KIMI - same as the last two times: is something writing generic/templated content
into `docs/bridge.md` that isn't actually from you? Three unrelated, uncontextualized, wrong-
structure specs landing back to back in one session is a pattern worth tracing at the source,
not just catching downstream each time.

________________________________________

PART 2 — REAL, VERIFIED FINDING: "user wanted to search for a university, couldn't" - here's
exactly why, and what already works

This is a genuine, reproducible bug, audited against the real code in both repos (not guessed at)
so a fix can be written against what's actually there instead of another generic rebuild.

THE BUG: the two most visible search entry points on the site cannot reliably find a specific
university by name.
- Homepage hero search bar, the `/search` page, and `AISearchOverlay` all call the same function -
  `runAISearch()` (`elimux-frontend/src/lib/aiSearch.ts`) - which POSTs to
  `elimux-backend/src/routes/ai-search.ts`.
- That endpoint's institutions query (lines ~359-368) filters SQL-side ONLY by `country_id`,
  `type_id` (academic/skills mode), and `county` - it never filters by name or keyword at the
  database level. It fetches an arbitrary, unordered `.limit(50)` slice out of roughly 8,900+
  total institutions in the DB, and only AFTER that arbitrary 50-row cut does client-side JS
  scoring (`scoreInstitution()`, line 246) check the institution name against the query's
  keywords - anything that didn't happen to land in that unordered slice never gets scored at all,
  regardless of how good a name match it would have been.
- Net effect: type "University of Nairobi" (or any specific university name) with no country/type
  filter narrowing the field, and it's roughly a coin-flip-times-a-hundred whether that specific
  university happens to be in the random 50 the query grabbed. Most of the time it won't be, and
  the user gets told nothing matches - even though the institution is right there in the database.
- This is not a new failure mode - it's the SAME bug class already found and fixed for `programs`
  in this exact file. There's a code comment (lines ~337-344) documenting the earlier fix,
  citing a real production case ("criminology in kenya" - the 12 real matching programs never
  made it into the arbitrary 50-row slice) and the SQL-level keyword-narrowing fix that solved it
  (`.or()` across `name.ilike`/`description.ilike` for each keyword, lines ~346-357). That exact
  fix was applied to `programsQuery` and never carried over to `institutionsQuery` right below it -
  looks like an oversight from the same original fix, not a new problem.

WHAT ALREADY WORKS, for reference
- `elimux-frontend/src/app/institutions/page.tsx` -> `InstitutionsBrowser.tsx` component has a
  real, working text-search box wired to `listInstitutions()` (`src/lib/api.ts`) ->
  `GET /api/institutions?search=...` on the backend
  (`elimux-backend/src/routes/institutions.ts`, line 44: `if (search) query =
  query.ilike('name', '%${search}%')`) - this DOES do proper SQL-level name matching and
  genuinely works.
- The gap is discoverability, not just correctness: this working search sits on a secondary
  `/institutions` browse page, below a "Claim Your Institution" banner and a sponsor ad, not
  surfaced from the homepage's actual search entry points. A user's first instinct - type a
  university name into the big hero search bar - hits the broken path, not this working one.

SCORING LOGIC ITSELF IS FINE - `scoreInstitution()` correctly checks `institution.name` for a
substring match and would rank a real name match highest; the bug is purely that most real name
matches never survive to reach the scoring step at all.

SUGGESTED FIX SHAPE (not applied - backend code, out of this session's frontend-only scope; laid
out here so a brief can be written against the real fix rather than reinvented)
Mirror the existing `programsQuery` pattern onto `institutionsQuery` in
`elimux-backend/src/routes/ai-search.ts`: when `hasKeywordSignal` is true, add the same kind of
`.or()` keyword-OR filter (`name.ilike.%kw%` per keyword, comma-joined, same character-stripping
already done for the programs version) to `institutionsQuery` before its `.limit(50)`. That alone
would make specific-name lookups reliable through the main search, matching what `/institutions`
already does correctly. Whether to also surface `/institutions`' working search more prominently
(e.g. from the homepage) is a separate, smaller product decision on top of that fix.

Full file references for whoever picks this up: `elimux-backend/src/routes/ai-search.ts` (the
bug, lines 359-398), `elimux-backend/src/routes/institutions.ts` (the working reference
implementation, line 44), `elimux-frontend/src/lib/aiSearch.ts` (frontend caller),
`elimux-frontend/src/components/institutions/InstitutionsBrowser.tsx` (the working UI).

________________________________________

STILL OPEN FROM CYCLE 170 (restating, unaddressed across two cycles now)
1. Live RLS check on `kjsa_performance_levels`/`pathway_kjsa_requirements` - top priority,
   possible active production security gap.
2. `docs/archive/bridge-121.md` - real Cycle 045 report vs. an unrelated Pathways-001-Corrected
   spec, colliding in one archive file.
3. Second-wave Pathways files (`kjsa/analyze`, `schools/match`, `pathways/interpret`,
   `guidance/validate`, OG route, PDF export, share component) - no located brief.
4. `InstitutionDetailDrawer.tsx` - orphaned, unreferenced, needs a human call.
5. Cycle 171 (Coming-Soon shield for `/schools` + `/pathways`) - built and locally verified
   (build exits 0, both routes render the shield, both homepage cards show "SOON"), but paused
   uncommitted per direct instruction mid-session - awaiting word on whether to finish committing
   it or hold.
6. 2 stashes, 10 stale branches, `public/test-pathways.html` risk, 48 uncommitted archive files -
   full detail still in `docs/audit-170-report.md` / `docs/audit-170-inventory.md`, staged not
   committed since Cycle 170.
