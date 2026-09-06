=== CYCLE 053 — COMMIT APPLICATIONS PAGE + ADMIN INSTITUTIONS MANAGEMENT ===

## PART 1: COMMIT AND PUSH

```bash
git add src/app/admin/applications/page.tsx
git add src/components/admin/InstitutionApplicationDrawer.tsx
git add src/app/admin/layout.tsx
git commit -m "feat(admin): institution applications page with approve/reject

- /admin/applications list with search, filter, sort, pagination
- Bulk approve/reject via Promise.allSettled
- InstitutionApplicationDrawer for nested program applications
- Nav link added to admin sidebar
- Uses existing @/lib/api.ts endpoints (GET /api/admin/applications, POST approve/reject)"
git push origin main
Wait for Vercel deploy. Confirm via vercel ls that production alias points to the new deployment.
PART 2: YOUR LIVE VERIFICATION (hands-only)
On the deployed site with admin key:
Visit /admin/applications
Confirm table loads with real institution application data
Test status filter (All / Pending / Approved / Rejected)
Click Approve on a pending application — confirm toast, status badge changes to green
Click Reject on a pending application — confirm toast, status badge changes to red
Select 2 pending applications, click Bulk Approve — confirm both update
Click a row to open the drawer — confirm institution details + nested program applications render
Approve/reject a program application inside the drawer — confirm it works independently
Confirm no regression on /admin/users page
Report back: pass or fail with specifics.
PART 3: NEXT BUILD — ADMIN INSTITUTIONS MANAGEMENT
Once applications page is verified, the admin dashboard needs a page for managing already-approved institutions (not applications, but the live listings students see).
AUDIT OF CURRENT STATE
Built:
/admin/applications — handles institutions applying to join the platform
Institutions table exists in database
Programs table exists (linked to institutions)
Students browse institutions on the public site
Gap:
No /admin/institutions page
No way for admins to view, edit, or deactivate live institution listings
No visibility into which institutions have programs, which are active vs hidden
No bulk operations on institutions
WHAT CLAUDE MUST DO
Investigate first (same as last cycle):
Check @/lib/api.ts for existing institution-related admin functions
Check the real database schema for institutions and programs tables
Check if backend already has /api/admin/institutions endpoints
Check the real DataTable prop interface
Adapt the spec below to match whatever actually exists
New file: src/app/admin/institutions/page.tsx
Follow the exact same architecture as /admin/users and /admin/applications:
Client component with useAdminKey from @/components/admin/AdminKeyContext.tsx
Data fetched via existing @/lib/api functions (or new ones if needed)
DataTable for the list view
Drawer for detail view
Search, filter, sort, pagination
Table columns (adapt to real schema):
Institution name
Location (county/region)
Type (University, College, TVET, etc.)
Status (active, inactive, pending)
Program count
Created date
Actions (View, Edit, Deactivate/Activate)
Filters:
Search by name
Filter by type
Filter by status
Detail drawer: Show full institution info, contact details, list of programs, application stats, ability to edit basic fields.
Actions:
Single: View (opens drawer), Deactivate/Activate (toggles visibility on public site)
Bulk: Deactivate selected, Activate selected
New file: src/components/admin/InstitutionDetailDrawer.tsx
Follow the exact same pattern as InstitutionApplicationDrawer and UserDetailDrawer.
Modify: src/app/admin/layout.tsx
Add "Institutions" nav link in the Content section, next to "Applications", with the same active-state logic.
VERIFICATION CHECKLIST (Institutions Page)
After Claude builds this:
Build: npm run build — zero errors.
Type check: npx tsc --noEmit — clean.
Navigation: Confirm /admin/institutions link appears in sidebar.
Page load: Visit with admin key. Confirm:
[ ] Table loads with real institution data
[ ] Search by name works
[ ] Type filter works
[ ] Status filter works
Drawer: Click a row. Confirm:
[ ] Institution details render
[ ] Programs list renders
[ ] Contact info renders
Toggle status: Click Deactivate on an active institution. Confirm:
[ ] Toast shows success
[ ] Status badge changes
[ ] Institution disappears from public site (or is marked hidden)
Bulk action: Select 2 institutions, bulk deactivate. Confirm both update.
No regression: /admin/users and /admin/applications still work.
Do NOT commit or push until all 8 items are checked.