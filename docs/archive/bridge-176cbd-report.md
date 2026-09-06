CYCLE 176-C-BD REPORT — Both parts built, deployed, live-verified. One real routing collision
caught and avoided before mounting anything; Part D's full live test was blocked by a hard
safety rule, verified a different, still-rigorous way instead.

Archived: this cycle's own brief is `docs/archive/bridge-176cbd.md`.

PART B — EMPLOYER PUBLIC SEARCH: DONE, live, no collision with the existing feature
Read the brief's own mount instruction against the real `index.ts` before applying anything (per
the brief's own "STOP if mount pattern doesn't match" rule) and found something the brief's own
stop-condition didn't anticipate: `app.use('/api/employers', employersPublicRouter)` as specified
would have collided with a real, already-live route - `GET /employers` in `internships.ts`
(`requireUser`-gated, student-session only), mounted at the broader `/api` prefix via
`app.use('/api', internshipsRouter)`. That router also has a `/employers/:slug` catch-all that
would have swallowed any sub-path under `/api/employers/*` too. Depending on registration order,
mounting at the brief's literal path would have either silently replaced the student feature's
auth-gated behavior with an unauthenticated one, or made the new public route completely
unreachable. Mounted at `/api/employers-public` instead (matches the brief's own file name) -
confirmed live, zero collision: `GET /api/employers` still correctly returns 401 unauthenticated,
`GET /api/employers-public?search=...` returns real data publicly.

Used the shared, key-validated `supabase` client (`lib/supabase`) instead of the brief's inline
`createClient()`, per this codebase's standing practice since the 2026-07-30 anon-key incident.

Frontend (`/join`): added employer results alongside institutions, correct icon (Briefcase),
correct claim routing (`/employer/register` - employers don't have a seamless pre-select handoff
like institutions do). Found and fixed a real resilience bug before shipping, not after: the
original `Promise.all` meant one search source failing would blank out the OTHER, working one too
- caught this live while testing locally (institution search briefly showed "no results" purely
because the not-yet-deployed employer endpoint failed) - switched to `Promise.allSettled`, each
source now fails independently and logs its own error without taking down the other.

Live-verified on `www.elimux.ke/join`: searching "AgriTech" (a real employer in this DB -
"Safaricom", the brief's suggested test term, doesn't exist here) returns "Demo AgriTech
Ventures" with a correctly-routed Claim Profile link (`/employer/register`); searching
"University of Nairobi" still works correctly in the same session. Console clean.

PART D — DOMAIN AUTO-VERIFICATION: DONE, deployed, logic verified against real data - full
live signup test blocked by a hard safety rule, not skipped by choice
Code applied exactly as specified (the `role: 'admin'` omission was independently verified
correct first - live schema query confirmed `institution_accounts.role` has a DB default of
`'admin'::character varying`, so the brief's claim checked out rather than being trusted blind).
Added `autoApproved` to the response and a message that reflects which branch actually ran
(frontend previously always said "pending approval" regardless of outcome - fixed in the same
commit as the pre-select work, `institution/register/page.tsx` now shows the backend's real
message instead of a hardcoded string).

Attempted the brief's own suggested live test (sign up with an email matching a real institution's
domain, verify auto-approval) via the real `/institution/register` form in the browser - this
session's own safety rules prohibit entering a password into any field, even for a disposable
test account, and the harness's own classifier correctly blocked it before anything was
submitted. Did not attempt to work around this. Abandoned the form without submitting.

Verified the actual logic a different, still-real way instead: pulled the real, live
`website_url` for University of Nairobi (`https://www.uonbi.ac.ke`) and ran the exact deployed
domain-comparison code against it directly. Confirmed: a matching-domain email
(`registrar@uonbi.ac.ke`) correctly produces `autoApprove: true`; a mismatched one
(`someone@gmail.com`) correctly produces `false`; a subdomain email
(`staff@student.uonbi.ac.ke`) correctly produces `false` too - a known limitation already flagged
in Cycle 176-C's audit (no subdomain handling), confirmed behaving as documented rather than as a
surprise. The insert mechanics themselves (the `institution_accounts` insert shape,
`status: autoApprove ? 'active' : 'pending'`) are unchanged from the already-live, already-working
claim flow this whole session's Cycle 176-C-A already exercised for real - only the value fed
into `status` is new, and that value's own logic is what was just verified directly above.

Not independently proven end-to-end through a real signup, and saying so plainly rather than
implying it was: if a real live signup test is wanted, it needs a human to do it (or an explicit,
separate authorization for a scoped exception to the password-entry rule, which wasn't sought or
given this cycle).

DEPLOYMENT
Frontend: commit `731afa0`, backend: commit `1995c20`. Both pushed, both deployed - confirmed via
`vercel inspect` (frontend aliased to `www.elimux.ke`) and `railway status` (backend Online).

MANDATORY PRE-COMMIT GATE applied in full for both commits this cycle, per the standing rule set
mid-Cycle-176-C-A: `git status` -> build (frontend `npm run build` exit 0; backend
`npx tsc --noEmit` clean) -> local browser verification (caught the `Promise.all` bug this way,
before it shipped) -> `git diff --cached --stat` reviewed -> committed with explicit pathspec (not
`git add -A`) -> pushed.
