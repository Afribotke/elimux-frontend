=== PHASE C: STUDENT APPLICANT PROFILE ===

STATUS: PASS

What changed:
- elimux-backend/src/routes/bursary-public.ts: added GET /api/bursary/applicant/me (returns the current user's bursary_applicants profile, flattened, or {profile: null} if none exists) and PATCH /api/bursary/applicant/me (upserts personal_info/academic_info — updates if a row exists for the user, creates one with tenant_id: null / application_type: 'self' if not, matching /apply's own find-or-create convention on the same table).
- elimux-frontend/src/app/bursary/profile/page.tsx (new): form for Full Name, Email, Phone, Date of Birth, Institution, Course, Year of Study, GPA. Pre-fills from the existing profile (or the logged-in user's email if no profile yet). Supports a ?redirect= param — on save, if present and full name is set, redirects back there after a short confirmation delay.
- elimux-frontend/src/app/bursary/fund/[id]/page.tsx: now fetches the applicant profile alongside the auth check. If logged in but personal_info.full_name is missing, shows a "Complete your profile to apply" banner (linking to /bursary/profile?redirect=<fund url>) in place of the Apply button, instead of letting the request hit the backend and fail.
- elimux-frontend/src/app/admin/bursary/applications/[id]/page.tsx: Applicant card now also shows Institution and Course (previously only Email/Phone), pulled from applicant.academic_info which the backend's GET /:id already returned in full — no backend change needed there.

Verification (real app flow, live production):
- Registered+approved a fresh test provider, created+opened a fund via the real admin API.
- Created a test student, logged in via the real /auth/login page in a browser.
- Visited the fund detail page while logged in with no profile: confirmed the "Complete your profile to apply" banner rendered instead of the Apply button.
- Clicked through to /bursary/profile (redirect param correctly carried in the URL), filled in full name/phone/institution/course, saved — confirmed it auto-redirected back to the fund page.
- Confirmed the banner was gone and "Apply Now" was live; clicked it, got "Application submitted successfully!"
- Checked admin review: application list now shows "Test Student Phase C / test-student-phase-c@elimux.ke" instead of "Unnamed applicant". Detail page confirmed Email, Phone, Institution ("University of Nairobi"), and Course ("BSc Computer Science") all correct.
- Cleanup: fund cancelled, provider suspended, tenant_branding/bursary_applications/bursary_applicants rows deleted, test auth user deleted. One operational note: deleting the auth user failed with 500 on the first attempt because bursary_applicants.user_id still referenced it — had to delete the applicant/application rows first, then the auth user succeeded. Not an app bug, just the correct cleanup order (same as noted implicitly in the first E2E cycle, now confirmed explicitly).

Backend deploy: commit d14ebe0, Railway auto-deployed, confirmed healthy before verification.
Frontend deploy: commit afe6497, `vercel --prod`, build succeeded (exit 0), verified live.

Proceeding directly to Phase A (bookmarks), then Phase B (notifications), per instruction to chain all three without a separate check-in.
