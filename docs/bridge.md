CYCLE 178 — BUILD NOW PASSES, STAGED, NOT COMMITTED, per the brief's own rule. Follow-up to
`docs/archive/bridge-178-blocked-report.md` (the earlier memory-blocked report for this same
cycle).

Archived: the earlier blocked-build report is `docs/archive/bridge-178-blocked-report.md`.

BUILD: RETRIED, REAL EXIT 0 THIS TIME
Memory had eased somewhat (185MB -> 225MB free at retry time, still tight but enough). Captured
the exit code directly to a file rather than through a pipe this time (the earlier false "exit 0"
was `tail`'s own exit code, not the build's - a real gotcha, noted for next time). `npm run build`
(2.5GB heap + `NEXT_PRIVATE_SKIP_SOURCEMAPS=1`): genuine exit 0, zero errors. Confirmed all three
touched routes actually present in `.next/server/`, not just trusted the exit code alone.

BROWSER VERIFICATION: partial, honestly reported
Chrome extension was disconnected this attempt (checked twice, didn't keep retrying past that).
What's still valid: the auth-gate mechanism protecting `/institution/dashboard/alerts` (the shared
`layout.tsx` from Cycle 177-B) is unchanged this cycle, and was already directly browser-verified
then - redirects unauthenticated visitors to `/institution/login`, no crash, no loop. Since
unauthenticated visitors never reach the alerts page's own new content (the layout blocks them
first), that earlier result still covers exactly what this cycle's own checklist asks for. What's
*not* freshly browser-verified this cycle: the new alerts page's own loading/error/empty-state
rendering, `date-fns`'s `formatDistanceToNow` actually working at runtime - compile-verified only
(clean build), not run in a real browser this cycle.

STAGED (Part 5), NOT committed - explicit pathspec, no `git add -A`
```
 package-lock.json                                 |  11 ++
 package.json                                      |   1 +
 src/app/api/institution/alerts/[id]/read/route.ts |  22 +--
 src/app/api/institution/alerts/route.ts           |  41 +++--
 src/app/institution/dashboard/alerts/page.tsx     | 187 +++++++++++++++-------
 5 files changed, 168 insertions(+), 94 deletions(-)
```

RESTATING FROM THE EARLIER REPORT, STILL TRUE
- `trending_alerts` table + 3 RLS policies already live in production (ran independently of the
  build, verified via `pg_policies`).
- Part 1.2's trigger was NOT run - `program_applications` has no path to `program_id`/
  `applicant_name`, it's actually the institution-onboarding program list, not a student-applies-
  to-program event. Running it as written would have broken real, working institution
  applications. Three real options for what should actually generate an alert are laid out in
  `docs/archive/bridge-178-blocked-report.md` - still waiting on that product decision.
- Alerts will correctly show an honest "No alerts yet" empty state once this is committed and
  deployed - real notifications still need the trigger question resolved separately.

WAITING ON "commit and push it" for the 5 staged files, and the trigger-source decision.
