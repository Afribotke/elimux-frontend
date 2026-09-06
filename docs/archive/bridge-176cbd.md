# BRIDGE 176-C-BD — BUILD: Employer Public Search + Domain Auto-Verify

**Cycle:** 176-C-BD  
**Status:** EXECUTE NOW. BOTH PARTS TOGETHER.

---

## PART B — EMPLOYER PUBLIC SEARCH (Backend + Frontend)

### B.1 — CREATE BACKEND ROUTE

**File:** `elimux-backend/src/routes/employers-public.ts`  
**Action:** CREATE

```typescript
// === FILE: src/routes/employers-public.ts ===
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.get('/', async (req, res) => {
  try {
    const { search, domain } = req.query;
    let query = supabase
      .from('employers')
      .select('id, company_name, location_county, industry, website_url')
      .eq('is_active', true);

    if (search && typeof search === 'string') {
      query = query.ilike('company_name', `%${search}%`);
    }

    if (domain && typeof domain === 'string') {
      query = query.ilike('website_url', `%${domain}%`);
    }

    const { data, error } = await query.limit(10);

    if (error) throw error;
    res.json({ data, count: data?.length || 0 });
  } catch (err) {
    console.error('Employer search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
// === END FILE ===
B.2 — MOUNT ROUTE IN INDEX
File: elimux-backend/src/routes/index.ts (or wherever routes are mounted)
Action: MODIFY — Add mount line
First, read the file to confirm the pattern:
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
Get-Content "src/routes/index.ts" -Raw
Look for existing app.use('/api/... lines. If the pattern matches, add this line with the others:
TypeScript
import employersPublicRouter from './employers-public';
// ...
app.use('/api/employers', employersPublicRouter);
If index.ts does NOT use app.use('/api/... pattern, STOP and report the actual mount pattern before proceeding.
B.3 — ADD FRONTEND API FUNCTION
File: elimux-frontend/src/lib/api.ts
Action: MODIFY — Add listEmployersPublic function
Find the listInstitutions function. Add immediately after it:
TypeScript
export const listEmployersPublic = async (params?: { search?: string; domain?: string; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.domain) query.set('domain', params.domain);
  if (params?.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_URL}/api/employers?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch employers');
  return res.json();
};
If API_URL is not available in this file, use the same base URL pattern as listInstitutions.
B.4 — UPDATE /JOIN PAGE TO SEARCH EMPLOYERS
File: elimux-frontend/src/app/join/page.tsx
Action: MODIFY — Add employer search calls
Find the performSearch function. In the name search branch, after the institution search, add employer search:
TypeScript
// After: const institutions = await listInstitutions({ search: searchQuery, limit: 10 });
// Insert:
const employers = await listEmployersPublic({ search: searchQuery, limit: 10 });
Then merge results:
TypeScript
allResults = [
  ...(institutions?.data || []).map((i: any) => ({ ...i, entityType: 'institution' as const })),
  ...(employers?.data || []).map((e: any) => ({ 
    id: e.id, 
    name: e.company_name, 
    entityType: 'employer' as const,
    industry: e.industry,
    city: e.location_county,
    country: '',
    website_url: e.website_url,
    logo_url: e.logo_url
  })),
];
In the domain search branch, add employer domain filter:
TypeScript
const employers = await listEmployersPublic({ limit: 100 });
const filteredEmployers = (employers?.data || [])
  .filter((e: any) => e.website_url?.toLowerCase().includes(domain))
  .map((e: any) => ({ 
    id: e.id, 
    name: e.company_name, 
    entityType: 'employer' as const,
    industry: e.industry,
    city: e.location_county,
    country: '',
    website_url: e.website_url,
    logo_url: e.logo_url
  }))
  .slice(0, 10);

allResults = [...allResults, ...filteredEmployers];
Update getClaimUrl for employers (remove employer_id param since we haven't built seamless handoff for employers yet):
TypeScript
const getClaimUrl = (entity: SearchResult) => {
  if (entity.entityType === 'institution') return `/institution/register?institution_id=${entity.id}`;
  if (entity.entityType === 'employer') return `/employer/register`;
  return '#';
};
Update getApplyUrl for employers:
TypeScript
const getApplyUrl = (type: string) => {
  if (type === 'institution') return '/institution-onboarding';
  if (type === 'employer') return '/employer/register';
  return '#';
};
PART D — DOMAIN AUTO-VERIFY FOR INSTITUTIONS
File: elimux-backend/src/routes/institution-portal.ts
Action: MODIFY — Add domain verification before insert
Find the POST /register handler. Locate this exact block (around lines 93-103):
TypeScript
const { data: account, error: insertError } = await supabaseAdmin
    .from('institution_accounts')
    .insert({
        institution_id,
        user_id: user.id,
        contact_name: contact_name || null,
        email: user.email,
        status: 'pending'
    })
    .select()
    .single();
Replace the entire block with:
TypeScript
// === DOMAIN AUTO-VERIFICATION ===
const { data: institution } = await supabaseAdmin
    .from('institutions')
    .select('website_url')
    .eq('id', institution_id)
    .single();

const claimDomain = user.email?.split('@')[1]?.toLowerCase();
const institutionDomain = institution?.website_url
    ?.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

const autoApprove = claimDomain && institutionDomain && claimDomain === institutionDomain;
// === END DOMAIN AUTO-VERIFICATION ===

const { data: account, error: insertError } = await supabaseAdmin
    .from('institution_accounts')
    .insert({
        institution_id,
        user_id: user.id,
        contact_name: contact_name || null,
        email: user.email,
        status: autoApprove ? 'active' : 'pending'
    })
    .select()
    .single();
Do NOT add role: 'admin' — the current code doesn't set it, and institution_accounts.role has a DB default that makes it work. Changing this could break existing behavior.
STEP 3 — BUILD & TEST
Frontend
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
Test locally:
http://localhost:3000/join → search "Safaricom" or known employer → should show employer result
Click "Claim Profile" on employer → should route to /employer/register
Search "University of Nairobi" → institution result still works, click "Claim Profile" → routes to /institution/register?institution_id=...
Backend
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
# If backend has a build step, run it. Otherwise restart the server.
Test backend directly:
bash
curl "https://api.elimux.ke/api/employers?search=Safaricom"
Should return employer data.
STEP 4 — COMMIT & PUSH
Frontend
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git add src/lib/api.ts
git add src/app/join/page.tsx
git commit -m "Cycle 176-C-BD — Add employer public search to /join page"
git push origin main
Backend
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
git add src/routes/employers-public.ts
git add src/routes/index.ts
git add src/routes/institution-portal.ts
git commit -m "Cycle 176-C-BD — Add public employer search endpoint + institution domain auto-verification"
git push origin main
# Or deploy to Railway/Render as per your workflow
STEP 5 — LIVE VERIFICATION
https://www.elimux.ke/join → search "Safaricom" → employer result appears
https://www.elimux.ke/join → search "University of Nairobi" → institution result appears, claim routes correctly
Domain auto-verify: sign in with an email matching an institution's website_url domain → claim should be auto-approved (status: active in institution_accounts)
Domain mismatch: sign in with a Gmail/Yahoo email → claim should be pending as before
RULE
STOP after Step 3 (frontend build). Report build result before committing.
STOP after backend modification. Report if index.ts mount pattern doesn't match expectations.
STOP after live verification of Part D. Report auto-approve test result.