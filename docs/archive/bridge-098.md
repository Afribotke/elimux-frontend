Cycle: Fix /programs Page — Fetch Never Fires, Infinite Skeleton
Problem
/programs and /programs?category=... show skeleton cards indefinitely. No Supabase fetch is ever triggered. No console errors. The page is non-functional for all visitors.
Audit Steps (Report Findings Before Fixing)
Step 1: Read fetchPrograms() and Its Caller
powershell
Get-Content "src/app/programs/page.tsx"
Get-ChildItem -Recurse -Filter "*.ts" -Path "src" | Select-String -Pattern "fetchPrograms" | Select-Object -First 10
Read the file containing fetchPrograms(). Report:
What triggers it (useEffect, onMount, button click, URL param change)?
What are the useEffect dependencies?
Is there an early return that prevents the fetch from firing?
Is there a condition like if (!categoryId) return; that might be stuck true?
Step 2: Check for Hydration/Client-Side Blockers
Is the page wrapped in Suspense with a fallback that never resolves?
Is there a useSearchParams() or useRouter() call that throws in a non-browser context?
Is the component gated behind an auth check that fails silently for anon users?
Step 3: Compare with /institutions
/institutions works correctly (10,999 results, fast). Compare its data-fetch pattern with /programs:
How does /institutions trigger its fetch vs. how /programs does?
What dependency or condition differs between the two?
Step 4: Check for Silent JavaScript Errors
Even if the user sees no console errors, there may be an unhandled promise rejection or a try/catch that swallows the error. Look for:
.catch(() => {}) with empty handlers
try { ... } catch { /* nothing */ }
Any return inside a .then() that short-circuits the chain
Likely Causes (Hypotheses to Verify)
useEffect dependency array is wrong — fetchPrograms() is inside a useEffect with dependencies that never change after mount, or the effect is skipped because a dependency is undefined
Early return on missing category — if (!searchParams.get('category')) return; blocks the default unfiltered fetch
Auth context gate — The component waits for auth state that never resolves for anonymous users
Promise swallowed — The Supabase call is made but an empty .catch() hides a 400/401/403 error
Acceptance Criteria
[ ] /programs loads real program cards (not infinite skeleton)
[ ] /programs?category=... loads filtered results
[ ] Pagination works (Next/Previous buttons functional)
[ ] No console errors
[ ] Network tab shows Supabase requests firing
Do the audit first. Report the exact line and cause before applying any fix.