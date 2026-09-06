# BRIDGE 176-B — BUILD: Unified Public Search Portal (Institution + Employer + School)

**Cycle:** 176-B  
**Status:** BUILD AGAINST EXISTING INFRASTRUCTURE. NO NEW TABLES. NO PARALLEL SYSTEMS.

---

## WHAT THE AUDIT FOUND

Real, working infrastructure already exists:

| Flow | Page | Status |
|------|------|--------|
| **Apply as NEW institution** | `/institution-onboarding` | Live, public, works. Creates `institution_applications` row. |
| **Claim EXISTING institution** | `/institution/register` | Live, public, works. Creates `institution_accounts` row. **ZERO nav links anywhere — undiscoverable.** |
| **Employer system** | `/employer/register`, `/employer/activate` | Live, parallel, richer. |
| **Schools** | No self-service at all. `schools` table has 0 rows. | |

**The real gap:** No unified entry point where a registrar/HR head/headteacher types their name, sees if they're listed, and gets routed to claim or apply. The claim flow exists but is invisible.

---

## WHAT WE BUILD

A single public page: **`/join`** (or `/institutions/claim` — your call)

1. **Search by name** — queries existing `institutions`, `employers`, `schools` tables via existing `GET /api/institutions?search=...` endpoint
2. **Search by domain** — queries `website` column across all three tables
3. **Found → Route to claim** — link to existing `/institution/register?institution_id=X`, `/employer/register?employer_id=X`, or a new school registration flow
4. **Not Found → Route to apply** — link to existing `/institution-onboarding`, employer equivalent, or a new school application flow
5. **Nav link** — add "Join ElimuX" or "List Your Institution" to the footer (next to the existing "Are you an institution?" link) and potentially the main nav

**NO new tables. NO new backend routes. NO parallel claims system.** We use what's already built.

---

## STEP 1 — CREATE THE SEARCH PAGE

**File:** `src/app/join/page.tsx`  
**Action:** CREATE

```typescript
// === FILE: src/app/join/page.tsx ===
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, Building2, Briefcase, GraduationCap, ArrowRight, CheckCircle, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { listInstitutions } from '@/lib/api';

interface SearchResult {
  id: string;
  name: string;
  entityType: 'institution' | 'employer' | 'school';
  type?: string;
  industry?: string;
  level?: string;
  country?: string;
  county?: string;
  city?: string;
  sub_county?: string;
  website?: string;
  logo_url?: string;
}

export default function JoinPage() {
  const router = useRouter();
  const [searchBy, setSearchBy] = useState<'name' | 'domain'>('name');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  const performSearch = useCallback(async (searchQuery: string, by: 'name' | 'domain') => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      let allResults: SearchResult[] = [];

      if (by === 'name') {
        // Use existing listInstitutions API
        const institutions = await listInstitutions({ search: searchQuery, limit: 10 });
        allResults = [
          ...(institutions?.data || []).map((i: any) => ({ ...i, entityType: 'institution' as const })),
        ];
        // TODO: Also search employers and schools when those APIs support search
      } else {
        // Domain search — would need backend support or client-side filter
        // For now, fetch and filter client-side
        const institutions = await listInstitutions({ limit: 100 });
        const domain = searchQuery.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        allResults = (institutions?.data || [])
          .filter((i: any) => i.website?.toLowerCase().includes(domain))
          .map((i: any) => ({ ...i, entityType: 'institution' as const }))
          .slice(0, 10);
      }

      setResults(allResults);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery, searchBy);
  }, [debouncedQuery, searchBy, performSearch]);

  const normalizeDomain = (url?: string) => {
    if (!url) return '';
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getEntityIcon = (entity: SearchResult) => {
    if (entity.entityType === 'employer') return <Briefcase className="text-gray-400" size={20} />;
    if (entity.entityType === 'school') return <GraduationCap className="text-gray-400" size={20} />;
    return <Building2 className="text-gray-400" size={20} />;
  };

  const getClaimUrl = (entity: SearchResult) => {
    if (entity.entityType === 'institution') return `/institution/register?institution_id=${entity.id}`;
    if (entity.entityType === 'employer') return `/employer/register?employer_id=${entity.id}`;
    return '#'; // Schools not yet supported
  };

  const getApplyUrl = (type: string) => {
    if (type === 'institution') return '/institution-onboarding';
    if (type === 'employer') return '/employer/activate'; // or employer onboarding page
    return '#'; // Schools not yet supported
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join ElimuX</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Search to see if your institution, school, or company is already listed. Claim your profile or request to be onboarded.
          </p>
        </div>

        {/* Search Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => { setSearchBy('name'); setQuery(''); setResults([]); setHasSearched(false); }}
              className={`px-6 py-2 rounded-md flex items-center gap-2 transition-all ${
                searchBy === 'name' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 size={18} /> Search by Name
            </button>
            <button
              onClick={() => { setSearchBy('domain'); setQuery(''); setResults([]); setHasSearched(false); }}
              className={`px-6 py-2 rounded-md flex items-center gap-2 transition-all ${
                searchBy === 'domain' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe size={18} /> Search by Domain
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {searchBy === 'domain' ? <Globe size={20} /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchBy === 'domain'
                ? 'Enter your website domain (e.g., mku.ac.ke)'
                : 'Enter institution, school, or company name'
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="max-w-2xl mx-auto">
            {results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-400 mb-4">We found {results.length} matching {results.length === 1 ? 'result' : 'results'}:</p>
                {results.map((result) => (
                  <div
                    key={`${result.entityType}-${result.id}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start gap-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                      {result.logo_url ? (
                        <img src={result.logo_url} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        getEntityIcon(result)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{result.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {result.type || result.industry || result.level || 'Institution'} • {result.city ? `${result.city}, ` : ''}{result.country || ''}
                      </p>
                      {result.website && (
                        <p className="text-gray-500 text-sm mt-1">{normalizeDomain(result.website)}</p>
                      )}
                    </div>
                    <a
                      href={getClaimUrl(result)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shrink-0 transition-colors"
                    >
                      Claim Profile
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                <Search className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-400 mb-6">
                  We couldn't find any institution matching "{query}"
                </p>
                <div className="space-y-3">
                  <a
                    href={getApplyUrl('institution')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                  >
                    Apply as New Institution <ArrowRight size={18} />
                  </a>
                  <p className="text-gray-500 text-sm mt-4">
                    Are you an employer? <a href={getApplyUrl('employer')} className="text-orange-400 hover:text-orange-300">Register here</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        {hasSearched && results.length > 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <p className="text-gray-500 mb-4">Can't find what you're looking for?</p>
            <a href={getApplyUrl('institution')} className="text-orange-400 hover:text-orange-300 font-medium">
              Apply as a new institution →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
// === END FILE ===
STEP 2 — ADD NAV LINK
File: src/components/Footer.tsx
Action: MODIFY — Add "Join ElimuX" link next to existing "Are you an institution?" link
Locate the existing footer link:
tsx
"Are you an institution? List your programs on ElimuX" -> /institution-onboarding
Add immediately after it:
tsx
<a href="/join" className="text-orange-400 hover:text-orange-300">
  Already listed? Claim your profile
</a>
Or replace the existing link with:
tsx
<a href="/join" className="text-orange-400 hover:text-orange-300">
  Are you an institution, school, or employer? Join ElimuX
</a>
Your call: Keep both links or replace with the unified one?
STEP 3 — VERIFY EXISTING CLAIM FLOW WORKS
Before going live, test the existing claim flow:
Navigate to /institution/register?institution_id=<REAL_INSTITUTION_ID>
Sign in with Supabase Auth
Submit claim
Verify institution_accounts row created with status: 'pending'
Check /admin/institution-claims — claim appears for approval
If this flow is broken, fix it before the search page goes live (otherwise users find their institution but can't claim it).
STEP 4 — BUILD & TEST
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
If clean:
powershell
git add src/app/join/page.tsx
git add src/components/Footer.tsx
git commit -m "Cycle 176-B — Public search portal: /join page for institution/employer/school discovery and claim routing"
git push origin main
STEP 5 — LIVE VERIFICATION
https://www.elimux.ke/join → page renders
Type "University of Nairobi" → shows result with "Claim Profile" button
Click "Claim Profile" → routes to /institution/register?institution_id=X
Search for non-existent name → shows "Apply as New Institution" button
Footer shows "Join ElimuX" link
FUTURE ENHANCEMENTS (NOT THIS CYCLE)
Employer search — add listEmployers({ search }) API call when backend supports it
School search — add listSchools({ search }) API call when backend supports it
Domain search backend — add GET /api/institutions?domain=... for server-side domain filtering instead of client-side
Domain auto-verification — match claim email domain against institution website for instant approval (new feature, not in existing system)
EXECUTION ORDER
Step 1 — Create /join page
Step 2 — Add footer nav link (user decides: keep both or replace)
Step 3 — Verify existing claim flow works end-to-end
Step 4 — Build, commit, push
Step 5 — Live verification
STOP AND REPORT AFTER EACH STEP.