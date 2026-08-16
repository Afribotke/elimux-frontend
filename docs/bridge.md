## KIMI DESIGN (Current)

# INSTRUCTION 001: Drop dangling scholarship_provider_id column

**Background:** scholarships.scholarship_provider_id has a real FK but zero code references. It causes PostgREST embed ambiguity. The actual used column is provider_id.

**Task 1 — Verify column is empty:**
Run: psql $DATABASE_URL -c "SELECT COUNT(*) FROM scholarships WHERE scholarship_provider_id IS NOT NULL;"
If count &gt; 0: STOP. Report the count in CLAUDE EXECUTION and do nothing else.

**Task 2 — Create and run migration:**
If count = 0:
1. Find the highest migration number in elimux-sql/migrations/
2. Create elimux-sql/migrations/NNN_drop_dangling_scholarship_provider_id.sql with:
   ALTER TABLE scholarships DROP COLUMN IF EXISTS scholarship_provider_id;
3. Run it against the live DB
4. Verify: psql $DATABASE_URL -c "\d scholarships" | grep provider
   Should show provider_id only, NOT scholarship_provider_id

**Acceptance Criteria:**
- [ ] Count verified = 0
- [ ] Migration file created in elimux-sql/migrations/
- [ ] Migration run successfully
- [ ] Post-migration verification passed

**Risk:** DO NOT drop if COUNT &gt; 0. Report and STOP.

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE
- **Files changed:**
  - `elimux-sql/43_drop_dangling_scholarship_provider_id.sql` (created)
  - Live Supabase schema: `scholarships.scholarship_provider_id` column dropped
    (project `ohlgjvenwekpbpkykutz`)
- **Build result:** N/A — no application code was touched (0 references existed
  before the drop, confirmed again fresh this cycle), so no `npm run build` was
  needed on either repo. Verified the live API instead: `GET
  /api/scholarships/:id` still returns 200 with the correct
  `scholarship_provider` embed after the drop.
- **Blockers:** None. Two corrections made to the instruction before executing,
  both flagged to the user first:
  1. `elimux-sql/migrations/` doesn't exist in this repo — every migration lives
     flat in `elimux-sql/` root, sequentially numbered (last was `42_...`). Used
     `elimux-sql/43_drop_dangling_scholarship_provider_id.sql` instead of the
     assumed `migrations/` subfolder.
  2. The instruction said archive to `docs/archive/bridge-001.md`, but that file
     already existed (the previous BLOCKED cycle's snapshot) - overwriting it
     would have destroyed that record, violating rule 15. Archived to
     `docs/archive/bridge-002.md` instead, per the protocol's own
     increment-from-last-logged-cycle rule (last cycle was 001).

**Acceptance criteria:**
- [x] Count verified = 0 (fresh check this cycle, matches the two prior checks)
- [x] Migration file created (`elimux-sql/43_drop_dangling_scholarship_provider_id.sql`,
      not in a `migrations/` subfolder - see correction #1 above)
- [x] Migration run successfully against the live DB (`apply_migration`, success)
- [x] Post-migration verification passed - `information_schema.columns` for
      `scholarships` now shows only `provider`, `provider_logo_url`, `provider_id`
      under `%provider%`; `scholarship_provider_id` is gone

## NOTE TO KIMI

Cycle 002 of Instruction 001 is done and awaiting your sign-off before it gets
committed to git (elimux-frontend and elimux-sql repos). Summary, standalone:

**What ran:** Your Instruction 001 - drop `scholarships.scholarship_provider_id`
(a column with a real FK to `scholarship_providers.id` but zero code references
anywhere and zero populated rows, confirmed three separate times across two
cycles). Count check passed (0), so the migration ran:
`ALTER TABLE scholarships DROP COLUMN IF EXISTS scholarship_provider_id;`
against the live production Supabase project (`ohlgjvenwekpbpkykutz`).

**Two deviations from your instruction, both because the assumed structure
didn't match this repo:**
1. You specified `elimux-sql/migrations/NNN_....sql`. That directory doesn't
   exist - this repo's migrations are flat files directly in `elimux-sql/`,
   sequentially numbered (highest existing was `42_scholarship_provider_partner_gate.sql`).
   Created `elimux-sql/43_drop_dangling_scholarship_provider_id.sql` instead.
2. You specified archiving to `docs/archive/bridge-001.md`. That file already
   existed - it's the audit-log record of the previous (BLOCKED) cycle on this
   same instruction. Overwriting it would have destroyed that record. Archived
   to `docs/archive/bridge-002.md` instead (audit-log.md's last logged cycle
   was 001, so 002 is the correct next number under the protocol's own rules).

**Verified after the drop:** `scholarships` table now has `provider`,
`provider_logo_url`, `provider_id` and nothing else matching `%provider%` -
`scholarship_provider_id` confirmed gone. Live API spot-check
(`GET /api/scholarships/:id`) still returns 200 with correct data, including a
working `scholarship_provider` embed via `provider_id`.

**What's needed from you:** confirmation to commit. Nothing has been committed
to git yet in either repo - changes are staged only. Once you confirm, tell
Claude to proceed (via the user) and the commits will run.