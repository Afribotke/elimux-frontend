Cycle: Admin Eligibility Rules Form + Bursary Alert Cron
Context: Two independent features. (1) The admin create-fund form already sends eligibilityRules to the backend API, but there's no UI field for it — students see empty eligibility on detail pages. (2) The notification inbox and alert preferences are live, but no automated alerts generate. This cycle closes both gaps.
Phase 1: Admin Eligibility Rules Form
File: src/app/admin/bursary/funds/page.tsx (the admin fund create/edit form)
What to add: Eligibility rules fields to the existing create/edit form. The src/lib/api.ts function createAdminBursaryFund already accepts eligibilityRules in its payload, and the backend admin-bursary-funds.ts POST already maps it to eligibility_rules JSONB. You only need to add the UI inputs.
Form fields to add (below the existing requiredDocuments field):
Minimum Grade — text input, maps to eligibilityRules.minGrade
Fields of Study — multi-tag input or comma-separated text, maps to eligibilityRules.fields (array of strings)
Nationality — text input, maps to eligibilityRules.nationality
Maximum Age — number input, maps to eligibilityRules.maxAge
Additional Criteria — textarea, maps to eligibilityRules.additional (freeform text)
On form submit: Assemble these into an object and include as eligibilityRules in the createAdminBursaryFund / updateAdminBursaryFund call:
TypeScript
eligibilityRules: {
  minGrade: formData.minGrade || undefined,
  fields: formData.fields ? formData.fields.split(',').map(f => f.trim()).filter(Boolean) : [],
  nationality: formData.nationality || undefined,
  maxAge: formData.maxAge ? parseInt(formData.maxAge) : undefined,
  additional: formData.additional || undefined,
}
On edit load: Parse the existing eligibilityRules JSONB from the fund data and populate the form fields.
Verify: Create a test fund via admin dashboard, set eligibility rules. Visit /bursary/fund/[id] and confirm the eligibility section renders the structured data (not raw JSON). Report PASS/FAIL.
Phase 2: Bursary Alert Cron
New file: elimux-backend/src/routes/bursary-cron.ts
Create a new route with one endpoint:
TypeScript
// POST /api/bursary/cron/check-alerts
// Protected by X-Cron-Secret header matching CRON_SECRET env var
Endpoint logic:
1. Deadline Alerts
Query for open funds with deadlines in the next 7 days:
sql
SELECT id, name, tenant_id, application_window->>'deadline' as deadline
FROM bursary_funds
WHERE status = 'open'
  AND application_window->>'deadline' IS NOT NULL
  AND (application_window->>'deadline')::timestamptz > now()
  AND (application_window->>'deadline')::timestamptz <= now() + interval '7 days';
For each fund, find users to notify:
Users who bookmarked the fund: SELECT user_id FROM bursary_bookmarks WHERE fund_id = ?
Users who applied to the fund: SELECT ba.user_id FROM bursary_applications bapp JOIN bursary_applicants ba ON bapp.applicant_id = ba.id WHERE bapp.fund_id = ?
For each user, check deduplication before creating:
sql
SELECT 1 FROM bursary_notifications 
WHERE user_id = ? AND fund_id = ? AND type = 'deadline' AND created_at > now() - interval '7 days';
If no duplicate exists, insert:
sql
INSERT INTO bursary_notifications (user_id, type, title, message, fund_id, is_read, created_at)
VALUES (?, 'deadline', 'Application deadline approaching', 
        'The deadline for [Fund Name] is on [Date]. Apply now!', ?, false, now());
2. New Fund Alerts
Query for funds created in the last 24 hours:
sql
SELECT id, name, tenant_id, description, budget, eligibility_rules
FROM bursary_funds
WHERE status = 'open'
  AND created_at > now() - interval '1 day';
For each new fund, find users with new_match in their alert_types:
sql
SELECT user_id FROM bursary_alert_preferences 
WHERE alert_types @> ARRAY['new_match'];
For each user, check deduplication:
sql
SELECT 1 FROM bursary_notifications 
WHERE user_id = ? AND fund_id = ? AND type = 'new_match';
If no duplicate, insert:
sql
INSERT INTO bursary_notifications (user_id, type, title, message, fund_id, is_read, created_at)
VALUES (?, 'new_match', 'New bursary available', 
        '[Fund Name] is now open for applications. Check it out!', ?, false, now());
Auth protection
TypeScript
const cronSecret = req.headers['x-cron-secret'];
if (cronSecret !== process.env.CRON_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
Mount the route in elimux-backend/src/index.ts:
TypeScript
import bursaryCronRoutes from './routes/bursary-cron';
app.use('/api/bursary/cron', bursaryCronRoutes);
Add CRON_SECRET env var to Railway (any random string, e.g., elimux-cron-2026-secure). Report the value back.
Phase 2b: Manual trigger button in admin dashboard
File: src/app/admin/bursary/page.tsx (or create src/app/admin/bursary/cron/page.tsx)
Add a simple admin page with a "Run Alert Check" button. On click:
TypeScript
fetch(`${API_URL}/api/bursary/cron/check-alerts`, {
  method: 'POST',
  headers: { 'X-Cron-Secret': CRON_SECRET }
})
The CRON_SECRET can be hardcoded in the admin frontend for now (it's an admin-only page), or fetched from an env var if the build supports it. Use the same ADMIN_KEY pattern if needed — but since this is an admin page already behind the admin gate, a simple hardcoded secret or the existing admin auth is sufficient.
Verify: Click "Run Alert Check" with a seeded fund (deadline within 7 days). Confirm notifications are created in the database. Visit the notification bell on the student side, confirm the deadline alert appears. Report PASS/FAIL.
Phase 2c: Automated scheduling (optional but recommended)
Add a Vercel cron job to automate the daily run:
File: vercel.json (in frontend root, create if missing)
JSON
{
  "crons": [
    {
      "path": "/api/cron/bursary-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
File: src/app/api/cron/bursary-alerts/route.ts
TypeScript
import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bursary/cron/check-alerts`, {
    method: 'POST',
    headers: { 'X-Cron-Secret': process.env.CRON_SECRET! },
  });
  
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }
  
  const data = await res.json();
  return NextResponse.json(data);
}
Add CRON_SECRET to Vercel env vars as well.
If Vercel cron is not available on the current plan, skip this sub-phase and just use the manual trigger button.
Build, Deploy, Verify
Backend: npm run build → push → Railway deploy
Frontend: npm run build → vercel --prod
Add CRON_SECRET to Railway and Vercel env vars
Verify Phase 1: Create fund with eligibility rules via admin UI → confirm rendered on public detail page
Verify Phase 2: Seed a fund with deadline 3 days from now → click "Run Alert Check" → confirm notification appears in student's bell
Report: PASS/FAIL for each phase
Report format
plain
=== ELIGIBILITY FORM + ALERT CRON ===

PHASE 1 — ELIGIBILITY FORM:
- Admin form fields added: [list]
- Fund creation with rules: [PASS / FAIL]
- Public detail page rendering: [PASS / FAIL]

PHASE 2 — ALERT CRON:
- Backend endpoint built: [PASS / FAIL]
- Manual trigger button: [PASS / FAIL]
- Automated scheduling (Vercel cron): [PASS / FAIL / SKIPPED]
- Deadline alert generated: [PASS / FAIL]
- New fund alert generated: [PASS / FAIL]
- Notification appears in student bell: [PASS / FAIL]

ENV VARS SET:
- CRON_SECRET on Railway: [YES / NO]
- CRON_SECRET on Vercel: [YES / NO]

OVERALL: [PASS / FAIL]
Do not proceed to any other feature until this cycle is verified complete.