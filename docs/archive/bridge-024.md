Cycle: Bursary End-to-End Verification & Seed Data
Context: The student-facing bursary discovery, detail, apply, and tracking pages are now live. All bursary tables are empty (0 rows). The admin bursary CRUD is also now live in production for the first time. This cycle creates minimal seed data and walks the full end-to-end flow to prove it works.
Pre-flight: Before writing any seed scripts, read elimux-sql/45_create_bursary_engine_phase1.sql and confirm the exact column names and JSONB shapes for tenants, tenant_branding, user_tenant_roles, bursary_funds, and bursary_applicants. Report the first 5 lines of each table's CREATE TABLE statement.
Step 1 — Seed a test provider (tenant)
Use the Supabase SQL editor or psql against the live database. Run this insert (adapt column names if they differ from the schema):
sql
-- Insert test provider tenant
INSERT INTO tenants (name, slug, type, status, created_at, updated_at)
VALUES ('Test Bursary Foundation', 'test-bursary-foundation', 'provider', 'active', now(), now())
RETURNING id;

-- Note the returned tenant_id, use it in the next steps
Then insert branding:
sql
INSERT INTO tenant_branding (tenant_id, logo_url, primary_color, created_at, updated_at)
VALUES ('<tenant_id_from_above>', 'https://placehold.co/100x100?text=TBF', '#2563eb', now(), now());
Then insert a user-tenant role for yourself (your auth user ID) as admin of this tenant:
sql
INSERT INTO user_tenant_roles (user_id, tenant_id, role, created_at)
VALUES ('<your_auth_user_id>', '<tenant_id_from_above>', 'admin', now());
Step 2 — Seed a test bursary fund
Use the admin dashboard at https://www.elimux.ke/admin/bursary/funds to create an open fund for the test provider, OR insert directly:
sql
INSERT INTO bursary_funds (
  tenant_id, provider_id, name, description, status, fund_type,
  budget, eligibility_rules, required_documents, application_window,
  created_at, updated_at
) VALUES (
  '<tenant_id>',
  '<tenant_id>', -- provider_id same as tenant_id for this test
  'Test STEM Bursary 2026',
  'A test bursary for students pursuing science, technology, engineering, and mathematics degrees. This is seed data for end-to-end verification.',
  'open',
  'open',
  '{"total": 500000, "currency": "KES", "committed": 0, "disbursed": 0}',
  '{"min_grade": "B+", "fields": ["STEM", "Computer Science", "Engineering"], "nationality": "Kenyan", "max_age": 25}',
  '["ID Card", "Transcript", "Recommendation Letter", "Proof of Income"]',
  '{"opens_at": "2026-01-01T00:00:00Z", "deadline": "2026-12-31T23:59:59Z"}',
  now(), now()
)
RETURNING id;
Note the returned fund_id.
Step 3 — Create a test student applicant profile
Log in as a test student user (or use your own auth account) and create a bursary_applicants row:
sql
INSERT INTO bursary_applicants (
  user_id, tenant_id, application_type, personal_info, academic_info,
  application_status, created_at, updated_at
) VALUES (
  '<student_auth_user_id>',
  '<tenant_id>',
  'self',
  '{"full_name": "Test Student", "email": "test@example.com", "phone": "+254700000000", "date_of_birth": "2000-01-01"}',
  '{"institution": "University of Nairobi", "course": "BSc Computer Science", "year_of_study": 3, "gpa": 3.5}',
  'draft',
  now(), now()
)
RETURNING id;
Note the returned applicant_id.
Step 4 — Walk the end-to-end flow and verify
Do this manually in the browser (or via curl) and report the result of each step:
Browse: Visit https://www.elimux.ke/bursary/ → confirm the test fund appears in the listing with correct name, amount (KES 500,000), deadline (Dec 31, 2026), and provider name.
Detail: Click the fund → confirm /bursary/fund/<fund_id> loads with all JSONB fields rendered correctly (eligibility rules, required documents, deadline, amount).
Apply: Click "Apply Now" while logged in as the test student → confirm success message appears.
Track: Visit https://www.elimux.ke/bursary/my-applications/ → confirm the application appears with status "submitted" and correct fund name/deadline.
Admin review: Visit https://www.elimux.ke/admin/bursary/applications/ → confirm the application appears in the admin list.
API direct: curl -s https://api.elimux.ke/api/bursary/funds | jq '.funds | length' → should return 1.
Step 5 — Report format
Return findings in this exact format:
plain
=== BURSARY E2E VERIFICATION ===

SEED DATA:
- Tenant ID: [id]
- Fund ID: [id]
- Applicant ID: [id]
- Student User ID: [id]

VERIFICATION STEPS:
1. Browse /bursary — [PASS / FAIL] — [screenshot description or error]
2. Detail /bursary/fund/[id] — [PASS / FAIL] — [notes]
3. Apply — [PASS / FAIL] — [notes, including any API error response]
4. Track /bursary/my-applications — [PASS / FAIL] — [notes]
5. Admin review — [PASS / FAIL] — [notes]
6. API direct — [PASS / FAIL] — [curl output]

ISSUES FOUND:
- [list any bugs, display errors, or broken flows]
- [include exact error messages]

FIXES APPLIED:
- [list any code changes made to fix issues found]

STATUS: [VERIFIED / PARTIAL / BLOCKED]
Do not proceed to any other feature until this cycle is verified complete. If any step fails, fix it immediately and re-verify before reporting.