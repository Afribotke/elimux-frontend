===START===

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

===END===