Cycle: Cross-Module State Audit — Scholarships, Internships, Attachments, Gamification, PWA
Context: These five modules were reportedly built in earlier cycles. Before any new work begins, audit exactly what exists, what is functional, what is empty, and what is broken. Report only — do not write code.
Step 1 — Database Audit
Run these queries against the live Supabase project and report exact results:
sql
-- 1. List all tables matching these modules
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%scholarship%' 
    OR table_name LIKE '%internship%' 
    OR table_name LIKE '%attachment%' 
    OR table_name LIKE '%gamification%' 
    OR table_name LIKE '%referral%')
ORDER BY table_name;

-- 2. Count rows in each
-- Run individually for each table found above:
SELECT 'table_name' as t, COUNT(*) as rows FROM table_name;

-- 3. Check for any PWA/service-worker related tables or config storage
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND (table_name LIKE '%cache%' OR table_name LIKE '%sync%' OR table_name LIKE '%offline%');

-- 4. Check for any tables related to reviews/ratings (often paired with discovery)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%review%';
Step 2 — Frontend File Audit
For each module below, check if the listed files exist. For each that exists, report: BUILT (functional) / EMPTY (placeholder/Coming Soon) / BROKEN (has code but known errors).
Scholarships:
src/app/scholarships/page.tsx (or /scholarship/)
src/app/scholarships/[id]/page.tsx (detail)
src/app/scholarships/apply/page.tsx (or similar application flow)
src/app/scholarships/my-applications/page.tsx
src/app/scholarships/saved/page.tsx (or favorites)
src/types/scholarship.ts
Internships:
src/app/internships/page.tsx (listing)
src/app/internships/[id]/page.tsx (detail)
src/app/internships/[id]/apply/page.tsx (application)
src/app/internships/my-applications/page.tsx
src/types/internship.ts
Attachments (University Attachment/Industrial Attachment):
src/app/attachments/page.tsx (or /attachment/)
src/app/attachments/[id]/page.tsx
src/app/attachments/apply/page.tsx
src/app/attachments/upload/page.tsx (university upload flow)
src/types/attachment.ts
Gamification:
src/app/achievements/page.tsx (or /gamification/)
src/app/leaderboard/page.tsx
src/components/gamification/ (any components)
src/types/gamification.ts
PWA / Offline:
public/sw.js or public/service-worker.js
src/app/manifest.ts or public/manifest.json
src/components/pwa/ (any PWA components)
next.config.js or next.config.ts — check for pwa or workbox config
src/lib/offline/ or src/lib/cache/ (any offline utilities)
Also check for shared infrastructure:
src/app/reviews/page.tsx or src/components/reviews/
src/app/ads/page.tsx or src/components/ads/ (sponsor ads)
src/app/partner/page.tsx (partner portal)
Step 3 — Backend API Audit
Check the backend for routes related to each module:
bash
grep -r "scholarship\|internship\|attachment\|gamification\|referral\|review\|ad\|partner" elimux-backend/src/routes/ --include="*.ts" -l
For each file found, report:
File path
Mount path in index.ts
Methods supported (GET/POST/PATCH/DELETE)
Whether it has auth middleware (adminAuth, JWT, or public)
Also check elimux-backend/src/index.ts for any mounted routes not covered above.
Step 4 — API Client Audit
Check src/lib/api.ts for exports related to each module:
bash
grep -n "scholarship\|internship\|attachment\|gamification\|referral\|review\|ad\|partner\|achievement\|leaderboard" src/lib/api.ts
For each function found, report:
Function name
Whether it calls the backend API (fetch to ${API_URL}) or Supabase directly
Step 5 — Live Verification
For each module with a public page, curl the live URL and report the HTTP status + first line of the HTML title:
bash
curl -s "https://www.elimux.ke/scholarships" | grep -o "<title>[^<]*" | head -1
curl -s "https://www.elimux.ke/internships" | grep -o "<title>[^<]*" | head -1
curl -s "https://www.elimux.ke/attachments" | grep -o "<title>[^<]*" | head -1
curl -s "https://www.elimux.ke/achievements" | grep -o "<title>[^<]*" | head -1
Also check:
bash
curl -sI "https://www.elimux.ke/sw.js" | head -1
curl -s "https://www.elimux.ke/manifest.json" | head -1
Step 6 — Report Format
Return findings in this exact format:
plain
=== CROSS-MODULE STATE AUDIT ===

SCHOLARSHIPS:
- Database tables: [list with row counts]
- Frontend pages: [list: BUILT / EMPTY / MISSING / BROKEN]
- Backend routes: [list with methods and auth]
- API client functions: [list]
- Live status: [200 / 404 / 500 / Coming Soon / etc.]
- Blockers: [any issues preventing real usage]

INTERNSHIPS:
- Database tables: [list with row counts]
- Frontend pages: [list: BUILT / EMPTY / MISSING / BROKEN]
- Backend routes: [list with methods and auth]
- API client functions: [list]
- Live status: [200 / 404 / 500 / Coming Soon / etc.]
- Blockers: [any issues]

ATTACHMENTS:
- Database tables: [list with row counts]
- Frontend pages: [list: BUILT / EMPTY / MISSING / BROKEN]
- Backend routes: [list with methods and auth]
- API client functions: [list]
- Live status: [200 / 404 / 500 / Coming Soon / etc.]
- Blockers: [any issues]

GAMIFICATION:
- Database tables: [list with row counts]
- Frontend pages: [list: BUILT / EMPTY / MISSING / BROKEN]
- Backend routes: [list with methods and auth]
- API client functions: [list]
- Live status: [200 / 404 / 500 / Coming Soon / etc.]
- Blockers: [any issues]

PWA / OFFLINE:
- Service worker: [EXISTS / MISSING — file path and live URL status]
- Manifest: [EXISTS / MISSING]
- Next.js PWA config: [YES / NO]
- Offline cache strategy: [describe or NONE]
- Push notifications: [YES / NO]
- Live status: [working / broken / not installed]

REVIEWS:
- Database tables: [list with row counts]
- Frontend components: [list]
- Backend routes: [list]
- Live status: [200 / 404 / etc.]

SPONSOR ADS / PARTNERS:
- Database tables: [list with row counts]
- Frontend pages/components: [list]
- Backend routes: [list]
- Live status: [200 / 404 / etc.]

OVERALL SUMMARY:
- Modules fully functional: [list]
- Modules with placeholders only: [list]
- Modules completely missing: [list]
- Modules with known bugs/blockers: [list]
- Recommended next priority: [single highest-impact module to fix or complete]
Do not write any code. Do not create files. Audit and report only.