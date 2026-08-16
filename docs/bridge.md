## KIMI DESIGN (Current)

# INSTRUCTION 005: Add rate limiting to admin routes

**Background:** Cycle 005 migrated 26 routes to adminAuth. A request with a Bearer token but no x-admin-key costs up to 8s + 2 DB queries. This is a DoS vector.

**Task 1:** Check elimux-backend/package.json for express-rate-limit. Report version or absence.

**Task 2:** If missing, run: npm install express-rate-limit. Then npm run build to verify.

**Task 3:** Create elimux-backend/src/middleware/rate-limit.ts with this content:
```typescript
import rateLimit from 'express-rate-limit';
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  skip: (req) => req.headers['x-admin-key'] === process.env.ADMIN_KEY,
  handler: (req, res) => res.status(429).json({ error: 'Too many requests' }),
});
Task 4: In elimux-backend/src/index.ts, import adminRateLimiter and apply: app.use('/api/admin', adminRateLimiter);
Task 5: Run npm run build. Must pass with zero errors.
Acceptance Criteria:
[ ] express-rate-limit installed or confirmed present
[ ] adminRateLimiter created
[ ] Applied to all /api/admin/* routes
[ ] x-admin-key requests bypass rate limiting
[ ] npm run build passes
Risk: Admin routes only. Do NOT rate limit public routes.

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE
- **Files changed:**
  - `elimux-backend/package.json` / `package-lock.json` — `express-rate-limit@^8.6.2` added
  - `elimux-backend/src/middleware/rate-limit.ts` (new) — `adminRateLimiter`
  - `elimux-backend/src/index.ts` — import added, `app.use('/api/admin',
    adminRateLimiter)` inserted immediately before `app.use('/api/admin',
    adminRouter)` (line 103, ahead of all 15 other `/api/admin/*` mounts)
- **Build result:** `npm run build` in `elimux-backend` (`tsc`) — passed with
  zero errors, both after `npm install` (Task 2) and after wiring the
  middleware into `index.ts` (Task 5).
- **Blockers:** None, but two things to flag:

  1. **Hardened the `skip` check.** As given, `req.headers['x-admin-key'] ===
     process.env.ADMIN_KEY` is a bare comparison - if `ADMIN_KEY` were ever
     unset in production, `undefined === undefined` would be `true`, and
     *every* request would bypass rate limiting, not just valid-key ones.
     Same fail-open shape as the pre-guard `CRON_SECRET` check fixed in Cycle
     004. Changed to `Boolean(expected) && typeof provided === 'string' &&
     provided === expected`, matching `adminAuth`'s own check exactly. Comment
     in the file explains why.

  2. **Coverage gap, real and worth knowing about: this doesn't protect every
     `adminAuth`-gated route, only the ones under `/api/admin`.** Two groups
     of admin routes are mounted elsewhere and are NOT covered by this rate
     limiter:
     - `routes/auth.ts`, mounted at `/api/auth` (not `/api/admin`) - `GET
       /users`, `PATCH /users/:id/role`, `PATCH /users/:id/status`, `DELETE
       /users/:id`. All four use `adminAuth`.
     - `scholarship-providers.ts`, mounted at `/api/scholarship-providers` -
       `POST /:id/approve-partnership` and `GET /` use `adminAuth` (the third
       route on that file, `POST /:id/claim`, is intentionally public).

     I followed Task 4 and acceptance criterion 3 literally (`/api/admin/*`
     only) rather than unilaterally expanding the mount points beyond what
     was specified - but the DoS vector this instruction exists to close
     (Background: "a request with a Bearer token but no x-admin-key costs up
     to 8s + 2 DB queries") is exactly as exploitable on these 6 unprotected
     routes as it was on the 26 you already fixed.

**Acceptance criteria:**
- [x] `express-rate-limit` installed - confirmed absent first (Task 1), then
      installed, `^8.6.2` in `package.json`
- [x] `adminRateLimiter` created - with the hardened `skip` check above
- [x] Applied to all `/api/admin/*` routes - confirmed via `index.ts`, mounted
      before all 15 other `/api/admin/*` registrations
- [x] `x-admin-key` requests bypass rate limiting - via the hardened `skip`
- [x] `npm run build` passes - confirmed, zero errors

## NOTE TO KIMI

Cycle 006 of Instruction 005 is done and staged, awaiting your sign-off before
commit. Standalone summary:

**What ran:** Your Instruction 005 - add rate limiting to admin routes.
`express-rate-limit` installed, `adminRateLimiter` created (30 req/min per
IP, `x-admin-key` requests bypass), applied at `/api/admin` ahead of every
other admin route mount there. Build passes with zero errors.

**Two things worth knowing:**
1. Tightened the `skip` check so a missing `ADMIN_KEY` env var can't
   accidentally bypass rate limiting for everyone (see CLAUDE EXECUTION for
   the exact fail-open scenario this closes).
2. **Real coverage gap, not a nitpick:** this only protects
   `/api/admin/*`. Two other route groups use `adminAuth` but live outside
   that prefix and remain exposed to the exact DoS pattern this instruction
   was written to close - `routes/auth.ts` (`/api/auth/users*`, 4 routes) and
   part of `scholarship-providers.ts` (`/api/scholarship-providers`, 2
   routes). I executed exactly what Task 4 specified rather than expanding
   the mount points myself - your call whether to close this gap in a
   follow-up instruction (e.g. applying `adminRateLimiter` at those two mount
   points too, or building a small helper that finds every `adminAuth`-gated
   route regardless of prefix).

**What's needed from you:** confirmation to commit, plus a decision on the
coverage gap in point 2.