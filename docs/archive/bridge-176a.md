# BRIDGE 176-A — AUDIT: Existing Institution Claims System + Public Search Gap

**Cycle:** 176-A  
**Status:** AUDIT ONLY. READ FILES. REPORT BACK. DO NOT BUILD YET.

---

## THE GAP

The user wants a **public-facing** portal where institutions, employers, and schools can:
1. Search by name to see if they're already on ElimuX
2. Search by domain to check if they're listed
3. Claim their profile if found
4. Request to be onboarded if not found

This was discussed but **never built**. We need to audit what exists first, then build correctly.

---

## MANDATORY AUDIT — READ THESE FILES AND REPORT BACK

### 1. Existing Admin Claims Page
```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Get-Content "src/app/admin/institution-claims/page.tsx" -Raw
Report: Full file contents. What does this page do? What tables does it query? What API does it call?
2. Existing API Client Functions
powershell
Get-Content "src/lib/api.ts" -Raw | Select-String -Pattern "institution" -Context 2,2
Report: What institution-related API functions exist? What are their signatures?
3. Backend Institution Routes
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
Get-ChildItem -Recurse -Filter "*institution*" | Select-Object FullName
Report: List all institution-related backend files.
4. Read Backend Institution Routes
powershell
Get-Content "src/routes/institutions.ts" -Raw
Get-Content "src/routes/institution-accounts.ts" -ErrorAction SilentlyContinue
Report: Full contents of both files (if they exist). What endpoints exist? What auth is required?
5. Database Schema — institution_accounts
In Supabase Dashboard → SQL Editor, run:
sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'institution_accounts' AND table_schema = 'public';
Report: What columns exist in this table?
6. Database Schema — institutions, employers, schools
sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('institutions', 'employers', 'schools') AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
Report: What columns exist in each table?
7. Check for Existing Public Claim/Join Pages
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Get-ChildItem -Recurse -Filter "*claim*" | Select-Object FullName
Get-ChildItem -Recurse -Filter "*join*" | Select-Object FullName
Report: Any existing public-facing claim or join pages?
8. Check Navigation for Join Link
powershell
Select-String -Path "src/components" -Pattern "Join|Claim|List Your" -Recurse
Report: Is there already a nav link for joining/claiming?
WHAT TO REPORT BACK
For each of the 8 steps above, copy-paste the FULL output. I need to see:
What the existing admin claims system looks like
What backend API routes exist for institutions
What the institution_accounts table schema is
What the public institutions, employers, schools table schemas are
Whether any public claim/join infrastructure already exists
DO NOT BUILD ANYTHING. DO NOT CREATE FILES. DO NOT COMMIT. THIS IS READ-ONLY.
After I see the audit output, I will write Bridge 176-B with the exact build instructions.