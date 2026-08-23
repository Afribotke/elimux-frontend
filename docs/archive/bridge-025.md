Cycle: Bursary Enhancement Suite — Phases A through D
Context: Student-facing discovery, apply, and tracking are live and verified. Admin CRUD is live. Next: close four gaps in order of dependency.
Execution order: Phase D → Phase C → Phase A → Phase B. Verify each phase before proceeding to the next. Report back after each phase.
Phase D: Admin Required Documents Field
Problem: The admin create-fund form doesn't expose required_documents, so every fund has an empty array. The detail page hides the section because there's nothing to show.
File: src/app/admin/bursary/funds/page.tsx (or wherever the admin create/edit fund form lives)
Add a requiredDocuments field to the create-fund form. Use a multi-tag input or comma-separated text field that parses into a string array.
Ensure the createAdminBursaryFund API call in src/lib/api.ts passes requiredDocuments in the POST body.
Verify elimux-backend/src/routes/admin-bursary-funds.ts POST handler maps requiredDocuments into required_documents JSONB (array of strings).
If the backend handler doesn't already map this field, add it: required_documents: req.body.requiredDocuments || [].
Verify: Create a new test fund via admin dashboard, set required documents to ["ID Card", "Transcript", "Recommendation Letter"]. Visit /bursary/fund/[id] and confirm the Required Documents section renders the list (not raw JSON). Report PASS/FAIL.
Phase C: Student Applicant Profile
Problem: /api/bursary/apply auto-creates a bare bursary_applicants row with empty personal_info, academic_info, etc. Admin review shows "—" for email/phone. Students need a profile form before applying.
New page: src/app/bursary/profile/page.tsx
Create a student profile page at /bursary/profile.
Fetch existing applicant profile via GET /api/bursary/applicant/me (new endpoint — see below).
Form fields:
Full Name (personal_info.full_name)
Email (personal_info.email)
Phone (personal_info.phone)
Date of Birth (personal_info.date_of_birth)
Institution (academic_info.institution)
Course/Degree (academic_info.course)
Year of Study (academic_info.year_of_study)
GPA/Grade (academic_info.gpa)
On submit, call PATCH /api/bursary/applicant/me with the JSONB updates.
If no profile exists, the backend should create one (upsert behavior).
New backend endpoints: elimux-backend/src/routes/bursary-public.ts
Add these routes:
TypeScript
// GET /api/bursary/applicant/me — Get or create applicant profile for current user
router.get('/applicant/me', async (req: Request, res: Response) => {
  // Verify JWT
  // Look up bursary_applicants by user_id
  // If exists, return flattened profile
  // If not exists, return null (frontend will show empty form)
});

// PATCH /api/bursary/applicant/me — Update or create applicant profile
router.patch('/applicant/me', async (req: Request, res: Response) => {
  // Verify JWT
  // Look up bursary_applicants by user_id
  // If exists: update personal_info, academic_info, etc.
  // If not exists: create new row with user_id, tenant_id = null (or pick a default), application_type = 'self', and the provided info
  // Return updated profile
});
Update apply flow: Before allowing application on /bursary/fund/[id], check if the student has a completed profile. If personal_info.full_name is missing, show a banner: "Complete your profile to apply" with a link to /bursary/profile.
Verify:
Visit /bursary/profile as a logged-in student, fill and save.
Visit /bursary/fund/[id], confirm no "complete profile" banner.
Click Apply, confirm success.
In admin review, confirm applicant name/email/phone/institution are visible. Report PASS/FAIL.
Phase A: Bursary Bookmarks / Favorites
Problem: No way for students to save bursaries to a list for later.
New table: Add to elimux-sql/45_create_bursary_engine_phase1.sql (or create a new migration file):
sql
CREATE TABLE IF NOT EXISTS bursary_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id uuid NOT NULL REFERENCES bursary_funds(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, fund_id)
);
Run this migration against the live database.
New backend endpoints: Add to elimux-backend/src/routes/bursary-public.ts:
TypeScript
// POST /api/bursary/bookmarks — Add bookmark
// DELETE /api/bursary/bookmarks/:fundId — Remove bookmark
// GET /api/bursary/bookmarks — List current user's bookmarks
Each endpoint verifies JWT, operates on bursary_bookmarks table.
Frontend updates:
Listing page (/bursary): Add a bookmark icon (heart/star) to each fund card. Toggle on click. Call POST /api/bursary/bookmarks or DELETE /api/bursary/bookmarks/:fundId.
Detail page (/bursary/fund/[id]): Add a bookmark toggle button next to "Apply Now".
New page: src/app/bursary/bookmarks/page.tsx — "My Saved Bursaries". Lists all bookmarked funds with the same card layout as the main listing. Unbookmark from here.
API client: Add to src/lib/api.ts:
addBursaryBookmark(fundId)
removeBursaryBookmark(fundId)
getMyBursaryBookmarks()
Verify:
Bookmark a fund from listing and detail pages.
Visit /bursary/bookmarks, confirm it appears.
Unbookmark from bookmarks page, confirm it disappears.
Refresh page, confirm persistence. Report PASS/FAIL.
Phase B: Bursary Notifications
Problem: No alerts for deadlines or new matching bursaries.
New table: Add to schema (or new migration):
sql
CREATE TABLE IF NOT EXISTS bursary_alert_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_types text[] DEFAULT ARRAY['deadline', 'new_match'],
  field_of_study text,
  min_amount int,
  max_amount int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS bursary_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'deadline', 'new_match', 'status_update'
  title text NOT NULL,
  message text NOT NULL,
  fund_id uuid REFERENCES bursary_funds(id) ON DELETE SET NULL,
  application_id uuid REFERENCES bursary_applications(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
Run migration against live database.
New backend endpoints: Add to bursary-public.ts:
TypeScript
// GET /api/bursary/notifications — List current user's notifications
// PATCH /api/bursary/notifications/:id/read — Mark as read
// GET /api/bursary/alert-preferences — Get preferences
// PATCH /api/bursary/alert-preferences — Update preferences
Notification generation logic: For now, implement a simple trigger in the POST /api/bursary/apply handler:
After successful application, insert a notification: "Application submitted for [Fund Name]"
For deadline alerts, we'll need a cron job or edge function later. For this cycle, just build the notification inbox and the "application submitted" trigger.
Frontend:
Notification bell in the site header (next to the user avatar). Shows unread count badge.
Dropdown/panel: Click bell to see recent notifications. Click to mark as read. Link to fund or application detail.
New page: src/app/bursary/notifications/page.tsx — full notification history with read/unread filter.
Alert preferences: Add a section to /bursary/profile for alert settings (deadline reminders, new match alerts, field of study filter, amount range).
API client: Add to src/lib/api.ts:
getBursaryNotifications()
markBursaryNotificationRead(id)
getBursaryAlertPreferences()
updateBursaryAlertPreferences(prefs)
Verify:
Apply to a bursary, confirm a notification appears in the bell dropdown.
Visit /bursary/notifications, confirm it appears in the list.
Mark as read, confirm unread count drops.
Set alert preferences in profile, confirm they save and persist on refresh. Report PASS/FAIL.
Build & Deploy Per Phase
After each phase:
Backend: npm run build → push → Railway deploy
Frontend: npm run build → vercel --prod
Verify live on production URLs
Report PASS/FAIL for that phase before proceeding
Do not proceed to the next phase until the current one is verified. If any phase fails, fix it before continuing.
Start with Phase D now. Report back when Phase D is complete.