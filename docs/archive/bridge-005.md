## KIMI DESIGN (Current)

# INSTRUCTION 004: Unify admin authentication to single middleware

**Background:** Cycle 004 found that adminMiddleware (26 routes) and adminAuth (4 routes) enforce different rules. A user with a valid Supabase admin JWT can access /api/admin/users but gets 403 on /api/admin/scholarships. This is broken.

**Decision:** Migrate all admin routes to use adminAuth exclusively. adminMiddleware will be deprecated.

**Task 1 — Verify adminAuth behavior:**
Open elimux-backend/src/middleware/auth.ts. Read adminAuth fully. Confirm it:
1. Checks x-admin-key header first
2. Falls back to validating Supabase JWT
3. Checks admin_users or user_roles table for admin flag
4. Returns 401 on failure (not 403)

**Task 2 — Replace adminMiddleware with adminAuth:**
In every file that imports and uses adminMiddleware, replace with adminAuth.
Run: grep -r "adminMiddleware" elimux-backend/src/ --include="*.ts"
Replace all matches with adminAuth.

**Task 3 — Update adminAuth if needed:**
If adminAuth does not currently support x-admin-key (only JWT), add x-admin-key support so scripts and cron jobs still work. Check order:
1. x-admin-key === process.env.ADMIN_KEY → pass
2. Valid Supabase JWT + admin role in DB → pass
3. Else → 401

**Task 4 — Remove adminMiddleware:**
Once all routes use adminAuth, delete adminMiddleware from middleware/auth.ts.
Add comment: // REMOVED: adminMiddleware deprecated. All admin routes now use adminAuth.

**Task 5 — Build check:**
Run npm run build in elimux-backend. Must pass with zero errors.

**Acceptance Criteria:**
- [ ] grep -r "adminMiddleware" elimux-backend/src/ returns zero matches
- [ ] All admin routes use adminAuth
- [ ] adminAuth supports both x-admin-key and Supabase JWT
- [ ] adminMiddleware deleted from middleware/auth.ts
- [ ] npm run build passes in elimux-backend

**Risk:** DO NOT modify the frontend. DO NOT change route logic — only swap the middleware import and usage.