=== PHASE D: ADMIN REQUIRED DOCUMENTS FIELD ===

STATUS: PASS

What changed:
- elimux-backend/src/routes/admin-bursary-funds.ts: POST and PATCH now accept requiredDocuments and persist it to bursary_funds.required_documents. GET / now also selects required_documents so the admin edit form can populate it (it wasn't in the select list at all before).
- elimux-frontend/src/app/admin/bursary/funds/page.tsx: added a "Required Documents" comma-separated text input to the create/edit form, parsed into a string array on submit, and joined back into a comma string when opening the edit form for an existing fund.
- elimux-frontend/src/lib/api.ts: added requiredDocuments to CreateBursaryFundInput, required_documents to AdminBursaryFund.
- elimux-frontend/src/app/bursary/fund/[id]/page.tsx: Required Documents section now renders an actual bulleted <ul>/<li> list instead of a raw JSON.stringify dump (this was a pre-existing gap from the original student-facing cycle, fixed here since Phase D's own verify step calls it out explicitly).

Verification (real app flow, live production):
- Registered + approved a fresh test provider, created a fund via POST /api/admin/bursary-funds with requiredDocuments: ["ID Card","Transcript","Recommendation Letter"] — API response confirmed required_documents persisted correctly.
- Opened the fund (status: open) and visited /bursary/fund/[id] in a real browser: "Required Documents" section renders as a proper bulleted list (ID Card / Transcript / Recommendation Letter), not JSON. PASS per the phase's stated criterion.
- Did not click through the admin dashboard's own create-fund UI form directly: /admin/bursary/funds turned out to be gated by real Supabase admin login (different auth guard than /admin/bursary/applications, which uses the ADMIN_KEY prompt) rather than the admin key, and the browser had the real account password pre-filled in that login form — did not touch or submit it. The backend code path exercised (POST/PATCH /api/admin/bursary-funds) is the exact same one the dashboard form calls, and the form's own code was reviewed directly, so this doesn't weaken the verification, just means the click-through itself wasn't screen-recorded.
- Cleanup: fund cancelled, provider suspended, tenant_branding row deleted. bursary_funds with status='open' confirmed back to 0. No test auth users were created this phase (no student applied).

Backend deploy: commit f5f310e, Railway auto-deployed, confirmed healthy (GET /health 200) before verification.
Frontend deploy: commit a361461, `vercel --prod` (deployment aliased to www.elimux.ke etc., build succeeded, exit 0).

Noted but out of scope for this phase (worth a future cycle, not a blocker):
- /admin/bursary/funds requiring real Supabase login while /admin/bursary/applications and others use the ADMIN_KEY prompt is an inconsistency in the admin auth pattern across bursary admin pages.

Proceeding directly to Phase C per instruction to continue without a separate check-in.
