# BRIDGE 175-B — ARCHIVE PATHWAYS PHASE 2 WIP TO BRANCH, CLEAN MAIN

**Cycle:** 175-B  
**Status:** EXECUTE EXACTLY. STOP AND REPORT IF ANY CHECK FAILS.

---

## GOAL

Move all uncommitted Career Pathways Phase 2 files to a preserved `archive/pathways-second-wave` branch, then delete them from `main` working tree. Live, committed Pathways routes must remain untouched.

---

## STEP 1 — VERIFY EXACT FILE LIST

Run these commands. Report the FULL output.

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git status --short | Select-String "pathways"
git status --short | Select-String "kjsa"
git status --short | Select-String "guidance"
Also check for the specific files:
powershell
Test-Path "src/app/api/kjsa/analyze/route.ts"
Test-Path "src/app/api/pathways/interpret/route.ts"
Test-Path "src/app/api/schools/match/route.ts"
Test-Path "src/app/api/guidance/validate/route.ts"
Test-Path "src/components/pathways/ShareResults.tsx"
Test-Path "src/lib/pathways-pdf.ts"
Test-Path "src/app/pathways/results/PathwayResultsClient.tsx"
And check if src/app/pathways/wizard/page.tsx has uncommitted changes:
powershell
git diff src/app/pathways/wizard/page.tsx
Report back: which of these 8 paths exist, and whether wizard/page.tsx has uncommitted diff.
STEP 2 — CREATE ARCHIVE BRANCH
powershell
git checkout -b archive/pathways-second-wave
STEP 3 — STAGE ALL PHASE 2 FILES
For each file that exists from Step 1, stage it:
powershell
git add src/app/api/kjsa/analyze/route.ts
git add src/app/api/pathways/interpret/route.ts
git add src/app/api/schools/match/route.ts
git add src/app/api/guidance/validate/route.ts
git add src/components/pathways/ShareResults.tsx
git add src/lib/pathways-pdf.ts
git add src/app/pathways/results/PathwayResultsClient.tsx
If wizard/page.tsx has uncommitted Phase 2 changes, stage those too:
powershell
git add src/app/pathways/wizard/page.tsx
STEP 4 — COMMIT TO ARCHIVE BRANCH
powershell
git commit -m "Archive: Career Pathways Phase 2 WIP (kjsa/analyze, pathways/interpret, schools/match, guidance/validate, ShareResults, PDF, wizard wiring) — Cycle 175-B"
STEP 5 — RETURN TO MAIN AND DELETE
powershell
git checkout main
Now delete the specific Phase 2 files from disk. DO NOT delete whole directories — some contain live, committed files.
powershell
Remove-Item -Recurse -Force "src/app/api/kjsa/analyze" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src/app/api/pathways/interpret" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src/app/api/schools/match" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src/app/api/guidance/validate" -ErrorAction SilentlyContinue
Remove-Item "src/components/pathways/ShareResults.tsx" -ErrorAction SilentlyContinue
Remove-Item "src/lib/pathways-pdf.ts" -ErrorAction SilentlyContinue
Remove-Item "src/app/pathways/results/PathwayResultsClient.tsx" -ErrorAction SilentlyContinue
If wizard/page.tsx had uncommitted Phase 2 changes, revert it to the committed Phase 1 shell:
powershell
git checkout -- src/app/pathways/wizard/page.tsx
STEP 6 — VERIFY LIVE ROUTES UNTOUCHED
Confirm these committed, live, shielded files still exist:
powershell
Test-Path "src/app/pathways/page.tsx"
Test-Path "src/app/pathways/layout.tsx"
Test-Path "src/app/pathways/results/page.tsx"
Test-Path "src/app/pathways/select/page.tsx"
Test-Path "src/app/pathways/wizard/page.tsx"
Test-Path "src/app/api/kjsa/route.ts"
If any are missing, STOP. Do not build or commit.
STEP 7 — BUILD & COMMIT CLEANUP
powershell
npm run build
If build passes:
powershell
git status
git add -A
git commit -m "Cycle 175-B — Remove Career Pathways Phase 2 WIP files (archived to archive/pathways-second-wave branch)"
git push origin main
git push origin archive/pathways-second-wave
STEP 8 — FINAL VERIFICATION
powershell
git status
git log --oneline -3
git branch -a
Report: working tree state, last 3 commits, branch list.
RETRIEVAL NOTE (For Future)
When Career Pathways is revived, retrieve the archived files with:
powershell
git checkout archive/pathways-second-wave -- src/app/api/kjsa/analyze/route.ts
git checkout archive/pathways-second-wave -- src/app/api/pathways/interpret/route.ts
git checkout archive/pathways-second-wave -- src/app/api/schools/match/route.ts
git checkout archive/pathways-second-wave -- src/app/api/guidance/validate/route.ts
git checkout archive/pathways-second-wave -- src/components/pathways/ShareResults.tsx
git checkout archive/pathways-second-wave -- src/lib/pathways-pdf.ts
git checkout archive/pathways-second-wave -- src/app/pathways/results/PathwayResultsClient.tsx
# Plus wizard/page.tsx if it was archived
Then wire the wizard to call these routes per docs/archive/bridge-124.md (Cycle 048 execution report).