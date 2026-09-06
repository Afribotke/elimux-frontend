# BRIDGE 173 — CLEAR ALL PENDING: Shield Commit + AI Search Fix + RLS Audit + Cleanup

**Cycle:** 173  
**Status:** EXECUTE IN ORDER. STOP AND REPORT AFTER EACH PART.  
**Rule:** Read files before editing. Verify before committing.

---

## PREREQUISITE — AUDIT CURRENT STATE (RUN FIRST)

Open PowerShell. Run these commands exactly. Copy-paste the FULL output back.

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git status
git log --oneline -5
git diff --name-only
git diff --cached --name-only
git stash list
git branch -a
Also check if the backend repo exists:
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE"
ls
Report back:
Is the working tree clean or dirty?
What files are uncommitted/unstaged?
Is the Coming-Soon shield code already committed or still pending?
Does elimux-backend folder exist? What is its exact path?
DO NOT PROCEED TO PART 1 UNTIL I SEE THIS OUTPUT.
PART 1 — COMING-SOON SHIELD COMMIT/VERIFY
Context: Cycle 171 built Coming-Soon shields for /schools and /pathways. The user later committed via PowerShell when Claude was unavailable. We must verify the current state before acting.
Step 1.1 — Locate the Shield Files
Check if these files exist and their git status:
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git ls-files | findstr "schools"
git ls-files | findstr "pathways"
git ls-files | findstr "coming-soon"
git ls-files | findstr "ComingSoon"
Also check the homepage for SOON badges:
powershell
git diff HEAD -- src/app/page.tsx
Step 1.2 — Decision Branch
Table
Scenario	Action
Files already committed and pushed	Skip to Step 1.3 (live verification only)
Files committed locally but not pushed	Run git push origin main, then Step 1.3
Files exist but uncommitted/unstaged	Run npm run build. If zero errors, stage with git add -A, commit as Cycle 171 — Coming-Soon shield for /schools and /pathways, push, then Step 1.3
Files missing / not found	STOP. Report exactly which files are missing. Do not rebuild.
Step 1.3 — Live Verification
Open browser and verify:
https://www.elimux.ke/schools → renders "Coming Soon" shield
https://www.elimux.ke/pathways → renders "Coming Soon" shield
Homepage → Schools card shows "SOON" badge
Homepage → Career Pathways card shows "SOON" badge
Report: commit hash + live verification result.
PART 2 — AI SEARCH BACKEND FIX
Bug: elimux-backend/src/routes/ai-search.ts fetches institutions with .limit(50) BEFORE filtering by user keywords. Typing "University of Nairobi" fails because the match rarely survives the random 50-row slice. The programsQuery in the same file already has the correct fix. The institutionsQuery was missed.
Step 2.1 — Read the Backend File
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
Read src/routes/ai-search.ts. Find these three sections and report back the exact line numbers:
The programsQuery block with its .or() keyword filter (the working reference)
The institutionsQuery block with its .limit(50) call (the bug)
Whether employersQuery and schoolsQuery blocks exist in the same file
Step 2.2 — Apply Fix to institutionsQuery
After reading the file and confirming the pattern, find the line:
TypeScript
institutionsQuery = institutionsQuery.limit(50);
Insert this block immediately BEFORE that line:
TypeScript
// === FIX: keyword-narrowing for institutions (mirrors programsQuery pattern) ===
if (hasKeywordSignal && keywords.length > 0) {
  const institutionKeywordOr = keywords
    .map((kw) => `name.ilike.%${kw}%`)
    .join(',');
  institutionsQuery = institutionsQuery.or(institutionKeywordOr);
}
// === END FIX ===
Step 2.3 — Check & Fix employersQuery (If It Exists)
If the file contains an employersQuery with .limit(N) and NO keyword-OR filter before it, insert this BEFORE its .limit() call:
TypeScript
if (hasKeywordSignal && keywords.length > 0) {
  const employerKeywordOr = keywords
    .map((kw) => `name.ilike.%${kw}%`)
    .join(',');
  employersQuery = employersQuery.or(employerKeywordOr);
}
Step 2.4 — Check & Fix schoolsQuery (If It Exists)
If the file contains a schoolsQuery with .limit(N) and NO keyword-OR filter before it, insert this BEFORE its .limit() call:
TypeScript
if (hasKeywordSignal && keywords.length > 0) {
  const schoolKeywordOr = keywords
    .map((kw) => `name.ilike.%${kw}%`)
    .join(',');
  schoolsQuery = schoolsQuery.or(schoolKeywordOr);
}
Step 2.5 — Test & Deploy
Save file
If running locally: restart backend server
If deployed: commit with message Cycle 173 — AI search keyword filter for institutions, push to backend repo, deploy to Railway/Render
Test on live site: type "University of Nairobi" in homepage search → must appear consistently
Test employer name search if employersQuery was fixed
Test school name search if schoolsQuery was fixed
Report back: which queries were fixed + live test results.
PART 3 — RLS SECURITY AUDIT
Tables: kjsa_performance_levels, pathway_kjsa_requirements
Step 3.1 — Run Audit SQL
In Supabase Dashboard → SQL Editor, run this as a single query:
sql
-- ============================================================
-- RLS SECURITY AUDIT — Cycle 173
-- ============================================================

-- 1. Check if RLS is enabled on target tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('kjsa_performance_levels', 'pathway_kjsa_requirements')
AND schemaname = 'public';

-- 2. List all policies on these tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('kjsa_performance_levels', 'pathway_kjsa_requirements')
AND schemaname = 'public';

-- 3. Check table ownership
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('kjsa_performance_levels', 'pathway_kjsa_requirements')
AND schemaname = 'public';

-- 4. Check if anonymous users can read (this should FAIL / be blocked)
DO $$
BEGIN
  PERFORM * FROM public.kjsa_performance_levels LIMIT 1;
  RAISE NOTICE 'SECURITY ISSUE: ANON READ ALLOWED on kjsa_performance_levels';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: ANON READ BLOCKED on kjsa_performance_levels';
END;
$$;

DO $$
BEGIN
  PERFORM * FROM public.pathway_kjsa_requirements LIMIT 1;
  RAISE NOTICE 'SECURITY ISSUE: ANON READ ALLOWED on pathway_kjsa_requirements';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: ANON READ BLOCKED on pathway_kjsa_requirements';
END;
$$;
Step 3.2 — Report Back
Copy-paste the FULL output from Supabase SQL Editor. I need to see:
Is rowsecurity = true for both tables?
What policies exist (if any)?
Do the anonymous read tests block or allow?
Who owns the tables?
If RLS is OFF or anon read is ALLOWED, STOP. Do not fix yet. Report the output and I will provide the exact RLS fix SQL.
PART 4 — CYCLE 170 CLEANUP
Step 4.1 — Archive File Collision Fix
Read docs/archive/bridge-121.md. Report back:
Does it contain TWO different documents in one file?
What are the first 10 lines and last 10 lines?
If it contains a collision between a real Cycle 045 report and an unrelated Pathways spec, split them:
Keep the real Cycle 045 content in docs/archive/bridge-121.md
Move the unrelated Pathways content to docs/archive/bridge-121-pathways-collision.md
Step 4.2 — Orphaned Component Check
Locate InstitutionDetailDrawer.tsx:
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Get-ChildItem -Recurse -Filter "*InstitutionDetailDrawer*" | Select-Object FullName
Also search for any imports of it:
powershell
Select-String -Path "src" -Pattern "InstitutionDetailDrawer" -Recurse
Report back:
Where is the file located?
Is it imported anywhere?
If orphaned (zero imports), ask user: delete or wire up?
Step 4.3 — Stash & Branch Cleanup
List all stashes and branches:
powershell
git stash list
git branch -a
Report back the full list. User will decide which to keep/drop.
Step 4.4 — Remove Risk File
Check if public/test-pathways.html exists:
powershell
Test-Path "public/test-pathways.html"
If it exists, delete it and commit:
powershell
git rm public/test-pathways.html
git commit -m "Cycle 173 — Remove test-pathways.html risk file"
EXECUTION ORDER — DO NOT SKIP
Prerequisite — Run audit commands, report output
Part 1 — Shield commit/verify (only after Prerequisite is clear)
Part 2 — AI search fix (only after Part 1 is done)
Part 3 — RLS audit (only after Part 2 is deployed)
Part 4 — Cleanup (only after Part 3 is complete)
STOP AND REPORT AFTER EACH PART.