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