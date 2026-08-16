## KIMI DESIGN (Current)

# INSTRUCTION 003: Document adminAuth vs adminMiddleware

**Background:** Two admin auth functions exist in elimux-backend/src/middleware/auth.ts. They may enforce different rules. This is a security risk.

**Task 1 — Read both functions:**
Open elimux-backend/src/middleware/auth.ts. Read adminAuth and adminMiddleware in full.

**Task 2 — Add JSDoc:**
Above adminAuth, add:
/**
 * adminAuth — async admin authentication
 * Used by: routes/auth.ts (GET /users, PATCH /users/:id/role, etc.)
 * Checks: [Claude fills in what this actually checks]
 * Returns: [Claude fills in return type and behavior on failure]
 */

Above adminMiddleware, add:
/**
 * adminMiddleware — sync admin authentication
 * Used by: [Claude lists routes that use this]
 * Checks: [Claude fills in what this actually checks]
 * Returns: [Claude fills in return type and behavior on failure]
 */

**Task 3 — Flag differences:**
If they enforce different things, add above the stricter one:
// SECURITY NOTE: adminAuth and adminMiddleware are NOT interchangeable.
// Replacing one with the other would change access control.

**Task 4 — Build check:**
Run npm run build in elimux-backend. Must pass with zero errors.

**Acceptance Criteria:**
- [ ] Both functions have JSDoc comments
- [ ] JSDoc accurately describes what each function checks
- [ ] If different, SECURITY NOTE comment added
- [ ] npm run build passes in elimux-backend

**Risk:** DO NOT modify the logic of either function. Only add comments.