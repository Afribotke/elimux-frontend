# BRIDGE 175-C — FINAL CLEANUP: OG Route + Remote Branches + Modified Files + Snapshots + Stash

**Cycle:** 175-C  
**Status:** EXECUTE IN ORDER. STOP AND REPORT AFTER EACH PART.

---

## PART 1 — OG SHARE-IMAGE ROUTE (NEWLY FLAGGED)

**File:** `src/app/api/og/`  
**Context:** Part of the same Career Pathways Phase 2/3 work as the 7 files just archived. Still untracked on `main`.

### Step 1.1 — Verify It Exists
```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Test-Path "src/app/api/og/route.ts"
Get-ChildItem -Recurse "src/app/api/og"
Step 1.2 — If It Exists, Archive to Existing Branch
powershell
git checkout archive/pathways-second-wave
git add src/app/api/og/
git commit --amend -m "Archive: Career Pathways Phase 2-3 WIP (kjsa/analyze, pathways/interpret, schools/match, guidance/validate, ShareResults, PDF, wizard wiring, OG image) — Cycle 175-B/C"
git checkout main
Step 1.3 — Delete from Main
powershell
Remove-Item -Recurse -Force "src/app/api/og" -ErrorAction SilentlyContinue
Step 1.4 — Verify
powershell
git status
Confirm src/app/api/og/ no longer appears.
PART 2 — DELETE 9 REMOTE BRANCHES FROM GITHUB
These 9 branches were deleted locally in Cycle 174. Their remotes/origin/* copies still exist on GitHub.
Step 2.1 — List Current Remote Branches
powershell
git branch -r
Step 2.2 — Delete the 9 Merged Branches
powershell
git push origin --delete auth-hardening-preview
git push origin --delete auth-security-preview
git push origin --delete feat/admin-pricing-portal
git push origin --delete feat/elimux22-ad-billing
git push origin --delete feat/elimux23-payments
git push origin --delete feat/skolex-ads
git push origin --delete feat/skolex-home
git push origin --delete feat/skolex-reference
git push origin --delete feature/internship-module
Step 2.3 — Verify
powershell
git branch -r
Confirm the 9 branches no longer appear.
PART 3 — AUDIT 3 PRE-EXISTING MODIFIED FILES
Files: docs/bridge.md, src/app/globals.css, supabase/migrations/20260829000001_pathways_schema.sql
Step 3.1 — Show Diffs
powershell
git diff docs/bridge.md
git diff src/app/globals.css
git diff supabase/migrations/20260829000001_pathways_schema.sql
Copy-paste the FULL output of all three diffs. STOP. Wait for my decision on each file (commit, revert, or hold).
PART 4 — ARCHIVE SNAPSHOTS PILE
Step 4.1 — List All Uncommitted Archive Files
powershell
git status --short | Select-String "docs/archive"
Copy-paste the FULL list. STOP. Wait for my decision (commit all, delete stale, or selective commit).
PART 5 — THEME-SWEEP STASH
Step 5.1 — Audit Stash Contents
powershell
git stash show -p stash@{0} | Select-String "^diff --git" | ForEach-Object { $_.ToString() }
Copy-paste the FULL file list. STOP. Wait for my decision (drop, pop & resolve, or keep).
EXECUTION ORDER
Part 1 — OG route (if exists, archive + delete)
Part 2 — Remote branch deletion
Part 3 — Report diffs, wait for my call
Part 4 — Report list, wait for my call
Part 5 — Report file list, wait for my call
STOP AND REPORT AFTER EACH PART.