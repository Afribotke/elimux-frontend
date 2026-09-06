CYCLE 178 REPORT — Database and code partially done, blocked on two separate issues: one real
schema mismatch (skipped a dangerous trigger, everything else proceeded), one genuine machine
resource constraint (build verification could not complete, three attempts). Nothing staged,
nothing committed - per this cycle's own rule and because the mandatory build check hasn't
actually passed yet.

Archived: this cycle's own brief is `docs/archive/bridge-178.md`.

BLOCKER 1 — Part 1.2's trigger was NOT run: `program_applications` has no path to what the
trigger assumes
Ran Part 0.2's own pre-flight schema checks before touching anything, exactly as instructed.
`program_applications` real columns: `id`, `institution_application_id`, `name`, `category_id`,
`level`, `duration_months`, `tuition_fees`, `currency`, `description`, `requirements`, `status`,
`admin_notes`, `submitted_at` - **no `program_id`, no `applicant_name`**. Confirmed via backend
code (`admin.ts` lines 156-392) that this table is the *institution-onboarding* flow's program
list - programs a NEW institution proposes as part of ITS OWN application (linked via
`institution_application_id`), reviewed by admins alongside that institution application. It has
nothing to do with a student applying to an already-listed program - that event isn't modeled
anywhere in this schema today. `programs.institution_id` does exist (confirmed) and `reviews`
exists too (confirmed, correctly out of this cycle's stated scope).

Running Part 1.2's trigger as written would have attached `AFTER INSERT ON program_applications`
that references `NEW.program_id` (doesn't exist) - the trigger function would raise a Postgres
error the very first time ANYTHING is inserted into this table, which is a real, live, working
table backing the institution-onboarding application flow (confirmed working in Cycle 176-A's
audit). An AFTER INSERT trigger that errors fails the whole triggering transaction - this would
have broken real institution applications, not just failed to create alerts. This is exactly the
brief's own stated stop condition ("If program_applications table or applicant_name column
doesn't exist, the trigger will fail... STOP"), just triggered by a schema-shape mismatch rather
than a missing table. Did not run Part 1.2. Ran everything else in Part 1 that's safe and
independently correct regardless of how this resolves.

WHAT DID RUN LIVE (Part 1.1 only)
`trending_alerts` table created with the exact schema specified, plus its 3 policies - confirmed
via `pg_policies`: `"Institution admins can view own alerts"` (SELECT), `"...can update own
alerts"` (UPDATE), `"Service role can insert alerts"` (INSERT, service_role only). This alone
already turns Alerts from a silent 500-masked-as-empty into a genuinely-empty, honestly-working
state (Parts 2-3 below query/render this table correctly) - real notifications still need Blocker
1 resolved.

REAL OPTIONS for what should actually trigger an alert, since "student applies to an existing
program" isn't a modeled event in this schema today:
1. Build that concept from scratch (a real "student applies to program X" flow + table) - bigger
   scope than this cycle, but matches the brief's own stated intent most literally.
2. Alert on institution-application program submissions instead (the real, current meaning of
   `program_applications`) - different meaning than "a student applied," but real and already
   happening.
3. Pick a different, already-real event that fits "new interest in your programs" - `program_views`
   (already exists, already queried by the dashboard's own Analytics tab), a new review via
   `reviews` (explicitly out of scope this cycle per the brief's own note, but exists), or smart-
   link clicks (already tracked, feeds the Link Performance page from Cycle 177-B).
Not picking one unilaterally - this is a product decision about what institutions should actually
be notified about, not a technical one.

PARTS 2-3 — CODE WRITTEN, NOT YET BUILD-VERIFIED (see Blocker 2)
`src/app/api/institution/alerts/route.ts`, `src/app/api/institution/alerts/[id]/read/route.ts`,
`src/app/institution/dashboard/alerts/page.tsx` all rewritten exactly as specified - this brief's
own versions were already correct against the real codebase this time (real table name, correct
Next.js 15 async params) - no corrections needed, unlike the last two cycles. `date-fns` was not
installed - installed it (`npm install date-fns`, 1 package added) per the brief's own fallback
instruction.

BLOCKER 2 — could not complete the mandatory build verification: genuine, worsening system memory
pressure, not a code problem
First attempt looked like it passed (background-task notification said "exit code 0") but that
was misleading - piping through `tail` in that command meant the reported exit code was `tail`'s,
not `next build`'s. Re-ran without a pipe to capture the real exit code directly: **134 (OOM),
twice**, at both the machine's normal confirmed-safe heap (2.5GB) and a reduced one (2GB). Checked
system-wide free memory between attempts: 108MB, then 42MB, then 185MB free out of 3.9GB total -
genuinely constrained and fluctuating, not a one-off blip. Checked for stray processes from this
session's own work before blaming the machine generally - found none (only the legitimate Railway
MCP process running); the pressure is coming from something else on this machine outside this
session's control, so didn't take any action against other processes without cause.

Given the build has not actually passed, Part 5's staging step was not run - staging unverified
code would misrepresent it as build-checked when it isn't. `trending_alerts` (Part 1.1, database)
is live regardless, since it's independent of the frontend/backend build and was verified directly
via SQL. The three code files exist on disk, modified, uncommitted, unstaged - ready to build and
stage the moment memory pressure clears.

WAITING ON
1. A decision on Blocker 1 (which real event should generate an alert - see the three options
   above) before Part 1.2's trigger (or an equivalent) gets built.
2. Memory pressure to clear so the mandatory build check can actually run - happy to retry
   whenever, or if there's a reason this machine is under heavier load than usual right now, that
   would help explain it.
