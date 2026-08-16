===START PASTE HERE===

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
===END PASTE HERE===