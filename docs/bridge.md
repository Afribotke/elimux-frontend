CYCLE 178 — COMMITTED, PUSHED, DEPLOYED, LIVE-VERIFIED. On explicit "commit and push it".

Archived: the staged-not-committed report is `docs/archive/bridge-178-staged-report.md`.

WHAT'S NOW LIVE ON www.elimux.ke / elimux.ke

Commit `b69e367`, deployed as `elimux-frontend-a72gd3pvz` (confirmed via `vercel inspect` -
aliased to `www.elimux.ke`, `elimux.ke`, `v2.elimux.ke`, `bursary.elimux.ke`).
`curl -L https://www.elimux.ke/institution/dashboard/alerts` -> 200, no crash.

1. **`trending_alerts` is real now** - table, indexes, and 3 RLS policies live in production
   (created directly via SQL earlier in this cycle, independent of the code deploy - already
   confirmed via `pg_policies` before this commit even happened).
2. **Alerts routes and the dashboard alerts page rewritten** to query/write this real table
   instead of one that never existed - a request to `/institution/dashboard/alerts` now correctly
   shows an honest "No alerts yet" empty state instead of a 500 silently masked as empty by the
   old frontend's blank `.catch()`.
3. **`date-fns`** added for relative timestamps ("2 hours ago" etc.) on each alert.

STILL OPEN - the actual point of this cycle isn't done yet
**Nothing populates `trending_alerts` currently.** The brief's own trigger (auto-generate an alert
when a student applies to a program) could not be built as specified - `program_applications` (the
table it would fire on) has no `program_id` or `applicant_name` at all. It's genuinely a different
table: the list of programs a NEW institution proposes as part of its OWN onboarding application
(linked via `institution_application_id`), not students applying to already-listed programs.
Running the trigger as written would have raised a Postgres error on every insert into that real,
live table, breaking real institution applications - not attempted.

Three real options for what should actually generate an alert, none decided unilaterally:
1. Build "a student applies to an existing program" as a real, new concept (table + flow) - the
   biggest lift, but matches the brief's original intent most literally.
2. Alert institutions when someone submits program details as part of an institution application
   naming them (the real, current meaning of `program_applications`) - smaller lift, real data,
   different meaning than "a student applied."
3. Pick an event that already exists and already fires: `program_views` (already tracked, already
   surfaced in the dashboard's own Analytics tab), a new `reviews` row, or a Link Performance smart-
   link click (Cycle 177-B).

Whichever is chosen, the work left is small: a trigger function + `CREATE TRIGGER`, following
exactly the same shape already drafted (and already schema-verified safe against `institutions`/
`trending_alerts`) in this cycle's own brief - just pointed at the real event instead of the
assumed one.

Everything else from Cycles 170-178 already resolved, restating only what's still genuinely open:
`feature/skills-toggle` branch (untouched), `pre-theme-sweep-backup` stash (kept, still needs a
proper audit), 2 unexplained Vercel-integration branches on `origin`, and the fully-authenticated
institution-dashboard click-through (sidebar/nav/sign-out) still needs a human with real login
credentials - this session cannot complete that check itself.
