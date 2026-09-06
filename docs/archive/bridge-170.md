Scope: Audit every file, migration, feature, and code change that exists in the working tree but is NOT committed to origin/main.
Excluded: DTB Academy module, KASNEB onboarding strategy (intentionally out of scope).
Goal: Produce a clean inventory with a verdict (COMMIT / STASH / DISCARD / FINISH / ARCHIVE) for each item.
Rule: Do NOT commit, push, or modify any file during this cycle unless explicitly instructed in a future cycle.
STEP 1: ENVIRONMENT CHECK
powershell
# Confirm we are in the correct project root
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
pwd
STEP 2: FULL GIT INVENTORY
Run these commands in order. After each command, copy the FULL output and paste it into a file called docs/audit-170-inventory.md (create it if it doesn't exist).
powershell
# 2.1 — Git status (modified, staged, untracked)
git status

# 2.2 — All modified files (names only)
git diff --name-only

# 2.3 — Diff stats per file (lines changed)
git diff --stat

# 2.4 — Untracked files (new files never committed)
git ls-files --others --exclude-standard

# 2.5 — Staged but not committed
git diff --cached --name-only

# 2.6 — Last 15 commits (to see where main is)
git log --oneline -15

# 2.7 — Any stashed work
git stash list

# 2.8 — Current branch and all local branches
git branch -v

# 2.9 — Check if working tree is clean or dirty (summary)
git status --short
STEP 3: SUPABASE MIGRATIONS AUDIT
powershell
# 3.1 — List all migration files, sorted
Get-ChildItem supabase/migrations -Name | Sort-Object

# 3.2 — Check which migrations are already applied vs pending
# (If you have the Supabase CLI configured)
npx supabase migration list
# If CLI is not configured, skip and note "CLI not available"
STEP 4: SOURCE CODE AUDIT — RECENTLY MODIFIED FILES
Find files that have been modified recently but may not show in git status if they were already committed in a previous cycle. We need to know what's "live but unverified."
powershell
# 4.1 — All .tsx / .ts / .css / .sql files modified in the last 14 days, sorted by time
Get-ChildItem src -Recurse -Include *.tsx,*.ts,*.css | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-14) } | Select-Object FullName, LastWriteTime | Sort-Object LastWriteTime -Descending

# 4.2 — All page.tsx files in src/app, sorted by last modified
Get-ChildItem src/app -Recurse -Filter "page.tsx" | Select-Object FullName, LastWriteTime | Sort-Object LastWriteTime -Descending

# 4.3 — All API route files, sorted by last modified
Get-ChildItem src/app -Recurse -Filter "route.ts" | Select-Object FullName, LastWriteTime | Sort-Object LastWriteTime -Descending
STEP 5: FEATURE-BY-FEATURE VERIFICATION
For each feature below, check if code exists and whether it's committed. Run the grep checks and note the result.
5.1 — Career Pathways
powershell
# Check if pathways pages exist
Get-ChildItem src/app -Recurse -Filter "*pathway*" | Select-Object FullName

# Check if pathways API routes exist
Get-ChildItem src/app -Recurse -Filter "*pathway*" | Where-Object { $_.Name -eq "route.ts" } | Select-Object FullName

# Check if pathways components exist
Get-ChildItem src/components -Recurse -Filter "*pathway*" | Select-Object FullName

# Check if pathways RLS migration exists
Test-Path supabase/migrations/20260829000001_pathways_schema.sql
5.2 — School Placement / Document Vault
powershell
Get-ChildItem src/app -Recurse -Filter "*placement*" | Select-Object FullName
Get-ChildItem src/app -Recurse -Filter "*vault*" | Select-Object FullName
Get-ChildItem src/components -Recurse -Filter "*placement*" | Select-Object FullName
5.3 — CRM Outreach (Email scraper)
powershell
Get-ChildItem src -Recurse -Filter "*crm*" | Select-Object FullName
Get-ChildItem src -Recurse -Filter "*outreach*" | Select-Object FullName
Get-ChildItem src -Recurse -Filter "*scraper*" | Select-Object FullName
5.4 — PWA Auto-Update
powershell
Get-ChildItem public -Recurse -Filter "sw.js" | Select-Object FullName
Get-ChildItem src -Recurse -Filter "*pwa*" | Select-Object FullName
Get-ChildItem src -Recurse -Filter "*service-worker*" | Select-Object FullName
5.5 — Location Intelligence (Cycles 155–157)
powershell
Get-ChildItem src -Recurse -Filter "*location*" | Select-Object FullName
Get-ChildItem src -Recurse -Filter "*constituency*" | Select-Object FullName
5.6 — AI Search (recent enhancements)
powershell
Get-ChildItem src -Recurse -Filter "*search*" | Select-Object FullName
5.7 — Senior Schools (Cycle 169 — should be committed)
powershell
# Verify it IS committed (sanity check)
git log --oneline --all -- src/components/home/NewHomePage.tsx | Select-Object -First 3
git log --oneline --all -- src/app/layout.tsx | Select-Object -First 3
STEP 6: COMPILE THE AUDIT REPORT
Create a file docs/audit-170-report.md with this exact structure. Fill in the findings from Steps 2–5.
Markdown
Copy
Code
Preview
# CYCLE 170 AUDIT REPORT — Uncommitted Work Inventory

## Date: [fill in]
## Auditor: Claude
## Excluded: DTB Academy, KASNEB Onboarding

---

## SECTION A: GIT STATUS SUMMARY
- Working tree clean? [YES / NO]
- Modified files count: [N]
- Untracked files count: [N]
- Staged files count: [N]
- Stashes present: [YES / NO — list them]

## SECTION B: MODIFIED FILES (with diff stats)
| File | Lines Changed | Feature | Verdict | Notes |
|------|--------------|---------|---------|-------|
| [fill] | [+N/-N] | [name] | [COMMIT/STASH/DISCARD/FINISH/ARCHIVE] | [why] |

## SECTION C: UNTRACKED FILES
| File | Feature | Verdict | Notes |
|------|---------|---------|-------|
| [fill] | [name] | [verdict] | [why] |

## SECTION D: FEATURE STATUS CHECK
| Feature | Code Exists? | Committed? | Tested? | Status | Recommended Action |
|---------|-------------|-----------|---------|--------|------------------|
| Career Pathways | YES/NO | YES/NO/PARTIAL | YES/NO | [description] | [action] |
| School Placement | YES/NO | YES/NO/PARTIAL | YES/NO | [description] | [action] |
| CRM Outreach | YES/NO | YES/NO/PARTIAL | YES/NO | [description] | [action] |
| PWA Auto-Update | YES/NO | YES/NO/PARTIAL | YES/NO | [description] | [action] |
| Location Intelligence | YES/NO | YES/NO/PARTIAL | YES/NO | [description] | [action] |
| AI Search | YES/NO | YES/NO/PARTIAL | YES/NO | [description] | [action] |
| Senior Schools (C169) | YES/NO | YES/NO | YES/NO | [description] | [action] |

## SECTION E: SUPABASE MIGRATIONS
| Migration File | Applied? | Pending? | Related Feature | Action Needed |
|---------------|---------|---------|----------------|-------------|
| [fill] | YES/NO/UNKNOWN | YES/NO/UNKNOWN | [name] | [action] |

## SECTION F: CARRY-FORWARD DECISIONS
List every item that needs a future cycle to resolve, with a one-line description.
STEP 7: DELIVERABLE
After completing Steps 1–6:
Save docs/audit-170-inventory.md and docs/audit-170-report.md.
Stage ONLY these two audit files: git add docs/audit-170-inventory.md docs/audit-170-report.md
DO NOT COMMIT OR PUSH. Stop here and report back to Kimi with:
The contents of docs/audit-170-report.md
Any blockers or anomalies encountered
END OF BRIDGE