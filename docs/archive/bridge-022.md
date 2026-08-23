Cycle: Bursary Module Status Audit
Objective: Audit the current state of the bursary module in the ElimuX codebase and produce a clean status report of what's built vs. what's missing.
Step 1 — Audit what exists
Inspect the codebase and report on each of the following. For each item, state: BUILT (with file path) or MISSING.
Bursary listing/discovery page — public page where students browse available bursaries
Bursary detail page — individual bursary view with eligibility, deadline, application link
Bursary data model — Supabase table schema for bursaries (fields, types, constraints)
Bursary CRUD in admin dashboard — create, read, update, delete bursaries from admin panel
Bursary application flow — student can click "Apply" and track application status
Bursary search/filter — search by field of study, amount, deadline, location, etc.
Bursary bookmarking/favorites — student can save bursaries to a list
Bursary notifications — alerts for deadlines, new matching bursaries
Bursary API endpoints — backend routes for bursary operations
Bursary seed data — any demo/test bursaries in the database
Step 2 — Report format
Return your findings in this exact format:
plain
=== BURSARY MODULE STATUS AUDIT ===

BUILT:
- [Feature name]: [file path or table name]
- ...

MISSING:
- [Feature name]: [brief description of what needs to be built]
- ...

BLOCKED:
- [Feature name]: [why it's blocked, e.g. missing dependency, schema issue]
- ...

NEXT PRIORITY (recommend one):
[Single highest-impact missing item to build next]
Step 3 — Do not build anything
This is audit-only. Do not write code, create files, or modify the database. Report only.