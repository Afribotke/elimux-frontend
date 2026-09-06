AD-HOC AUDIT — Institution dashboard/API/schema footprint

Archived: previous content (Cycle 176-C-BD's report) is `docs/archive/bridge-176cbd-report.md`.

Five direct diagnostic commands run against the real `elimux-frontend` working tree, results below.

1. INSTITUTION DASHBOARD ROUTES
`grep -r "institution/dashboard\|institution/admin\|institution/portal" src/app/ --include="*.tsx" --include="*.ts"`
Real, live routes exist:
- `src/app/institution/dashboard/page.tsx` - main dashboard.
- `src/app/institution/dashboard/alerts/page.tsx`, `src/app/institution/dashboard/analytics/page.tsx` -
  sub-pages.
- Linked from two places: `src/app/dashboard/page.tsx` (general student dashboard, an "Institution
  Portal" button -> `/institution/dashboard`) and `src/app/institution/login/page.tsx`
  (`router.push('/institution/dashboard')` after successful sign-in).

2. INSTITUTION-PROTECTED API ROUTES (excluding register/login/search)
`grep -r "institution" src/app/api/ --include="*.ts" | grep -v "register\|login\|search"`
Two found:
- `src/app/api/institution/alerts/route.ts` + `src/app/api/institution/alerts/[id]/read/route.ts` -
  trending alerts scoped to the signed-in institution's own `institution_id` (queries `institutions`
  table to resolve which institution the caller owns, then filters alerts by that id).
- `src/app/api/institutions/attachment/upload/route.ts` - role-gated
  (`institution_admin`/`institution_owner`/`admin`/`super_admin`) student-attachment upload endpoint.

3. PROGRAMS/COURSES IN MIGRATION FILES
`grep -r "programs\|courses" supabase/migrations/ --include="*.sql"`
No matches. The directory itself is real (5 files: `20260829000001_pathways_schema.sql`,
`20260829000002_pathways_rls_fix.sql`, `20260830000001_school_discovery_schema.sql`,
`999_dtb_academy_demo.sql`, `999a_dtb_academy_app_config_rls_fix.sql`) but none of them touch a
`programs`/`courses` table - that table predates this migrations-file convention entirely and was
never captured as a file here, consistent with this project's established manual-paste-into-
Supabase-Dashboard SQL workflow (most real schema history isn't in this folder).

4. EVERYTHING UNDER src/app/institution/
```
attachment/
dashboard/          (+ alerts/, analytics/)
login/
register/
page.tsx            -> redirect("/institution/login")
```
The root `page.tsx` (129 bytes) just redirects to `/institution/login` - not previously read this
session, flagging its existence in case it's relevant to whatever this audit is for.

5. ADMIN/DASHBOARD FILES MATCHING "institution"
`find src/app -name "*admin*" -o -name "*dashboard*" | grep -i institution`
Only the `institution/dashboard/` directory itself matches. No separate, dedicated admin-layout
file exists specifically for institutions (unlike, say, the general `/admin` section, which has
its own layout/sidebar components).
