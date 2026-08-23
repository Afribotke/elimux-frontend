# BRIDGE: Cycle 026 — Local Build Continuation (No Commit Until Approved)
**Status:** EXECUTE — no questions, no options  
**Rule:** After every change, run `npx tsc --noEmit && npm run build`. Fix errors before proceeding.  
**Rule:** Do NOT run `git add`, `git commit`, or `git push` at any point. Wait for explicit "commit and push it".

---

## CONTEXT FROM CYCLE 025

Cycle 025 changes are sitting uncommitted in the working tree:
- Homepage copy fix (Skolex headline)
- 3 tabs removed from homepage, replaced with stacked sections
- UnifiedNavBar (6 pills) mounted globally
- /internships middleware redirect removed, dedicated page filters correctly
- DesktopNav cleaned up (Opportunities and Bursary links removed)
- Pre-existing bug fixes (duplicate Analytics import, crypto.randomUUID crash)

Nothing committed. Local preview running at localhost:3000.

---

## CYCLE 026 SCOPE — EXECUTE IN ORDER

### STEP 1: Employer Vacancy Form — Add Attachment Type Selector

**File:** `src/app/employer/(portal)/vacancies/new/page.tsx` (or wherever the employer "Post Vacancy" form lives)

**Problem:** The form is hardcoded to `type: internship`. Employers cannot create attachment listings, which is why `/attachments` shows 0 results.

**Fix:**
1. Add a type selector to the form (radio buttons or dropdown):
   - Option 1: "Internship" (default)
   - Option 2: "Attachment"
2. The selected type must be sent to the API and stored in the `internships` table's `type` column.
3. The form's existing validation, submission, and success flow must remain intact.
4. If the `type` column doesn't exist in the form's current submission payload, add it.

**Verification:**
- Build passes clean.
- Preview the form at `/employer/vacancies/new` (or the correct route).
- Confirm the type selector is visible and functional.
- Submit a test vacancy as "Attachment" type.
- Check the database (or the `/attachments` page) to confirm the new listing appears.

---

### STEP 2: Mobile Nav Cleanup

**File:** `src/components/MobileNav.tsx` (or wherever the bottom mobile nav bar is defined)

**Problem:** The bottom mobile nav still has a "Jobs" tab linking to `/opportunities`, which is now redundant with the UnifiedNavBar.

**Fix:**
- Remove the "Jobs" tab from the mobile bottom nav.
- Keep all other tabs unchanged.

**Verification:**
- Build passes clean.
- Open the site on a mobile viewport (or narrow browser window).
- Confirm the bottom nav no longer shows "Jobs".
- Confirm other tabs (Home, Search, Programs, etc.) still work.

---

### STEP 3: Investigate `/api/opportunities` 500 Error

**Task:**
1. Check the API route file for `/api/opportunities` (likely `src/app/api/opportunities/route.ts` or similar).
2. Identify why it's returning HTTP 500.
3. Check server logs, error boundaries, or add temporary logging to trace the exact error.
4. Fix the root cause.

**Common causes to check:**
- Missing database table or column
- Unhandled null/undefined in response processing
- Missing environment variable
- Type mismatch in query parameters

**Verification:**
- `curl -I http://localhost:3000/api/opportunities` returns 200, not 500.
- The response body contains valid JSON.

---

### STEP 4: Admin Approvals Queue Page

**File:** Create `src/app/admin/approvals/page.tsx`

**Problem:** `/admin/approvals` does not exist. Admins have no queue to review university-uploaded student eligibility batches.

**Requirements:**
1. Table view of pending approvals:
   - Columns: University name, Batch ID, Number of students, Upload date, Status (Pending / Approved / Rejected), Actions (Approve / Reject / View)
2. Filter by status (Pending / Approved / Rejected / All).
3. Pagination.
4. Approve/Reject actions update the database and move the item to the appropriate status.
5. Use existing admin layout (`src/app/admin/layout.tsx`) — do not create a new layout.

**Data model assumption:** There is likely a table for university student batch uploads. Check the existing Supabase schema or backend API to find the correct table name and columns. If unsure, query the database for tables related to `university`, `student`, `batch`, or `eligibility`.

**If the backend API doesn't exist yet:**
- Build the frontend page with mock data.
- Flag which API endpoints are needed.
- Do NOT block on backend — frontend first, API integration later.

**Verification:**
- Build passes clean.
- Page loads at `/admin/approvals`.
- Table renders with correct columns.
- Filters and pagination work (even if on mock data).

---

### STEP 5: Final Verification

After all steps:
1. `npx tsc --noEmit` — must be clean.
2. `npm run build` — must be clean.
3. `npx next start` — restart the preview server.
4. Manual check:
   - Homepage loads with correct headline and stacked sections.
   - UnifiedNavBar shows all 6 pills, navigates correctly.
   - /internships shows only internships.
   - /attachments shows attachments (after posting a test vacancy).
   - Employer vacancy form has type selector.
   - Mobile nav has no "Jobs" tab.
   - /api/opportunities returns 200.
   - /admin/approvals renders the approvals table.

---

## WHAT NOT TO DO

- Do NOT commit or push at any point.
- Do NOT modify production database schema without explicit instruction.
- Do NOT delete Cycle 025 changes — they stay in the working tree.
- Do NOT ask the user questions — make reasonable engineering decisions and document them in code comments.

---

## REPORTING FORMAT

After each step, report:
- Step number and name
- Files changed
- tsc result
- build result
- Any blockers or flags

After Step 5, report: "Cycle 026 complete. All steps verified. Awaiting 'commit and push it' or further instructions."