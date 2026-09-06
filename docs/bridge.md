CYCLE 174 REPORT — Parts 1-3 + 5 done exactly as directed (with one live human override on
Part 2); Part 4 NOT executed - its target paths don't match this repo and would have deleted a
live, shipped route

Archived: this cycle's own brief is `docs/archive/bridge-174.md`.

PART 1 — ORPHAN REMOVAL: DONE
`src/components/admin/InstitutionDetailDrawer.tsx` deleted. Re-verified zero imports right before
deleting (only self-matches in its own file). No barrel export file exists at
`src/components/admin/index.ts` - Step 1.3 was a no-op, confirmed rather than assumed. The file
was never git-tracked in the first place (confirmed via `git status --short` before and after),
so there's nothing for `git add`/`git commit` to do here - Step 1.4's commit step doesn't apply.

PART 2 — STASH CLEANUP: PARTIAL, on direct human instruction overriding the brief
Dropping a stash is irreversible, and this session's own auto-mode classifier declined to run
`git stash drop` without an explicit human confirmation - correctly, given what was actually in
`stash@{0}`. Asked the user directly rather than proceed on the brief's word alone. Result:
`stash@{1}` (`WIP on main: ab08219 feat: Add institution onboarding portal` - just
`ReviewCard.tsx`/`ReviewForm.tsx`) dropped, since it's clearly superseded by the real ReviewCard
fix already shipped 2026-07-19. `stash@{0}` (`pre-theme-sweep-backup` - real, non-trivial WIP
touching `layout.tsx`, `DesktopNav.tsx`, `MobileNav.tsx`, a deleted `ThemeToggle.tsx`, a deleted
`theme.ts`, `package.json`/`package-lock.json`) was explicitly kept, not dropped - the user's own
words: "Destroying it permanently without knowing if we need it is wrong. We keep it for now...
audit its contents in a future cycle when we have bandwidth to decide if the theme-sweep is still
relevant post-Cycle 169." Restating that open question here so it isn't lost: is the theme-sweep
still wanted, and does it still apply cleanly given how much `layout.tsx` has changed since
(Cycle 169's favicon fix, at minimum)?

PART 3 — BRANCH CLEANUP: DONE, exactly as reviewed and approved
Reported the full merged/unmerged split before deleting anything, per direct instruction to
review first rather than auto-delete per the brief's own script. 9 branches confirmed fully
merged into `main` (git's own `-d` - the safe delete that refuses on unmerged content - was used,
not `-D`) and deleted on explicit go-ahead: `auth-hardening-preview`, `auth-security-preview`,
`feat/admin-pricing-portal`, `feat/elimux22-ad-billing`, `feat/elimux23-payments`,
`feat/skolex-ads`, `feat/skolex-home`, `feat/skolex-reference`, `feature/internship-module`.
`feature/skills-toggle` (last commit 2026-07-20, "University/Skills & Trades toggle UI +
placeholder modes") is NOT merged into main and was explicitly kept, per direct instruction. Note:
only LOCAL branch refs were deleted (`git branch -d`) - the corresponding `remotes/origin/*`
copies of those same 9 branches still exist on GitHub; deleting those is a more visible, separate
action nobody asked for this cycle, flagged rather than done unprompted.

PART 4 — NOT EXECUTED - target paths don't match this repo, would have deleted a live route
Checked the actual paths before running anything, same discipline as every prior cycle this
session, and this one has the same structural problem already caught three times before in this
bridge log: it targets `src/app/pathways` (whole directory), `src/app/kjsa`, `src/app/guidance`,
`src/app/schools/match` for deletion.
- `src/app/pathways/` is NOT purely second-wave WIP - it contains the entire base Pathways route:
  `layout.tsx`, `page.tsx` (now the Coming-Soon shield, committed and live per Cycle 173's own
  verification), `results/page.tsx`, `select/page.tsx`, `wizard/page.tsx` - all git-tracked,
  committed, currently deployed. `Remove-Item -Recurse -Force` on this directory, followed by
  Part 5's own `git add -A && git commit && git push`, would have committed the deletion of the
  live, working `/pathways` route - not cleaned up abandoned work, broken a shipped one.
- `src/app/kjsa`, `src/app/guidance`, and `src/app/schools/match` don't exist as page directories
  at all - the real untracked second-wave files live at `src/app/api/kjsa/analyze/route.ts`,
  `src/app/api/guidance/validate/route.ts`, and `src/app/api/schools/match/route.ts`
  respectively (under `api/`, a different tree entirely). The one genuinely second-wave file that
  IS inside `src/app/pathways/` is a single file, `results/PathwayResultsClient.tsx`, sitting
  alongside the real, tracked `results/page.tsx` - the brief's whole-directory delete doesn't
  distinguish the one from the other.
Given the last direct instruction moved straight from Part 3 to Part 5 without addressing this,
treated that as "not this cycle" rather than silently skip or silently improvise a rewrite of
someone else's plan. The corrected target list, if/when wanted: `src/app/api/kjsa/analyze/`,
`src/app/api/guidance/validate/`, `src/app/api/pathways/interpret/`, `src/app/api/schools/match/`,
`src/components/pathways/ShareResults.tsx`, `src/lib/pathways-pdf.ts`,
`src/app/pathways/results/PathwayResultsClient.tsx` (this last one only - not its sibling
`results/page.tsx`, `results/PathwayResultsClient.tsx`'s neighbor which is real and tracked) -
none of these overlap with anything live.

PART 5 — FINAL VERIFICATION: DONE
`git status`: clean of anything this cycle touched - only the same 3 pre-existing unrelated
modified files as every prior report (`docs/bridge.md` itself, `src/app/globals.css`,
`supabase/migrations/20260829000001_pathways_schema.sql`) plus the same untouched pile of
uncommitted archive snapshots and second-wave pathways files from Part 4 (not deleted, see
above). `git log --oneline -3`: `15b2184`/`00551e8`/`d178370` (Cycle 173's commits, unchanged -
nothing new to commit from Parts 1-3, since an orphan-file delete on an untracked file and
git-metadata operations (stash drop, branch delete) don't produce working-tree changes to commit).
`git stash list`: `stash@{0}: On main: pre-theme-sweep-backup` only. `git branch -a`: `main` +
`feature/skills-toggle` locally, remotes unchanged. `npm run build` (2.5GB heap +
`NEXT_PRIVATE_SKIP_SOURCEMAPS=1`): exit 0, zero errors - confirms the orphan removal broke
nothing, consistent with it having had zero imports to begin with.

Nothing to push from Parts 1-3/5 themselves (no working-tree changes were produced); this report
is the only new commit this cycle.
