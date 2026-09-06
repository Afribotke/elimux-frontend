# BRIDGE 175-D — FINAL RESIDUALS: 6 Public Assets + 2 SQL Files

**Cycle:** 175-D  
**Status:** AUDIT FIRST, THEN ACT. STOP AND REPORT.

---

## STEP 1 — LIST ALL 6 PUBLIC/ ASSETS

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git status --short | Select-String "public/"
Copy-paste the FULL output.
For each file, also run:
powershell
Get-Item "public/<filename>" | Select-Object Name, Length, LastWriteTime
Report: file name, size, last modified date.
STEP 2 — LIST THE 2 SQL FILES
powershell
git status --short | Select-String "\.sql"
Copy-paste the FULL output.
For each SQL file, show the first 20 lines:
powershell
Get-Content "supabase/migrations/<filename>" -Head 20
STEP 3 — DECISION TABLE (Report Back, Wait for My Call)
For each of the 8 files, I will tell you:
Table
Decision	Action
Commit	git add <file>
Delete	Remove-Item <file>
Hold	Leave as-is
Do not commit or delete any file until I see the list and decide per item.
STEP 4 — EXECUTE DECISIONS
After I respond with per-file decisions:
powershell
# For each "Commit" file:
git add <path>

# For each "Delete" file:
Remove-Item <path>

# Then:
git status
npm run build
git commit -m "Cycle 175-D — Clean residual public assets and SQL files"
git push origin main
STEP 5 — FINAL VERIFICATION
powershell
git status
git log --oneline -3
Report: working tree state, last 3 commits.