CYCLE 173 REPORT — all four parts done, deployed, live-verified

Archived: this cycle's own brief is `docs/archive/bridge-173.md`.

PREREQUISITE
Working tree dirty in the same unchanged ways as prior cycles (3 pre-existing unrelated
modified files, dozens of untracked historical archive snapshots + the in-progress pathways
second wave - none of it touched this cycle). `elimux-backend` confirmed at
`C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend`. Shield code confirmed already committed
and pushed (`e6a146e`, on `origin/main`) - skipped straight to Step 1.3 per the brief's own
decision table.

PART 1 — SHIELD LIVE VERIFICATION: PASS
Commit `e6a146e`. All 4 checks pass live: `www.elimux.ke/schools` and `/pathways` both render
"Coming Soon" (confirmed via title tag + body content), homepage shows exactly 2 "SOON" badges
(Senior Schools + Career Pathways).

PART 2 — AI SEARCH FIX: DONE, DEPLOYED, LIVE-VERIFIED - but the brief's exact patch wasn't
enough on its own, fixed further before shipping
- Read `elimux-backend/src/routes/ai-search.ts` first, as instructed: `programsQuery` block
  starts line 325, its keyword-OR fix is at line 356; `institutionsQuery` starts line 359, its
  `.limit(50)` isn't a standalone assignment (the brief assumed one) - it's inline inside a
  `Promise.all` at line 391. Neither `employersQuery` nor `schoolsQuery` exist anywhere in this
  file - Steps 2.3/2.4 were no-ops, confirmed via grep, not just assumed absent.
- Applied the brief's exact keyword-OR fix to `institutionsQuery` first, then tested it directly
  against production data before trusting it (this machine has no `ANTHROPIC_API_KEY` locally, so
  ran the query logic standalone against the real DB rather than through the full LLM-driven
  route). Result: NOT sufficient. Splitting "University of Nairobi" into
  ["University","of","Nairobi"] and OR-ing per word matches 9,392 of ~11,000 active institutions
  - "University" and "of" are both extremely common substrings - and with no ORDER BY, the target
  still doesn't reliably survive the `.limit(50)` cut. Confirmed the institution genuinely exists
  (`id de3c8f25...`, exact name "University of Nairobi", active) and an exact-phrase match returns
  precisely 1 row - so the fix needed to do better than per-word OR.
- Added a second, small, targeted query alongside the keyword-OR one: the literal raw query
  phrase against `name` (limit 10), merged ahead of the broader keyword-OR results before
  scoring, deduped by id. This guarantees an exact/near-exact name match always reaches the
  ranking step regardless of how broad the per-word OR match set is.
- Verified against real data before shipping: "University of Nairobi" -> ranks #1 (previously
  absent from results entirely). "Kenyatta University" -> ranks #2, tied in score with "Jomo
  Kenyatta University of Agriculture and Technology" (a genuine, reasonable near-tie, not a bug).
  "Strathmore" -> "Strathmore University" ranks #1.
- Committed `b99777d` to `elimux-backend`, pushed, Railway auto-deployed (confirmed via
  `railway status`, back Online after a ~30s build). Live end-to-end test against
  `https://api.elimux.ke/api/ai-search` (through the real LLM intent pipeline, not the local
  bypass) confirms "University of Nairobi" is the first institution result on production right
  now, with real programs listed under it.

PART 3 — RLS AUDIT: RAN, RESULT IS NOT A SECURITY ISSUE - the brief's own pass/fail framing
didn't fit these two tables, corrected before concluding
- Adapted the audit SQL's `schemaname = 'public'` filter to `pathways` first (per Cycle 170's own
  finding, these tables live in the `pathways` schema, not `public` - running the brief's SQL
  as-written would have silently returned zero rows and looked like the tables don't exist).
- `rowsecurity = true` on both `kjsa_performance_levels` and `pathway_kjsa_requirements`. Both
  have a real, explicit policy: `"Public read kjsa levels"` / `"Public read kjsa requirements"`,
  PERMISSIVE, `roles = {public}`, `cmd = SELECT`, `qual = true`. Owner: `postgres` on both.
  Anonymous read test: allowed (returns all 4 rows of `kjsa_performance_levels` as `anon`).
- The brief's own audit SQL treats "anon read allowed" as a fail condition and its Step 3.2 says
  to STOP without fixing if so - but checked what these tables actually are before treating that
  literally: both are non-sensitive reference/lookup data (KJSA level labels EE/ME/AE/BE; which
  subjects + minimum level each pathway requires), the exact same shape and intent as every other
  "Public read X" table already in this schema (`pathways.pathways`, `.tracks`, `.subjects`,
  `.subject_combinations`, `.schools`, `.career_mappings` all have identical public-read
  policies). Blocking anon read here would break the app for the exact same reason blocking it on
  those would. This resolves Cycle 170's flagged "possible live RLS security gap" as a false
  alarm - RLS is on, the policy is deliberate and correctly scoped, nothing to fix. (Separately:
  the uncommitted 4-line migration diff Cycle 170 found, which appeared to be *adding* this RLS,
  turns out to already be live in production - the migration file on disk was just never updated
  to match what was actually run. The file staying uncommitted/stale isn't a functional problem,
  just a documentation-drift one.)

PART 4 — CLEANUP
- 4.1 Archive collision: confirmed it wasn't two documents in one file, but an uncommitted
  working-tree overwrite of real committed history. Preserved the Pathways-001-Corrected spec
  verbatim to a new file, `docs/archive/bridge-121-pathways-collision.md`, then restored
  `docs/archive/bridge-121.md` to its real, committed Cycle 045 content (`git checkout --`).
  Committed `00551e8`, pushed.
- 4.2 Orphaned component: confirmed `InstitutionDetailDrawer.tsx` has zero imports anywhere
  (grepped `src`, only self-matches). Per the brief's own instruction to ask rather than decide,
  put this to the user directly rather than guess - they asked that it go to Kimi instead of being
  decided here. Not deleted, not wired up, left exactly as-is.
- 4.3 Stash/branch list: same as the prior report (2 stashes: `pre-theme-sweep-backup` touches
  `src/app/layout.tsx`, likely to conflict if popped now that Cycle 169 changed that file; the
  `institution onboarding portal` WIP stash is tiny, `ReviewCard.tsx`/`ReviewForm.tsx` only, and
  looks superseded by the real ReviewCard fix already shipped 2026-07-19. 10 stale branches,
  oldest around Cycle 042-046 era, none evaluated for merge-worthiness). Same as 4.2 - put to the
  user, who asked that this go to Kimi too rather than be decided directly. No stash dropped, no
  branch deleted.
- 4.4 Risk file: `public/test-pathways.html` existed, was untracked (never committed - `git rm`
  wasn't applicable), deleted from disk directly. Nothing to commit for this step since it was
  never tracked in the first place.

QUESTIONS FOR KIMI (explicitly deferred here per direct instruction, not decided unilaterally)
1. `InstitutionDetailDrawer.tsx` (`src/components/admin/`) - built, unwired, zero imports,
   sitting beside the real `InstitutionApplicationDrawer` which is live. Delete it, or is there a
   real place it's meant to be mounted?
2. 2 stashes + 10 stale branches in `elimux-frontend` - drop/keep/review? Full detail: stash 0 is
   `pre-theme-sweep-backup` (touches `layout.tsx`, `DesktopNav.tsx`, `MobileNav.tsx`,
   `ThemeToggle.tsx` deleted, `theme.ts` deleted, `package.json`/`package-lock.json`); stash 1 is
   `WIP on main: ab08219 feat: Add institution onboarding portal` (tiny, just
   `ReviewCard.tsx`/`ReviewForm.tsx`, likely stale). Branches: `auth-hardening-preview`,
   `auth-security-preview`, `feat/admin-pricing-portal`, `feat/elimux22-ad-billing`,
   `feat/elimux23-payments`, `feat/skolex-ads`, `feat/skolex-home`, `feat/skolex-reference`,
   `feature/internship-module`, `feature/skills-toggle`.

STILL OPEN, CARRIED FORWARD YET AGAIN
- Second-wave Pathways files (`kjsa/analyze`, `schools/match`, `pathways/interpret`,
  `guidance/validate`, OG route, PDF export, share component) - still no located brief for these;
  now moot in the sense that `/pathways` is shielded behind Coming Soon regardless, but the files
  themselves are still sitting uncommitted.
- `docs/audit-170-report.md` / `docs/audit-170-inventory.md` - already committed as part of
  `e6a146e` (swept in alongside the shield commit, ahead of the review gate Kimi's Cycle 170 brief
  had asked for - flagged, not undone, per the last report).
