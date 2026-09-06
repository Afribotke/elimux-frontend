CYCLE 178-C REPORT — trigger built, tested live, one real bug found and fixed mid-cycle, one
real behavioral limitation found and documented (not fixed - doesn't affect real usage). Trigger
is live and working. No files changed - nothing to stage or commit, per the brief's own note.

Archived: this cycle's own brief is `docs/archive/bridge-178c.md`.

## CYCLE 178-C REPORT

### Schema Verification
- `program_views` columns: `id`, `program_id` (uuid), `institution_id` (uuid - already denormalized
  onto this table, a bonus the brief's own trigger doesn't strictly need but doesn't hurt to have
  matched against `programs.institution_id` instead), `view_source`, `referrer_country`,
  `session_id`, `created_at` (timestamp without time zone), `device_id`, `source_query`,
  `user_country`.
- `programs` columns checked (`institution_id`, `name`): both exist, `uuid`/`character varying`.
- `trending_alerts` exists: YES.

### Trigger Status
- Function created: YES.
- Trigger created: YES.
- Verify query returned 1 row: YES (`view_alert_trigger`, `INSERT`, `AFTER`, `ROW`).

### Manual Test - two real findings along the way, not just a straight pass
**Bug found and fixed before the test could even run**: `trending_alerts.type` has a CHECK
constraint from when the table was created (Cycle 178) - `IN ('new_application',
'program_published', 'system')` - it never included `'program_views'`. The insert this trigger
tries to make would fail every single time. Caught this on the first test attempt (a real
constraint-violation error, not guessed at), widened the constraint to add `'program_views'`
before proceeding.

**Real baseline mismatch, corrected before testing**: the brief's own test script assumes
`generate_series(1, 10)` against a program starting at 0 views. The real program picked
(`"Bachelor of Science (BSC) in Medical Physiology"`, University of Nairobi) already had 2 real,
organic views - inserting the literal 10 would have landed on 12, never satisfying the trigger's
own `% 10 = 0` condition at all. Checked the real count first, inserted 8 (not 10) to land exactly
on 10.

- Test program used: "Bachelor of Science (BSC) in Medical Physiology",
  `38079f8f-24fb-4bc0-9cc2-cc846fa269ad` (University of Nairobi).
- Alerts created after reaching 10 views: YES - `type: program_views`, `title: "Program Getting
  Attention"`, `message: "\"Bachelor of Science (BSC) in Medical Physiology\" has been viewed 10
  times."`, `metadata: {program_id, view_count: 10}`. Content and shape exactly as designed.
- **But 8 duplicate alerts were created, not 1** - one per row in the test batch, all with the
  identical microsecond-precision timestamp. Investigated rather than dismissed: bulk-inserting
  all 8 rows in a single `INSERT ... SELECT ... FROM generate_series(...)` statement means every
  row's trigger execution saw the *same final* `COUNT(*) = 10` (the post-statement total), not an
  incrementally-updated 3,4,5...10 per row - so all 8 satisfied the modulo condition
  simultaneously. Checked whether this is a real production risk before flagging it as one: real
  view tracking (`POST /api/analytics/view` in `elimux-backend/src/routes/search-analytics.ts`)
  does exactly one single-row `.insert({...})` per page view, in its own separate request/
  statement - never a bulk multi-row insert. A single-row INSERT has no such ambiguity; the count
  is correctly isolated per statement. **This duplication is real and reproducible, but only
  under bulk-insert conditions this app's real code never creates** - documenting it as a known
  limitation rather than "fixing" a scenario that doesn't happen in production. Didn't touch the
  trigger function to guard against it, since doing so (e.g. locking, `SELECT ... FOR UPDATE`, or
  using a sequence instead of `COUNT(*)`) is real added complexity for a scenario this app doesn't
  trigger.
- Any errors in Postgres logs: the one CHECK-constraint violation from before the fix, already
  covered above - none after.

Cleaned up fully after testing, matching this project's standing practice of not leaving synthetic
test rows in production tables: deleted all 8 test `program_views` rows and all 8 duplicate test
`trending_alerts` rows. Verified restored exactly to the real baseline - `views_now: 2`,
`leftover_alerts: 0`.

### Build Verification
`npm run build` exit code: 0 (captured directly to a file rather than through a pipe, per the
lesson from Cycle 178's earlier false-positive). No files were changed this cycle - `git status`
confirms only `docs/bridge.md` itself differs. Nothing to stage or commit.

### What this means for the live site
The Alerts feature (`/institution/dashboard/alerts`) now has a real, working, tested source of
data: any program that crosses a multiple of 10 total views generates a real alert, visible the
next time an institution admin loads the page - no code deploy needed, this took effect the
moment the trigger was created. The CHECK-constraint fix is also already live (it had to be, to
get past Part 3's own test).
