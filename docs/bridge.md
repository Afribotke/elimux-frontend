CYCLE 175-A REPORT — investigation only, nothing edited/committed, per the brief

Archived: this cycle's own brief is `docs/archive/bridge-175a.md`.

1. WHAT THE FILE DOES
`src/app/api/kjsa/analyze/route.ts` is a POST endpoint, the "KJSA Analyzer": takes a learner's
KJSA subject results (`{subject, level}[]`, level one of EE/ME/AE/BE) plus an optional
`target_pathway_id`, fetches every row from `pathways.pathways` (schema-qualified) joined with
`tracks` and `pathway_kjsa_requirements`, and for each pathway computes a weighted fit percentage
against that pathway's subject requirements (critical-subject pass rate, EE/ME/AE/BE mapped to
4/3/2/1, weighted by each requirement's `weight`). Returns pathways sorted by fit %, the top
match, up to 3 recommended subject combinations for the target pathway (if given), and a plain
strongest/weakest-subjects breakdown. No writes, read-only against `pathways.*`.

2. WAS IT EVER COMMITTED?
No. `git log --all --oneline -- src/app/api/kjsa/analyze/route.ts` returns empty - never
committed on any branch, ever. Same for the creation-commit check (`--diff-filter=A`) - empty.
It has existed only as an uncommitted working-tree file this entire time.

3. IS IT REFERENCED ANYWHERE IN src?
No. `Select-String`/grep for both `kjsa/analyze` and `/api/kjsa` across `src` returns nothing -
not imported, not fetched, not called from any page or component currently in the tree. (Its
intended caller, `src/app/pathways/wizard/page.tsx`, is real and tracked, but the currently-live
version of that file is the original Phase 1 shell, not the Phase 2 version that calls this route
- see point 4.)

4. IS IT MENTIONED IN BRIDGE ARCHIVES? YES - full, coherent origin story, not orphaned/mystery
work:
- `docs/archive/bridge-123.md` - the actual brief: "Career Pathways Phase 2: AI Engine + School
  Matching," Cycle 048.
- `docs/archive/bridge-124.md` - Cycle 048's execution report. This file, plus 3 siblings
  (`pathways/interpret`, `schools/match`, `guidance/validate`) and a modified
  `src/app/pathways/wizard/page.tsx` (Phase 1 shell -> Phase 2 API-calling version, never
  committed either) were all built together, build-tested clean (`npm run build`, exit 0), and
  deliberately staged-not-committed per that cycle's own "Rule 0" and the founder's instruction.
  Explicitly stopped before "Phase 3" (PDF + Share), per that report's last line.
- Cycle 048 also found a real bug at the time: `pathways.pathway_kjsa_requirements` and
  `pathways.kjsa_performance_levels` had RLS enabled with **zero** SELECT policies (confirmed live
  against `pg_policies` at the time), so `/api/kjsa/analyze` returned 0% fit for every pathway
  despite the seed data being present - an omission in the original Phase 1 RLS spec, not this
  cycle's bug. Cycle 048 wrote the fix (the same 2 `CREATE POLICY` statements that later showed up
  as an uncommitted diff to `20260829000001_pathways_schema.sql`, plus the standalone
  `20260829000002_pathways_rls_fix.sql`) but explicitly did NOT run it - per this project's
  standing manual-paste-into-Supabase-Dashboard workflow.
- `docs/archive/bridge-130.md` (Cycle 050) confirms that fix STILL hadn't been pasted in as of
  that cycle - explicitly excluded Career Pathways Phase 2 from a production PWA deploy that same
  cycle specifically because of this unresolved RLS gap.
- This closes a loop from two cycles ago: Cycle 170's audit found the same migration diff still
  sitting uncommitted and flagged a "possible live RLS security gap"; Cycle 173's live query found
  RLS enabled *with* a working public-read policy already in place. Given Cycle 048/050's account,
  the policy genuinely was missing for a while (confirmed broken, not a false alarm from day one)
  and was fixed by someone manually pasting the SQL into the Supabase Dashboard at some point
  between Cycle 050 and Cycle 170 - the migration *file* on disk just never caught up to match
  what was actually run, which is why `git diff` kept showing it as "pending" long after it wasn't.

5. WHAT ELSE SITS IN src/app/api/kjsa/
Two files total: this one (`analyze/route.ts`) and `src/app/api/kjsa/route.ts` (the Phase 1 base
endpoint - POST manual KJSA result entry - which IS committed and tracked, part of the base
Pathways feature that shipped in August).

SUMMARY FOR THE NEXT DECISION
This isn't abandoned/mystery code - it's real, working, previously-tested Phase 2 work that
stopped short of Phase 3 on explicit instruction and was never committed. The RLS blocker that
made it return 0% at the time is now resolved (confirmed live in Cycle 173). If Phase 2 is wanted,
the remaining step is wiring `src/app/pathways/wizard/page.tsx` to actually call these 4 routes
(per bridge-124's account, that wiring was already built once - whether the current on-disk
`wizard/page.tsx` still has it wasn't checked this cycle, out of the read-only/no-edits scope
given). `/pathways` itself is currently shielded behind Coming Soon regardless (Cycle 171), so
none of this is user-facing either way until that's lifted.
