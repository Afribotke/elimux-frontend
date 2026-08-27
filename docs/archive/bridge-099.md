/programs infinite skeleton — AUDIT COMPLETE, 7 causes eliminated, 1 remains unconfirmed, NO FIX APPLIED
Status: Extensive, evidence-based elimination against both local dev and live production. Root cause narrowed to a very small surface but not pinned to an exact line with full certainty - the last confirming step would mean deploying temporary diagnostic logging to production, which I didn't do without asking first. Per this cycle's own instruction ("report the exact line and cause before applying any fix"), nothing has been changed in the codebase.
Archive Ref: docs/archive/bridge-098.md (snapshot of this cycle's spec, taken before this report replaced it).

IMPORTANT CORRECTION TO MY OWN LAST REPORT FIRST
My previous report (now archived) concluded production shows "0 of 0 programs" based on browser testing done earlier the same day. Re-investigating this cycle, I found that testing had a real flaw: this app's PWA service worker (public/sw.js, registered fresh on every page mount by ServiceWorkerRegister.tsx) was re-arming itself between my test navigations and cache-first-serving stale content, the same trap documented two reports ago. I re-ran every test this time with the service worker properly unregistered immediately before each single clean reload (not left to re-register across multiple navigations). The production symptom is still real after controlling for this - see below - but I want to flag that my earlier report's methodology was sloppier than it should have been, and I should have controlled for this from the start given I'd already documented the exact same gotcha once already.

STEP 1 — fetchPrograms() and its caller (src/app/programs/page.tsx)
Triggered by: `useEffect(() => { fetchPrograms() }, [fetchPrograms])` (line ~211), where fetchPrograms is a `useCallback(async () => {...}, [filters, page, institutionTypeIds])` (line ~157). This effect has no early return anywhere, and there is no `if (!categoryId) return` or any conditional guard in this file that could block it - checked the whole file line by line for this pattern, it doesn't exist.

STEP 2 — Hydration/client-side blockers
Ruled out with direct evidence, not inference:
- CompareProvider (wraps the whole tree): read it in full - a plain sessionStorage-backed context, no async gate, no auth check, nothing that could block child effects.
- Suspense fallback: exists (a spinner), wraps ProgramsPageInner because it calls useSearchParams() - standard, correct usage, not the infinite state itself (the skeleton grid is a separate loading state inside the already-mounted component, not the Suspense fallback).
- No useRouter() call anywhere in this file - it uses window.history.replaceState directly.
- No auth gate in this file or in CompareProvider.
- React IS hydrated and interactive in production right now: typing into the search box updates React state and the URL (?search=...) fires correctly, live-tested moments before writing this. So this isn't "the page never hydrates."

STEP 3 — Compare with /institutions
This comparison turned out to be invalid, and I want to flag that I made this exact mistake in my prior report too: /institutions's browsing list does NOT use client-side Supabase at all - InstitutionsBrowser.tsx calls listInstitutions() from src/lib/api.ts, which hits elimux-backend's REST API, not Supabase directly from the browser. Different data-fetching layer entirely, not a valid A/B comparison for "is client-side Supabase broken." Retracting that comparison from the last report.

STEP 4 — Silent errors
No .catch(() => {}) or empty try/catch anywhere in the fetch path. fetchPrograms uses `const { data, count, error } = await query.range(...)` with an explicit `if (error) console.error(...)` - not swallowed, would be visible if it ever ran.

WHAT I ACTUALLY TESTED, AND RULED OUT WITH HARD EVIDENCE
1. Service worker caching (see correction above) - ruled out. Same clean-reload procedure fixed local dev completely; production still shows the bug after the same procedure.
2. RLS - both programs and institutions have unrestricted "Allow public read" SELECT policies (qual: true). Checked directly against the live DB.
3. Anon key validity - extracted the real production anon key from the deployed bundle and called the exact filtered query directly via curl: HTTP 200, real data back. The key is valid and has correct permissions.
4. Network/CORS/CSP blocking - ran a raw fetch() to the Supabase REST endpoint directly from the live /programs page's own JS context (deliberately wrong key, to avoid touching real data): reached the server fine, got a clean 401 response. Nothing is blocking outbound requests to Supabase from this page.
5. React never hydrating - ruled out, see Step 2. Other effects on the same component (URL sync) fire correctly in production right now.
6. /institutions as a working comparison - invalid, see Step 3, retracted.
7. Local dev reproduces and then resolves - added temporary console.log calls at every stage (component render, both effects, before/after the Supabase await) directly in local source, confirmed via clean testing that ALL of them fire correctly locally and the query completes ("Discover 12,717 programs" - real data). This is the same code as what's committed/deployed (last touched by commit dd7a7f9, nothing since). Removed all temporary logging afterward - git status confirms src/app/programs/page.tsx is back to its committed state, nothing left behind.

WHAT'S LEFT, UNCONFIRMED
Local dev works. Production, tested cleanly (service worker properly cleared, single reload, confirmed via a forced filter change that other effects on the same component fire correctly), does not - fetchPrograms's triggering effect never results in a network call, in production only. Every environmental/permissions/caching explanation I could test remotely has been eliminated. What's left is something specific to how the production build executes this effect+useCallback pairing differently than dev - I was not able to pin the exact mechanism (a minification/tree-shaking edge case, a production-only React reconciliation difference, something else) without either production React DevTools access or deploying temporary diagnostic logging to confirm precisely, which I did not do without asking first, per this cycle's own "report before fixing" instruction and because it means changing what real visitors see, even briefly.

NEXT
- If you want me to go the last step (temporary console.log added to fetchPrograms and its effect, deployed, checked via Vercel's runtime logs or a live test, then immediately reverted), say so explicitly - it's the fastest remaining way to get full certainty, but it does mean a temporary prod deploy.
- Alternatively, if anyone has Vercel function/runtime log access or can run this locally with production `next build && next start` (not `next dev`) rather than a full deploy, that would confirm dev-vs-prod-build without touching the live site at all - I'd try that myself but don't have a way to serve a production build locally in this environment that I've verified works yet.
- This remains higher priority than the original perf question from the cycle before this one - /programs is still non-functional for real visitors right now, for any query.
