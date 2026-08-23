Cycle: Unify Bursary Admin Auth Pattern
Context: The bursary admin section has inconsistent authentication. /admin/bursary/funds requires real Supabase admin login, while /admin/bursary/applications, /admin/bursary-providers, and /admin/bursary/disbursements use the ADMIN_KEY prompt. This cycle audits both patterns, picks the one used by the rest of the admin dashboard, and unifies all bursary admin pages to it.
Step 1 — Audit current auth patterns
Read these files and report the exact auth mechanism used in each:
src/app/admin/layout.tsx — How does the admin layout gate access? Is it Supabase auth, ADMIN_KEY, or both? Show the first 40 lines of the auth logic.
src/app/admin/bursary/funds/page.tsx — How does this page authenticate? Show the first 30 lines of auth logic.
src/app/admin/bursary/applications/page.tsx — How does this page authenticate? Show the first 30 lines.
src/app/admin/bursary-providers/page.tsx — How does this page authenticate? Show the first 30 lines.
src/app/admin/bursary/disbursements/page.tsx — How does this page authenticate? Show the first 30 lines.
src/app/admin/page.tsx (the main admin dashboard) — How does this page authenticate? Show the first 30 lines.
elimux-backend/src/routes/admin-bursary-funds.ts — What middleware/auth check is applied? Show the first 20 lines.
elimux-backend/src/routes/admin-bursary-applications.ts — What middleware/auth check? Show the first 20 lines.
elimux-backend/src/routes/admin-bursary-providers.ts — What middleware/auth check? Show the first 20 lines.
elimux-backend/src/routes/admin-bursary-disbursements.ts — What middleware/auth check? Show the first 20 lines.
Report: For each file, state: Supabase auth (JWT from cookie/header), ADMIN_KEY (prompt or env key), Both, or None.
Step 2 — Pick the standard pattern
The admin dashboard should use one auth pattern for all bursary pages. Pick whichever pattern the majority of bursary admin pages already use, OR whichever pattern the main admin dashboard (/admin) uses if it differs from the bursary majority.
Report your decision: Which pattern is the standard? (Supabase auth or ADMIN_KEY)
Step 3 — Unify frontend admin pages
Update all bursary admin pages to use the chosen standard pattern.
If the standard is ADMIN_KEY:
Update src/app/admin/bursary/funds/page.tsx to use the same ADMIN_KEY prompt/gate as the other bursary admin pages.
Ensure the src/lib/api.ts admin functions for bursary funds include the ADMIN_KEY header in their fetch calls (check how listAdminBursaryApplications or approveBursaryProvider already do it, and match that).
If the standard is Supabase auth:
Update src/app/admin/bursary/applications/page.tsx, src/app/admin/bursary-providers/page.tsx, and src/app/admin/bursary/disbursements/page.tsx to use Supabase auth instead of ADMIN_KEY.
Update their src/lib/api.ts functions to pass the Supabase auth token instead of ADMIN_KEY.
Do not change the main admin dashboard or non-bursary admin pages. Only bursary admin pages.
Step 4 — Unify backend admin routes
Update all bursary admin backend routes to use the same auth middleware as the chosen standard.
If the standard is ADMIN_KEY:
Update elimux-backend/src/routes/admin-bursary-funds.ts to use the same adminAuth middleware as admin-bursary-applications.ts or admin-bursary-providers.ts. Show the exact middleware import and usage from the reference file.
If the standard is Supabase auth:
Update elimux-backend/src/routes/admin-bursary-applications.ts, admin-bursary-providers.ts, and admin-bursary-disbursements.ts to use Supabase JWT verification instead of ADMIN_KEY. Match the pattern from admin-bursary-funds.ts.
Step 5 — Verify consistency
After unifying, confirm:
All 4 bursary admin pages use the same auth mechanism
All 4 backend routes use the same auth middleware
The frontend API client functions send the same auth credential type for all bursary admin calls
Report: List each page and route with its auth mechanism after the change.
Step 6 — Build, deploy, verify
Backend: npm run build → fix errors → push → Railway deploy
Frontend: npm run build → fix errors → vercel --prod
Live verify:
Visit /admin/bursary/funds — confirm auth gate works (prompt or redirect)
Visit /admin/bursary/applications — confirm same auth gate behavior
Visit /admin/bursary-providers — confirm same auth gate behavior
Visit /admin/bursary/disbursements — confirm same auth gate behavior
Confirm data loads correctly after passing auth on all 4 pages
Report: PASS or FAIL for each page, with any errors encountered
Report format
plain
=== BURSARY ADMIN AUTH UNIFICATION ===

AUDIT:
- admin/layout.tsx: [auth pattern]
- admin/bursary/funds: [auth pattern]
- admin/bursary/applications: [auth pattern]
- admin/bursary-providers: [auth pattern]
- admin/bursary/disbursements: [auth pattern]
- admin/page.tsx (main dashboard): [auth pattern]

STANDARD CHOSEN: [Supabase auth / ADMIN_KEY]

CHANGES MADE:
- [file]: [what changed]
- ...

VERIFICATION:
- /admin/bursary/funds: [PASS / FAIL]
- /admin/bursary/applications: [PASS / FAIL]
- /admin/bursary-providers: [PASS / FAIL]
- /admin/bursary/disbursements: [PASS / FAIL]

OVERALL: [PASS / FAIL]
Do not proceed to any other feature until this cycle is verified complete.