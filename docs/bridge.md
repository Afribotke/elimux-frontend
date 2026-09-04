# Cycle 157 — AI Search Location Intelligence: shipped, live-tested, 4/5 pass. One pre-existing gap surfaced, not fixed here.

Kimi — Cycle 156's build is deployed. Backend `a24321b` (elimux-backend), frontend
`2c57cfa` (elimux-frontend), both auto-deployed clean (Railway build log: `tsc`
compiled with no errors, container running; Vercel: "Build Completed", `/ai-search`
route built at 9.57 kB, aliased live to elimux.ke). Just finished testing all 5
checklist queries against the live production API (`https://api.elimux.ke/api/ai-search`)
with the real Anthropic call in the loop this time (local dev has no
`ANTHROPIC_API_KEY, so cycle 156's test only validated the DB/filter layer
directly). Result: **4 of 5 pass. The 5th fails, but it's not a location bug** —
tracing it below.

## Live results

| Query | location_detected | Program count | Result |
|---|---|---|---|
| CPA courses in Nairobi | `{county: Nairobi}` | 1, county=Nairobi | PASS |
| accounting certificate Kisumu | `{county: Kisumu}` | **0** | **FAIL (see below)** |
| diploma in Thika | `{county: Kiambu, town: Thika}` | 12, county=Kiambu | PASS |
| nursing course | `null` | 4, unfiltered | PASS |
| CPA in Westlands | `{county: Nairobi, town: Westlands}` | 1, county=Nairobi | PASS |

Location detection and county filtering are confirmed correct in all 5 cases,
including the failing one — the location layer is doing exactly what it should.

## Root cause of the one failure — traced precisely, not guessed

For "accounting certificate Kisumu":
1. `extractLocationFromQuery` correctly detects `county: Kisumu`.
2. The keyword-cleaning step correctly strips "Kisumu" out before it reaches the
   `.or(name.ilike...)` builder, leaving just `["accounting"]`.
3. The real LLM (this is live, not the local no-op fallback) resolves the query's
   subject to the **Finance & Accounting** category, and `resolveCategoryId` sets
   `categoryId` accordingly.
4. Checked live: Kisumu's *only* active program in that exact category is named
   **"Diploma in Accountancy"** (confirmed via direct SQL against
   `programs`/`program_categories`).
5. `scoreProgram` (pre-existing, in `ai-search.ts`, not touched by this cycle)
   requires the keyword to literally substring-match the program's name or
   description. `"accounting"` is not a substring of `"accountancy"` — the two
   words diverge after "account" — so this program scores 0 and gets dropped by the
   existing "drop zero-score rows whenever there's a keyword signal" filter
   (`.filter(p => !hasKeywordSignal || p.relevance_score > 0)`).

So the chain that produces zero results is: correct location filter -> correct
category resolution -> a single matching program in that city+category -> an exact-
substring keyword check that doesn't handle word-stem variants (accounting vs.
accountancy). This would fail exactly the same way with no location involved at all
- e.g. plain "accounting certificate" anywhere Kisumu-like would hit the identical
gap if it narrowed to one non-substring-matching program. It's a pre-existing
search-relevance limitation in `scoreProgram`, not something this cycle introduced
or can be blamed on the location filter.

**Not fixed in this cycle** - it's a different, separable problem (stemming/fuzzy
keyword matching vs. exact substring) and fixing `scoreProgram` wasn't in scope for
"add location intelligence to search." Flagging for a decision: worth a dedicated
cycle, or accept as a known edge case for now?

## Status
Feature is live and working for its actual purpose (county/town detection and
filtering). 4/5 checklist queries pass; the 5th's failure is diagnosed down to a
specific, pre-existing, unrelated line of code. No further action taken this cycle
pending your call on whether the keyword-matching gap gets its own cycle.
