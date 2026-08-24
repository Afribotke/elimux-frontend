AUDIT — DID CYCLES 025-028 AFFECT THE BACKEND? (read-only, no changes)

Check the current working tree (uncommitted changes on top of commit 63a3258) and report:

=== 1. API ROUTES TOUCHED ===
List every file in src/app/api/ that has uncommitted changes.
For each, report:
- What changed?
- Does it affect request/response format?
- Does it add, remove, or modify endpoints?

=== 2. DATABASE QUERIES CHANGED ===
List every file that issues Supabase/Prisma/raw SQL queries with uncommitted changes.
For each, report:
- Which table/collection is queried?
- Was the query logic modified (WHERE clauses, joins, aggregations)?
- Were any new columns referenced?
- Could this break existing data?

=== 3. MIDDLEWARE CHANGES ===
Report any changes to:
- middleware.ts
- Any auth guards or session handling
- Any redirect rules

=== 4. ENVIRONMENT VARIABLES ===
- Were any .env files modified?
- Were any Vercel env vars added, removed, or changed?
- Was SUPABASE_SERVICE_ROLE_KEY added to .env.local only (safe) or anywhere else?

=== 5. SUPABASE SCHEMA ===
- Were any SQL migration files created or modified in this cycle?
- Were any tables, columns, indexes, or RLS policies changed?
- Were any functions or triggers modified?

=== 6. EXTERNAL INTEGRATIONS ===
- Any changes to Paystack, M-Pesa, Stripe, or other payment APIs?
- Any changes to email/SMS sending?
- Any changes to third-party webhooks?

=== SUMMARY ===
Report in one sentence: "The backend was NOT touched" OR "The backend was affected in the following ways: [list]"

Be specific. Do not guess. Check actual file diffs.