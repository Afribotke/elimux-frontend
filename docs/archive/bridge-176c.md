# BRIDGE 176-C — BUILD A-D: Seamless Claim + Employer Search + School Search + Domain Auto-Verify

**Cycle:** 176-C  
**Status:** AUDIT FIRST PER FILE, THEN BUILD. STOP AND REPORT IF FILES DON'T MATCH EXPECTATIONS.

---

## MANDATORY AUDIT — READ THESE 4 FILES FIRST

Before building anything, read and report the FULL contents of:

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Get-Content "src/app/institution/register/page.tsx" -Raw
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
Get-Content "src/routes/employers.ts" -ErrorAction SilentlyContinue
Get-Content "src/routes/schools.ts" -ErrorAction SilentlyContinue
Get-Content "src/routes/institution-portal.ts" -Raw
Also check if these API client functions exist:
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Select-String -Path "src/lib/api.ts" -Pattern "listEmployers|listSchools" -Context 2,2
Report back the FULL contents of all 4 files + the grep results. I will confirm the exact modifications before you proceed. This prevents the wrong-path/wrong-assumption problems from prior cycles.
PART A — SEAMLESS CLAIM HANDOFF
Goal: When a user clicks "Claim Profile" on /join, the /institution/register page should pre-select that institution instead of making them search again.
Expected File Structure (from Cycle 176-A/B)
src/app/institution/register/page.tsx has its own search UI. It does NOT currently read institution_id from URL.
Modification
After reading the file, add this logic:
Read institution_id from URL using useSearchParams
If institution_id is present, fetch that specific institution via GET /api/institutions/<id> and pre-populate the selection state
Show the claim form immediately instead of the search UI
If no institution_id, keep existing search behavior unchanged
Exact Code Pattern (adapt to actual file structure after audit)
TypeScript
import { useSearchParams } from 'next/navigation';

// Inside component:
const searchParams = useSearchParams();
const preselectedId = searchParams.get('institution_id');

useEffect(() => {
  if (preselectedId) {
    // Fetch and pre-select
    fetch(`/api/institutions/${preselectedId}`)
      .then(r => r.json())
      .then(data => setSelectedInstitution(data));
  }
}, [preselectedId]);
STOP AND REPORT: Show me the exact lines you plan to modify before applying.
PART B — EMPLOYER SEARCH IN /JOIN
Goal: /join also searches employers by name.
Backend Check/Fix
Read src/routes/employers.ts (or wherever employer routes live). Check if GET / supports a search query param with SQL ilike('name', '%${search}%').
If it exists: Skip backend, use existing endpoint.
If it does NOT exist: Add it:
TypeScript
// In the GET / handler for employers
if (req.query.search) {
  query = query.ilike('name', `%${req.query.search}%`);
}
Frontend Modification
In src/app/join/page.tsx, after the institution search call, add:
TypeScript
// After institution search
const employers = await listEmployers({ search: searchQuery, limit: 10 });
allResults = [
  ...allResults,
  ...(employers?.data || []).map((e: any) => ({ ...e, entityType: 'employer' as const })),
];
If listEmployers doesn't exist in src/lib/api.ts, add it (mirror listInstitutions pattern).
Domain Search for Employers
Also check website_url (or website) field in the domain filter:
TypeScript
// In domain search branch
const employers = await listEmployers({ limit: 100 });
const filteredEmployers = (employers?.data || [])
  .filter((e: any) => e.website_url?.toLowerCase().includes(domain))
  .map((e: any) => ({ ...e, entityType: 'employer' as const }))
  .slice(0, 10);
STOP AND REPORT: Confirm the employer table's website field name (website vs website_url) and whether the search endpoint exists before modifying.
PART C — SCHOOL SEARCH IN /JOIN
Goal: /join also searches schools by name.
Backend Check/Fix
Read src/routes/schools.ts (or wherever school routes live). Check if GET / supports search query param.
If it exists: Use it.
If it does NOT exist: Add it:
TypeScript
if (req.query.search) {
  query = query.ilike('school_name', `%${req.query.search}%`); // or 'name' — check actual column
}
CRITICAL NOTE: The schools table has 0 rows (confirmed in Cycle 176-A). Building the search endpoint is correct infrastructure, but it will return nothing until data is seeded. The /join page should handle empty results gracefully.
Frontend Modification
In src/app/join/page.tsx, add school search alongside institutions and employers:
TypeScript
const schools = await listSchools({ search: searchQuery, limit: 10 });
allResults = [
  ...allResults,
  ...(schools?.data || []).map((s: any) => ({ ...s, entityType: 'school' as const })),
];
If listSchools doesn't exist in src/lib/api.ts, add it.
Domain Search for Schools
Same pattern — check actual website column name first.
STOP AND REPORT: Confirm the school table's actual name column (school_name vs name) and website column before modifying.
PART D — DOMAIN AUTO-VERIFICATION
Goal: When a user claims an institution with an email whose domain matches the institution's website_url, auto-approve instead of sending to manual review.
Backend Modification
File: src/routes/institution-portal.ts
Location: POST /register handler
After reading the file, find where institution_accounts is inserted. Modify to:
TypeScript
// Extract domain from claim email
const claimDomain = email.split('@')[1]?.toLowerCase();

// Fetch institution website_url
const { data: institution } = await supabase
  .from('institutions')
  .select('website_url')
  .eq('id', institution_id)
  .single();

const institutionDomain = institution?.website_url
  ?.toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/^www\./, '')
  .split('/')[0];

// Auto-approve if domains match
const autoApprove = claimDomain && institutionDomain && claimDomain === institutionDomain;

// Insert with appropriate status
await supabase.from('institution_accounts').insert({
  institution_id,
  user_id,
  email,
  contact_name,
  role: 'admin',
  status: autoApprove ? 'active' : 'pending',
});
If auto-approved, also grant immediate access — the user should be able to access the dashboard right away without waiting for admin approval.
Frontend Impact
If auto-approved, skip the "pending approval" message and redirect straight to /institution/dashboard.
STOP AND REPORT: Show me the exact lines in institution-portal.ts where the insert happens before I confirm the modification.
EXECUTION ORDER
Audit — Read all 4 files, report back
Part A — Seamless claim handoff (after I confirm the modification)
Part B — Employer search (after I confirm the backend state)
Part C — School search (after I confirm the backend state)
Part D — Domain auto-verify (after I confirm the exact insert location)
Build & test — npm run build in both frontend and backend
Commit & push — Frontend + backend commits
Live verification — Test all 4 features on production
STOP AND REPORT AFTER EACH PART. DO NOT PROCEED TO THE NEXT PART UNTIL I CONFIRM.