# BRIDGE 174 — FINAL CLEANUP: Orphans, Stashes, Branches, Pathways WIP

**Cycle:** 174  
**Status:** EXECUTE IN ORDER. STOP AND REPORT AFTER EACH STEP.  
**Goal:** Working tree clean. No orphaned code. No stale backups.

---

## PART 1 — DELETE ORPHANED COMPONENT

**File:** `src/components/admin/InstitutionDetailDrawer.tsx`  
**Reason:** Zero imports anywhere. The live component is `InstitutionApplicationDrawer`. This is dead code.

### Step 1.1 — Verify Zero Imports
```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Select-String -Path "src" -Pattern "InstitutionDetailDrawer" -Recurse
Confirm output shows ONLY the file itself (no imports from other files).
Step 1.2 — Delete File
powershell
Remove-Item "src/components/admin/InstitutionDetailDrawer.tsx"
Step 1.3 — Check Barrel Exports
powershell
Select-String -Path "src/components/admin/index.ts" -Pattern "InstitutionDetailDrawer"
If found, remove that export line.
Step 1.4 — Build & Commit
powershell
npm run build
git add -A
git commit -m "Cycle 174 — Remove orphaned InstitutionDetailDrawer.tsx"
PART 2 — DROP BOTH STASHES
Both stashes are obsolete. Drop them.
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git stash list
git stash drop stash@{0}
git stash drop stash@{0}
git stash list
Confirm git stash list returns empty.
PART 3 — BRANCH CLEANUP
Step 3.1 — Identify Merged Branches (Safe to Delete)
powershell
git branch --merged main
Copy-paste the full output.
Step 3.2 — Delete All Merged Branches Except main
powershell
git branch --merged main | Select-String -NotMatch "main" | ForEach-Object { $_.ToString().Trim() } | ForEach-Object { git branch -d $_ }
Step 3.3 — Identify Unmerged Branches (Need Review)
powershell
git branch --no-merged main
Copy-paste the full output.
Step 3.4 — For Each Unmerged Branch, Report Last Commit
powershell
git branch --no-merged main | ForEach-Object { $b = $_.ToString().Trim(); Write-Output "=== $b ==="; git log -1 --format="%h %ai %s" $b }
Copy-paste the full output. I will decide which unmerged branches to keep or delete.
PART 4 — SECOND-WAVE PATHWAYS FILES
These are uncommitted files from an abandoned brief. Since /pathways is shielded, they serve no live purpose but clutter the working tree.
Step 4.1 — List All Uncommitted Pathways-Related Files
powershell
git status --short | Select-String "pathways"
git status --short | Select-String "kjsa"
git status --short | Select-String "guidance"
Also check for any untracked files in these directories:
powershell
Get-ChildItem -Path "src/app/pathways" -ErrorAction SilentlyContinue
Get-ChildItem -Path "src/app/kjsa" -ErrorAction SilentlyContinue
Get-ChildItem -Path "src/app/guidance" -ErrorAction SilentlyContinue
Get-ChildItem -Path "src/app/schools/match" -ErrorAction SilentlyContinue
Step 4.2 — If Files Exist, Archive to Feature Branch
If any of the above directories/files exist and are uncommitted:
powershell
git checkout -b archive/pathways-second-wave
git add -A
git commit -m "Archive: Second-wave Pathways WIP files (Cycle 174)"
git checkout main
This preserves the work on a branch but cleans main's working tree.
Step 4.3 — Delete from Main Working Tree
powershell
# Only run these if the directories exist
Remove-Item -Recurse -Force "src/app/pathways" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src/app/kjsa" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src/app/guidance" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "src/app/schools/match" -ErrorAction SilentlyContinue
Step 4.4 — Verify Clean
powershell
git status
Report the output. Working tree should show only the 3 pre-existing unrelated modified files (if any) and no untracked pathways debris.
PART 5 — FINAL VERIFICATION
Step 5.1 — Full Status Report
powershell
git status
git log --oneline -3
git stash list
git branch -a
Step 5.2 — Build Check
powershell
npm run build
If build passes, commit any remaining cleanup:
powershell
git add -A
git commit -m "Cycle 174 — Working tree cleanup: drop stashes, purge merged branches, archive pathways WIP"
git push origin main
EXECUTION ORDER
Part 1 — Delete drawer, build, commit
Part 2 — Drop stashes
Part 3 — Branch cleanup (report unmerged before deleting)
Part 4 — Pathways WIP archive
Part 5 — Final verification, build, commit, push
STOP AND REPORT AFTER EACH PART.