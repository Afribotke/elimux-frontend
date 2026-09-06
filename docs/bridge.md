CYCLE 176-C — MANDATORY AUDIT COMPLETE. STOPPING HERE, PER THE BRIEF'S OWN REPEATED
INSTRUCTION, BEFORE TOUCHING ANY CODE. Two of the four parts are bigger than the brief assumed -
reporting that plainly rather than building around it silently.

Archived: this cycle's own brief is `docs/archive/bridge-176c.md`.

FILE 1 — `src/app/institution/register/page.tsx`: already fully read in Cycle 176-B (223 lines),
not re-read this cycle since nothing about it has changed since. Confirms the brief's own
"Expected File Structure" note exactly: has its own self-contained search-and-select UI, does
NOT read `institution_id` from the URL anywhere. Ready for Part A as described.

FILE 2 — `src/routes/employers.ts`: does not exist. There is no single file by that name.
Employer-related routes are scattered: `employer-names.ts`/`admin-employer-names.ts` (CRM
outreach data - `employer_names` table, unrelated to the real `employers` table used by
`/employer/register`), `employer-evaluations.ts`, `admin-employer-outreach.ts`. The real
`employers` table's actual CRUD/registration logic lives inside `src/routes/internships.ts`
(mounted at `app.use('/api', internshipsRouter)`), not a dedicated employers file.

FILE 3 — `src/routes/schools.ts`: does not exist, and neither does any file that touches the
`schools` table - confirmed via `grep -rln "from('schools')" src` returning nothing at all across
the entire backend. Zero backend infrastructure exists for this table in any form, not even a
non-search version.

FILE 4 — `src/routes/institution-portal.ts`: already fully read in Cycle 176-A/176-B (428 lines),
not re-read (unchanged). The exact insert Part D would modify, `POST /register`
(lines 93-103 in the last-read version):
```
const { data: account, error: insertError } = await supabaseAdmin
    .from('institution_accounts')
    .insert({
        institution_id,
        user_id: user.id,
        contact_name: contact_name || null,
        email: user.email,
        status: 'pending'
    })
    .select()
    .single();
```
No `role` field is set on insert at all currently (the brief's Part D snippet adds
`role: 'admin'` - `institution_accounts.role` is `NOT NULL` per Cycle 176-A's schema read, so
whatever this currently inserts as either has a DB default or is failing silently in a way worth
checking before trusting the table works today - flagging, not chasing further this cycle since it's
pre-existing behavior, not something Part D introduces).

`listEmployers`/`listSchools` IN `src/lib/api.ts`: confirmed absent, grep returns nothing for
either.

________________________________________

PART A — READY TO BUILD AS SPECIFIED, no surprises
File and behavior match the brief's own expectation exactly. The only real decision: after
pre-selecting via `institution_id`, should the page skip straight past its own search UI to the
contact/email/password form, or just pre-fill+lock the "Selected: X" state so the rest of the
existing form still runs unchanged? The brief's snippet only sketches the fetch, not the UI branch
- recommend the latter (smaller diff, reuses the existing `selected` state exactly as the form
already expects it) unless a bigger UI change is wanted.

PART B — BIGGER THAN THE BRIEF ASSUMED: the only real "list employers" endpoint is auth-gated to
STUDENTS, not public
`GET /api/employers` exists (in `internships.ts`, line 107) but requires `requireUser` - a logged-
in *student* session, not a public visitor. It also has no `search` param (returns every active+
approved employer, unpaginated) and its `.select()` doesn't include `website_url` at all (only
`id, company_name, location_county, industry`). Using this for `/join` as specified would mean an
HR person trying to claim their own company first has to be logged in as a *student* - wrong
audience, not just a missing search param. Real options: (1) add a genuinely public,
unauthenticated search endpoint (new route, not a modification of the student-facing one -
`GET /api/employers` already means something else and reusing it would either break the student
feature or require splitting behavior by auth state), or (2) skip employer search in `/join` for
now and keep the static "Are you an employer? Register here" link `/join` already has (which
already works, per Cycle 176-B). Needs a call before writing any code.

PART C — SCHOOLS HAS ZERO BACKEND INFRASTRUCTURE, not just a missing search param
Nothing to modify - there is no existing `GET /` for the `schools` table to add a `search` param
to. This is new backend work from scratch: a new route file, a new mount in `index.ts`, and
(same shape of question as Part B) a decision on whether it's public or auth-gated. Given the
table has 0 rows (already known, restated by the brief itself) and no self-service UI exists on
the frontend either (confirmed in Cycle 176-A), this is building a complete, currently-unused
feature end to end, not extending something partial. Worth confirming this is actually wanted now
versus building the employer search first (which at least has real live data behind it) or holding
schools for a later cycle.

PART D — REAL CODE, REAL DECISION, FLAGGING BEFORE BUILDING RATHER THAN JUST BUILDING IT
This one isn't a wrong-path problem like B/C - the file, the insert location, and the field names
(`institution.website_url`, matching Cycle 176-A/B's confirmed real column) are all exactly right.
But auto-approving a claim - skipping human review and granting immediate write access to an
institution's public page and program listings based solely on an email-domain string match - is
a real trust decision, not a technical one, and this whole bridge log's established practice
(Cycle 158's RLS-policy question, among others) has been to get an explicit human confirmation
before shipping something that changes who gets access to what, not just report it after the fact.
Concretely: `institution.website_url` values in this DB include things like
`https://www.uonbi.ac.ke` - a domain check would need to correctly handle subdomains, multiple
listed domains (none of these institutions have more than one on file, but worth naming as a
known limitation), and free-mail domains an institution might have accidentally entered as their
"website" (not spot-checked this cycle - would want to before flipping this on for real, given the
downside of a wrong auto-approve is a stranger getting edit access to a real institution's page).
Ready to build the moment this is confirmed - not blocked on any unknown, just wanted this
explicitly agreed to before writing it, per the brief's own repeated instruction.

________________________________________

WAITING FOR CONFIRMATION ON ALL FOUR PARTS BEFORE WRITING ANY CODE, exactly as instructed. Once
confirmed (all four, or a subset - happy to build only what's approved), will proceed in the
brief's stated order.
