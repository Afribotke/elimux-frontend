Cycle: Fix Bursary Provider Registration 404
Context: https://bursary.elimux.ke/bursary/provider/register/ returns 404. This is the page real providers use to register. Must be fixed before any recruitment can happen.
Step 1 — Diagnose the 404
Check these immediately and report back:
Does the file exist in the repo?
bash
ls -la src/app/bursary/provider/register/page.tsx
Report: exists or missing. If exists, show first 20 lines.
Is it in the latest deployed build?
Check the Vercel deployment output from the last deploy — did src/app/bursary/provider/register/page.tsx appear in the build trace (pages compiled)?
What does the Vercel function log show?
Check Vercel logs for bursary/provider/register — any build-time or runtime errors?
Is the path correct for the subdomain?
The URL is bursary.elimux.ke/bursary/provider/register/. Is bursary.elimux.ke meant to serve the bursary section at root (so the path should be /provider/register/)? Or is the full path /bursary/provider/register/ correct?
Check next.config.js or vercel.json for any subdomain rewrites or path mappings.
Does it 404 on the main domain too?
Test: https://www.elimux.ke/bursary/provider/register/ — same 404 or does it work?
Check the build output directory
bash
ls -la .next/server/app/bursary/provider/register/
Does the compiled page exist locally after build?
Step 2 — Identify the root cause
Report the exact cause:
Missing file — file doesn't exist in repo
Build exclusion — file exists but wasn't compiled into the build
Path mismatch — wrong URL path for the subdomain/domain
Runtime error — file exists but crashes on render, causing Next.js to fall back to 404
Rewrite/middleware blocking — middleware or config intercepts the route
Step 3 — Fix and deploy
Based on the root cause:
If missing file: Create src/app/bursary/provider/register/page.tsx using the existing provider registration code from the local working tree (Claude has it from earlier cycles).
If build exclusion: Check why the file is excluded (TypeScript error? Wrong file extension? In .vercelignore?). Fix and rebuild.
If path mismatch: Update the URL the user should use, or add a rewrite rule in next.config.js or vercel.json.
If runtime error: Fix the crash (likely a missing import or undefined variable), rebuild.
If middleware blocking: Check src/middleware.ts — does it block /bursary/provider/register for some reason? Adjust the matcher.
Step 4 — Verify live
After deploy, confirm in browser:
https://www.elimux.ke/bursary/provider/register/ loads the registration form
https://bursary.elimux.ke/bursary/provider/register/ also loads (or redirects to the correct URL)
The form submits successfully
Report: PASS or FAIL with exact error.
Report format
plain
=== BURSARY PROVIDER REGISTRATION 404 FIX ===

DIAGNOSIS:
- File exists in repo: [YES / NO]
- Compiled in build: [YES / NO]
- Path on www.elimux.ke: [200 / 404 / other]
- Path on bursary.elimux.ke: [200 / 404 / other]
- Root cause: [missing file / build exclusion / path mismatch / runtime error / middleware / other]

FIX APPLIED:
- [exact change made]

VERIFICATION:
- www.elimux.ke/bursary/provider/register: [PASS / FAIL]
- bursary.elimux.ke/bursary/provider/register: [PASS / FAIL]
- Form submission: [PASS / FAIL]

STATUS: [FIXED / BLOCKED]
This is a live production blocker. Fix and verify before any other work