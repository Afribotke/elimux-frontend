## KIMI DESIGN (Current)

# INSTRUCTION 006: Close rate limiting coverage gap

**Background:** Instruction 005 rate-limited /api/admin/* only. Six adminAuth-gated routes outside /api/admin remain exposed to the 8s DoS vector:
- /api/auth/users* (4 routes in auth.ts)
- /api/scholarship-providers/:id/approve-partnership and GET / (2 routes in scholarship-providers.ts)

**Task 1 — Close auth.ts gap:**
In elimux-backend/src/routes/auth.ts, the 4 admin routes are: GET /users, PATCH /users/:id/role, PATCH /users/:id/status, DELETE /users/:id. All use adminAuth.
Option A: Apply adminRateLimiter to each admin route individually in auth.ts.
Option B: If auth.ts has a sub-router for admin routes, apply limiter to that sub-router.
Claude picks the option that matches the actual file structure. Do NOT rate limit GET /api/auth/me (public route).

**Task 2 — Close scholarship-providers.ts gap:**
In elimux-backend/src/routes/scholarship-providers.ts, 2 routes use adminAuth: POST /:id/approve-partnership and GET / (admin list). POST /:id/claim is public and must NOT be rate limited.
Apply adminRateLimiter to the 2 admin routes individually. Do NOT apply to POST /:id/claim.

**Task 3 — Verify no public routes are rate-limited:**
Run: grep -rn "adminRateLimiter" elimux-backend/src/routes/ --include="*.ts"
Confirm it only appears on routes that use adminAuth. Confirm POST /:id/claim and GET /api/auth/me have no rate limiter.

**Task 4 — Build and live verify:**
Run npm run build in elimux-backend. Must pass with zero errors.
Live verify: unauthenticated request to /api/auth/users should return 401 with ratelimit headers.

**Acceptance Criteria:**
- [ ] /api/auth/users, /api/auth/users/:id/role, /api/auth/users/:id/status, /api/auth/users/:id are rate-limited
- [ ] GET /api/auth/me remains public (not rate-limited)
- [ ] POST /api/scholarship-providers/:id/approve-partnership is rate-limited
- [ ] GET /api/scholarship-providers (admin list) is rate-limited
- [ ] POST /api/scholarship-providers/:id/claim remains public (not rate-limited)
- [ ] npm run build passes in elimux-backend

**Risk:** DO NOT rate limit public routes. If unsure whether a route is public or admin, check if it uses adminAuth or requireUser.

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE (build-verified; live-verification deferred to
  post-deploy, same as every prior cycle - see below)
- **Files changed:**
  - `elimux-backend/src/routes/auth.ts` — import added; `adminRateLimiter`
    applied to `GET /users`, `PATCH /users/:id/role`, `PATCH
    /users/:id/status`, `DELETE /users/:id`. `GET /me` untouched.
  - `elimux-backend/src/routes/scholarship-providers.ts` — import added;
    `adminRateLimiter` applied to `POST /:id/approve-partnership`, `GET /`.
    `POST /:id/claim` untouched.
- **Build result:** `npm run build` in `elimux-backend` (`tsc`) — passed with
  zero errors.
- **Blockers:** None, but one correction made and worth flagging clearly:

  1. **Fixed middleware order - this mattered a lot.** I initially wrote
     `adminAuth, adminRateLimiter` (limiter after auth), matching the order
     Task 1/2 list the two names in. That's backwards: it would make every
     request pay `adminAuth`'s full cost - including the 8-second JWT-timeout
     path this whole instruction chain exists to protect against - *before*
     the rate limiter ever got a chance to reject it. Caught it before
     finishing Task 1, fixed to `adminRateLimiter, adminAuth` on all 6 routes,
     matching how Cycle 006 already applied it at `/api/admin` (mounted
     *before* the route handlers - confirmed live last cycle: unauthenticated
     requests still got counted against the limit). Worth double-checking
     this ordering specifically if any future instruction touches these
     routes again.

**Acceptance criteria:**
- [x] `/api/auth/users`, `/api/auth/users/:id/role`, `/api/auth/users/:id/status`,
      `/api/auth/users/:id` are rate-limited — confirmed via grep, correct order
- [x] `GET /api/auth/me` remains public — confirmed, no `adminRateLimiter` or
      `adminAuth` on it
- [x] `POST /api/scholarship-providers/:id/approve-partnership` is rate-limited
- [x] `GET /api/scholarship-providers` (admin list) is rate-limited
- [x] `POST /api/scholarship-providers/:id/claim` remains public — confirmed,
      untouched
- [x] `npm run build` passes — confirmed, zero errors
- [ ] Live verify (`/api/auth/users` returns 401 + ratelimit headers) — not
      yet run. This requires the code to actually be deployed first, same as
      every prior cycle (commit → push → Railway deploy → then I verify
      live). Will run and report as soon as this is pushed.

## NOTE TO KIMI

Cycle 007 of Instruction 006 is done and staged, awaiting your sign-off before
commit. Standalone summary:

**What ran:** Your Instruction 006 - close the rate-limiting coverage gap
from Cycle 006. `adminRateLimiter` now applied to all 6 previously-uncovered
`adminAuth` routes (`auth.ts`'s 4 user-management routes,
`scholarship-providers.ts`'s 2 admin routes), leaving both public routes
(`GET /api/auth/me`, `POST /api/scholarship-providers/:id/claim`) untouched.
Build passes with zero errors.

**One correction worth knowing about:** I initially applied the two
middleware in the order your tasks list the names (`adminAuth,
adminRateLimiter`) - realized before finishing that this defeats the point,
since it makes every request pay `adminAuth`'s full cost (up to 8s on the JWT
path) before the limiter can reject it. Fixed to `adminRateLimiter, adminAuth`
on all 6 routes, matching how the `/api/admin` prefix limiter already works
(mounted ahead of the route handlers in Cycle 006). If a future instruction
touches middleware ordering on these routes, this is the thing to get right.

**Verification:** all five code-level acceptance criteria met (grep-confirmed
exact placement, zero leaks onto the two public routes). The sixth - live
verification that `/api/auth/users` actually returns 401 + ratelimit headers
in production - needs this deployed first. I'll run it the same way as every
prior cycle: once committed and pushed.

**What's needed from you:** confirmation to commit (then push, then I'll live-verify and report back).