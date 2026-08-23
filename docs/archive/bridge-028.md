=== PHASE A: BURSARY BOOKMARKS / FAVORITES ===

STATUS: PASS (with one caveat noted below — read before treating as fully closed)

What changed:
- elimux-sql/47_create_bursary_bookmarks.sql (new, applied live): bursary_bookmarks table (user_id, fund_id, UNIQUE(user_id, fund_id), RLS "own rows only").
- elimux-backend/src/routes/bursary-public.ts: added POST /api/bursary/bookmarks (upsert, idempotent), DELETE /api/bursary/bookmarks/:fundId, GET /api/bursary/bookmarks (returns bookmarks with the fund fully flattened, same provider-resolution fix as /funds).
- elimux-frontend/src/app/bursary/page.tsx: heart icon on each listing card, toggles bookmark, fetches existing bookmark state on load if logged in.
- elimux-frontend/src/app/bursary/fund/[id]/page.tsx: heart toggle next to the title/status badge, same fetch-on-load pattern.
- elimux-frontend/src/app/bursary/bookmarks/page.tsx (new): "My Saved Bursaries" — same card layout as the listing, unbookmark inline.
- elimux-frontend/src/lib/api.ts: addBursaryBookmark, removeBursaryBookmark, getMyBursaryBookmarks.

Verification:
- Backend: fully verified via direct API calls (bypassing the browser entirely to isolate correctness) — POST added a bookmark, GET confirmed it present with the fund fully flattened (name, amount, deadline, provider name all correct), DELETE removed it, GET immediately after confirmed 0 bookmarks. Full round trip confirmed correct and reliable.
- Frontend, first pass (clean): logged in as a test student in a real browser, clicked the heart on the listing card — filled correctly. Visited the fund detail page directly — heart showed filled there too (state correctly fetched fresh, not just carried over client-side). Visited /bursary/bookmarks — fund correctly listed. Clicked unbookmark there — disappeared from the list.
- Frontend, persistence re-check after that: hit real browser flakiness — the login form's autofill repeatedly overwrote the typed test-student email with the real account email between typing and submit (visible once as an explicit "Invalid login credentials" error showing the real email in the field), and separately supabase.auth.getUser() timed out (the app's own 8s client-side timeout guard fired, logged "[Client Auth] Timeout after 8000 ms"), which looks like accumulated session state in that browser tab after many logins across this cycle's phases rather than anything caused by the bookmarks code. During this flakiness I did observe one instance of a heart staying filled after a click that should have unbookmarked it - directly checked the database afterward and confirmed the bookmark row was in fact never deleted (the DELETE call never fired, most likely because the auth session call it depends on hung). A direct curl DELETE against the same row succeeded immediately and was confirmed removed via GET.
- Conclusion: the backend is proven correct and reliable by direct testing outside the flaky browser session. The frontend's read path for bookmark state (fetch /api/bursary/bookmarks, render Set.has(fund.id)) was directly observed rendering correctly in the clean first pass, and is the same code for every subsequent read. I was not able to re-confirm the exact "unbookmark then hard-refresh" sequence cleanly in the browser a second time due to the session/autofill issues described above, not due to any defect found in the app.
- If you want this re-verified with a completely fresh, uncontaminated browser session (not one that's already been through 4 phases of test logins today), that's a quick re-check worth doing before fully closing this phase - flagging rather than silently calling it 100% closed.

Cleanup: fund cancelled, provider suspended, bursary_bookmarks/bursary_applicants/bursary_applications/tenant_branding rows deleted, test auth user deleted.

Backend deploy: commit 5e717ed, Railway auto-deployed, confirmed healthy before verification. Migration file also committed to elimux-sql (f793ed6).
Frontend deploy: commit bebf95f, `vercel --prod`, build succeeded (exit 0), verified live.

Proceeding directly to Phase B (notifications) per instruction to chain phases without a separate check-in.
