## KIMI DESIGN (Current)

# INSTRUCTION 002: Remove dead POST handler from admin-scholarships.ts

**Background:** admin-scholarships.ts has a POST / route that is unreachable. admin.ts mounts at /api/admin BEFORE admin-scholarships.ts mounts at /api/admin/scholarships, and admin.ts defines POST /scholarships, so it shadows the dead handler every time. The live creation endpoint is admin.ts POST /scholarships.

**Task 1 — Remove dead handler:**
In `elimux-backend/src/routes/admin-scholarships.ts`:
1. Remove the entire `POST /` route handler (the router.post('/', ...) block).
2. Add this comment at the top of the file, below imports:
   // NOTE: POST / omitted — admin.ts mounts first and shadows this route.
   // Scholarship creation lives in admin.ts POST /scholarships.
3. Verify `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` remain intact.

**Task 2 — Verify no references:**
Run: `grep -r "admin-scholarships" elimux-backend/src/ --include="*.ts" | grep -v "import"`
Confirm no code imports or references the removed POST handler.

**Task 3 — Build check:**
Run `npm run build` in elimux-backend. Must pass with zero errors.

**Acceptance Criteria:**
- [ ] Dead POST / removed from admin-scholarships.ts
- [ ] Comment added explaining why POST is omitted
- [ ] All other routes (GET, PUT, DELETE) still present
- [ ] No code references the removed handler
- [ ] `npm run build` passes in elimux-backend

**Risk:** DO NOT modify admin.ts. DO NOT remove GET /, PUT /:id, or DELETE /:id.

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE
- **Files changed:**
  - `elimux-backend/src/routes/admin-scholarships.ts` (removed the dead
    `router.post('/', ...)` block; added the explanatory comment below imports)
- **Build result:** `npm run build` in `elimux-backend` (`tsc`) — passed with
  zero errors, zero output.
- **Blockers:** None.

**Acceptance criteria:**
- [x] Dead `POST /` removed from `admin-scholarships.ts`
- [x] Comment added explaining why POST is omitted (exact text as specified)
- [x] All other routes still present - confirmed via grep:
      `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` all intact, `POST /` gone
- [x] No code references the removed handler - `grep -r "admin-scholarships"
      elimux-backend/src/ --include="*.ts" | grep -v "import"` returned zero matches
- [x] `npm run build` passes in `elimux-backend` - confirmed, zero errors

`admin.ts` was not touched (per the Risk constraint) - only
`admin-scholarships.ts` was modified.

## NOTE TO KIMI

Cycle 003 of Instruction 002 is done and awaiting your sign-off before commit.
Standalone summary:

**What ran:** Your Instruction 002 - remove the dead `POST /` handler from
`elimux-backend/src/routes/admin-scholarships.ts` (unreachable because
`admin.ts` mounts first at `/api/admin` and defines its own `POST /scholarships`,
which always wins). Removed the handler block, added your specified comment
below the imports, left `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, and
`admin.ts` completely untouched.

**Verification:** grep confirmed no other code references the removed handler.
`npm run build` in `elimux-backend` (tsc) passed with zero errors.

**No deviations this cycle** - your instruction matched the real repo
structure exactly, unlike Instruction 001 (which assumed a `migrations/`
subfolder that didn't exist).

**What's needed from you:** confirmation to commit. Nothing has been committed
to git yet - the change is staged locally only in `elimux-backend`, plus the
usual `docs/bridge.md` / `docs/audit-log.md` / `docs/archive/` updates in
`elimux-frontend`. Once you confirm, tell Claude to proceed (via the user) and
the commits will run.