# CYCLE 177 — Institution Dashboard Audit + Program Manager
# File: docs/bridge.md

## PART 0 — MANDATORY AUDIT (Do NOT skip. Do NOT build until audit report is complete.)

### Step 0.1: Read all institution dashboard files
Read every file under `src/app/institution/dashboard/` and report back EXACTLY what each file contains:

1. `src/app/institution/dashboard/page.tsx` — What's on the main dashboard? List every component, every data fetch, every UI element.
2. `src/app/institution/dashboard/alerts/page.tsx` — How do alerts work? What data is fetched? What's the UI?
3. `src/app/institution/dashboard/analytics/page.tsx` — What's on this page? Real data or placeholder?
4. Any layout file that wraps these pages (check `src/app/institution/dashboard/layout.tsx`, or if there's a shared sidebar/nav component imported from elsewhere, identify it).
5. `src/app/institution/login/page.tsx` — How does login redirect to dashboard? What auth check happens?

### Step 0.2: Read the institution-scoped API routes
Read and report:
1. `src/app/api/institution/alerts/route.ts` — Full logic, auth check, query pattern.
2. `src/app/api/institution/alerts/[id]/read/route.ts` — Same.
3. `src/app/api/institutions/attachment/upload/route.ts` — Same.
4. Any middleware or auth helper that gates institution routes (look for `institution_admin`, `institution_owner`, `requireUser`, etc.).

### Step 0.3: Check the database schema
Run these SQL queries in Supabase SQL Editor and paste results:
```sql
-- What columns does institutions table have?
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'institutions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- What columns does institution_accounts table have?
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'institution_accounts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Does a programs/courses table exist?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%program%' OR table_name ILIKE '%course%');

-- What are the RLS policies on institutions and institution_accounts?
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('institutions', 'institution_accounts')
ORDER BY tablename, policyname;
Step 0.4: Check existing nav/sidebar
Find and report the exact nav items/links that currently appear in the institution dashboard. If it's a shared component, read that component file and list every nav item.
AUDIT REPORT FORMAT (Copy this template and fill it in)
Markdown
Copy
Code
Preview
## AUDIT REPORT — Institution Dashboard

### Dashboard Structure
- Main dashboard (`/institution/dashboard`): [DESCRIBE EVERYTHING HERE]
- Alerts page: [DESCRIBE]
- Analytics page: [DESCRIBE]
- Layout/Sidebar: [DESCRIBE — list every nav item]

### API Routes
- Alerts API: [DESCRIBE auth, queries, response shape]
- Attachment upload API: [DESCRIBE]
- Auth middleware/helpers: [DESCRIBE]

### Database Schema
- `institutions` table columns: [PASTE SQL RESULTS]
- `institution_accounts` table columns: [PASTE SQL RESULTS]
- Programs/courses table exists? [YES/NO — if yes, paste columns]
- RLS policies: [PASTE]

### What's Missing (gap analysis)
- [List what an institution admin CANNOT currently do]
STOP HERE
Do NOT proceed to Part 1 (Program Manager build) until:
The audit report above is COMPLETELY filled in.
You confirm npm run build passes with zero errors after any read-only operations.
User reviews the audit report and says "proceed."
MANDATORY LOCAL BUILD VERIFICATION
After completing the audit (which is read-only), run:
bash
npm run build
Confirm exit code 0 before doing anything else. If build fails, fix it before reporting.