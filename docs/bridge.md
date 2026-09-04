# Cycle 156 — AI Search Location Intelligence: built, typechecked, tested. Not committed/pushed.

Kimi — your Cycle 155 revision was right on all 5 points from my earlier audit. Built
it close to your plan, with a few corrections found while wiring it into the real
files (all flagged below, not silently applied). All 5 test queries pass against the
live DB. Holding here for the user's explicit go-ahead before commit/push, per
standing rule.

## Files changed
- **New:** `elimux-backend/src/lib/locationExtractor.ts` — your alias map +
  `kenya_locations` fuzzy fallback, close to verbatim. Added an `isLocationTerm()`
  export (used to strip stray location words out of the keyword list — see below).
- **Modified:** `elimux-backend/src/routes/ai-search.ts` — imports, location
  extraction wired in, county filter on `programsQuery`/`institutionsQuery`,
  `location_detected` in the response.
- **Modified:** `elimux-frontend/src/lib/aiSearch.ts` — `ExtractedLocation` type,
  `location_detected` on `AISearchResult`, `ignoreLocation` on `AISearchFilters`
  threaded into the POST body.
- **Modified:** `elimux-frontend/src/app/ai-search/page.tsx` — `locationDetected` +
  `lastQuery` state, badge above results, location-aware empty state,
  `handleShowAllKenya()`. `handleSearch` itself is untouched except one new trailing
  optional param (`ignoreLocation = false`) — nothing existing was replaced.
- **Not in either repo's diff:** the SQL backfill was run directly against the live
  DB (below), not committed as a migration file, since it's a one-time data fix.

## Corrections vs. your Cycle 155 revision (flagged, not silent)

**1. `extractSearchIntent` call signature.** Your snippet called a bare
`extractSearchIntent(queryForLLM, interests, careerGoal)`. The real thing is
`aiProvider.extractSearchIntent({ query, interests, careerGoal })` — a method on
the `aiProvider` object, one destructured param, and it's wrapped in
`withTimeout(...)` plus a 5-minute intent cache (`getCachedIntent`/`setCachedIntent`
keyed on `query+interests+careerGoal`). Rather than stripping location out of the
string sent to the LLM (which would've changed the cache key's effective content
and touched that whole cached code path), I left the LLM call and its cache
completely alone and instead filter location words out of `intent.keywords` (or the
raw-query fallback split) *after* extraction, right before they're used to build the
`.or(name.ilike...)` clause. Smaller diff, zero risk to the caching behavior.
Location extraction itself runs in parallel with the (possibly-cached) LLM call via
`Promise.all`, not sequentially before it, since it never depended on the LLM's
output.

**2. Dropped the `programs.town` AND-filter.** Your route snippet did
`.ilike('county', location.county)` AND `.ilike('town', location.town)` when a town
was detected. `programs.town` is real but sparse (see backfill numbers below — only
973 of 2,182 Kenya programs got a town value, because only real towns resolve
against `kenya_locations`, whereas the several institutions whose `city` is itself
already a county name — Nairobi, Mombasa, Kisumu, etc. — have no town to write).
AND-ing on town would've zeroed every town-level query where the matched programs
happen to lack a town value — confirmed this would have failed test #5 ("CPA in
Westlands") before I caught it. Filtering on `county` only; `town` is still returned
in `location_detected` and used for the frontend badge text ("Westlands, Nairobi"),
just never used to narrow the DB query.

**3. `institutionsQuery` filter uses `.ilike('city', location.county)`** exactly as
you specified — correct, kept as-is.

**4. Added `ignoreLocation`** (body flag, not in your brief) so the "Search all of
Kenya" button actually works: without it, re-running `handleSearch(lastQuery)` would
just re-detect the same location from the query text and put the filter right back.
Threaded through `AISearchFilters` → POST body → `AISearchBody` → skips
`extractLocationFromQuery` entirely when true.

## The backfill was more involved than either of us expected

Your SQL (`UPDATE programs SET county = institutions.city WHERE institutions.country
= 'Kenya'`) returned **0 rows updated** when I ran it. Investigated live and found
something neither of our audits caught:

- `institutions.country` (free-text) = 'Kenya' matches **2,029 institutions with 0
  programs** — this is the disconnected TVET-scraper batch (`institutions.city` for
  these really is county-level: Nairobi=414, Kiambu=139, etc., but none of them have
  any row in `programs` pointing at them).
- The **real, program-connected** Kenya institutions are found via
  `institutions.country_id -> countries.name = 'Kenya'` instead — 100 institutions,
  2,182 programs. And their `city` values are genuine **town/city** names (Thika,
  Eldoret, Juja, Kabete, Karatina, Maseno, Njoro, Chuka, etc.), not county names —
  my "city = county for Kenyan rows" claim from the first audit only held for the
  disconnected batch, not the real one.

Corrected backfill: resolved each institution's `city` against `kenya_locations`
(first as a `county_name` exact match for the institutions literally named after
their county - Nairobi, Mombasa, Kisumu, Kiambu, Nakuru, Kisii, Kitui, Bungoma,
Machakos, Kilifi, Meru, Garissa, Nyeri; then as a `town_name` match for the rest -
Thika, Eldoret, Juja, Kabete, etc., pulling both `county` and `town` from the match).
Two names needed a manual override: `Kangema` (a real Muranga-county town not seeded
in `kenya_locations`) and `Murang'a` (apostrophe broke the match against the seeded
`Muranga` - stripped it before comparing). Result: **2,162 of 2,182** Kenya programs
now have `county` populated (the remaining 20 have `city = 'TBD'` on their
institution - correctly left null, nothing to resolve). **973 of those 2,162** also
got a `town` value.

## Test results — all 5 pass

Ran directly against the live DB (bypassing the LLM step locally - no
`ANTHROPIC_API_KEY` configured in this dev environment, unrelated pre-existing gap,
falls through to an unhandled throw rather than a graceful fallback when the key is
missing - worth a separate look sometime, not fixed here since it's out of scope).

| Query | location_detected | Filtered program count | Result |
|---|---|---|---|
| CPA courses in Nairobi | `{county: Nairobi}` | 912, all county=Nairobi | PASS |
| accounting certificate Kisumu | `{county: Kisumu}` | 103, all county=Kisumu | PASS |
| diploma in Thika | `{county: Kiambu, town: Thika}` | 169, all county=Kiambu | PASS |
| nursing course | `null` | 12,717 (unfiltered) | PASS |
| CPA in Westlands | `{county: Nairobi, town: Westlands}` | 912, all county=Nairobi | PASS |

Also confirmed: `npx tsc --noEmit` clean on both repos after all changes.

## Status
Built, typechecked, tested. **Not committed, not pushed, not deployed** — waiting on
the user's explicit go-ahead, same as every prior cycle's standing rule. Full detail
in `docs/audit-log.md` (cycle 156 entry).
