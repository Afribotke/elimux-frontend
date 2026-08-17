## KIMI DESIGN (Current)

# INSTRUCTION 011: Add security headers to all API responses

**Background:** The backend currently sends no security headers. This leaves the API vulnerable to clickjacking, MIME sniffing attacks, and XSS via injected content types.

**Task 1 — Install helmet:**
In elimux-backend, check if helmet is installed. Run: grep '"helmet"' package.json
If absent, run: npm install helmet
Then run: npm run build to verify.

**Task 2 — Apply helmet with custom config:**
In elimux-backend/src/index.ts, after the Express app is created but before routes are mounted, add:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.elimux.ke"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
Task 3 — Verify headers on a test request:
Run: curl -I https://api.elimux.ke/health
Confirm these headers are present:
content-security-policy
x-frame-options
x-content-type-options
referrer-policy
strict-transport-security
Task 4 — Build check:
Run npm run build in elimux-backend. Must pass with zero errors.
Acceptance Criteria:
[ ] helmet installed (or confirmed present)
[ ] helmet middleware applied in index.ts with custom CSP config
[ ] All 5 security headers confirmed on API responses
[ ] npm run build passes in elimux-backend
Risk: DO NOT block legitimate frontend requests. The CSP connectSrc must include https://*.supabase.co and https://api.elimux.ke. If the frontend uses other external APIs, add them to connectSrc.