## KIMI DESIGN (Current)

# INSTRUCTION 001: Clean up schema drift and dead code in scholarships module

**Depends On:** Cycle 000 — Baseline audit (§1 Schema, §2 Backend Routes, §9 Anomalies)

**Objective:** Remove the dangling `scholarship_provider_id` column and unreachable dead code before they cause production 400s or mislead future developers.

---

## Background from Ground Truth

- `scholarships.scholarship_provider_id` has a real FK to `scholarship_providers.id` but **zero code references** in either repo (§9.1). It appeared on the live DB with no corresponding commit. The actual used column is `provider_id` (repointed to `scholarship_providers` today).
- `admin-scholarships.ts`'s `POST /` is **unreachable dead code** because `admin.ts` mounts first at `/api/admin` and defines `POST /scholarships`, shadowing it (§9.2).
- `adminAuth` (async, used by `routes/auth.ts`) and `adminMiddleware` (sync, header compare) may enforce different rules (§9.3).

---

## Task 1: Verify and drop dangling column

**Before any destructive action, verify ground truth still holds:**

```bash
# 1. Confirm column exists and is unused
psql $DATABASE_URL -c "SELECT COUNT(*) FROM scholarships WHERE scholarship_provider_id IS NOT NULL;"
# Expected: 0. If &gt; 0, STOP and report the count.

# 2. Confirm zero code references still
grep -r "scholarship_provider_id" elimux-backend/src/ elimux-frontend/src/
# Expected: zero matches outside of migration files.