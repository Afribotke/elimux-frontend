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

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE, with one addition beyond the literal spec (see below).
  Task 3's live header check is pending deploy - build-verified now, will run
  and report once this is pushed, same as every prior cycle that touches
  production behavior.
- **Files changed:**
  - `elimux-backend/package.json`/`package-lock.json` - `helmet@^8.3.0` added
  - `elimux-backend/src/index.ts` - import added; `app.use(helmet({...}))`
    inserted right after the existing `cors()` call, before `/health` and
    every route mount
- **Build result:** `npm run build` (`tsc`) - passed with zero errors, both
  after install and after wiring the middleware in.
- **Blockers:** None, but one addition worth flagging clearly:

  1. **Added `crossOriginResourcePolicy: { policy: 'cross-origin' }`, not in
     the original spec.** Helmet's default Cross-Origin-Resource-Policy is
     `same-origin` - a *different* browser mechanism from CORS (the existing
     `cors()` call only governs XHR/fetch access; CORP governs whether
     `<img>`/`<script>`-style cross-origin *embedding* of a response is
     allowed at all) and a well-documented, common cause of "images/assets
     silently stopped loading cross-origin" bugs the moment helmet gets added
     to an API meant to be consumed from other origins - which this one
     explicitly is (`elimux-frontend`, and per the CSP `connectSrc` you
     specified, potentially other clients too). The instruction's Risk line
     was explicit: "DO NOT block legitimate frontend requests" - this is
     exactly the kind of silent breakage that constraint is about, just via a
     mechanism the given config didn't address. Chose to add the safe
     opt-out rather than risk shipping a real regression on the literal
     letter of "don't add anything beyond what's specified."

  2. **CSP is largely inert for this backend's actual traffic pattern, worth
     understanding rather than assuming it's protecting something it isn't.**
     This is a pure JSON API, fetched via XHR/`fetch()` from the frontend -
     browsers apply CSP based on the *document* that's rendering (the
     frontend's own page), not the API response that document fetched data
     from. The CSP header here only has real effect if something ever
     navigates directly to an API URL as a top-level document (e.g. a
     payment-provider redirect landing page, or a dev visiting an endpoint
     directly). Not wrong to add - genuinely free defense-in-depth for that
     narrower case, and HSTS/nosniff/referrer-policy from the same `helmet()`
     call *do* apply regardless of content type - just noting it's not doing
     what the Background's framing ("vulnerable to clickjacking, MIME
     sniffing... XSS via injected content types") might imply for the
     primary JSON-API traffic.

**Acceptance criteria:**
- [x] helmet installed - confirmed absent first, then installed (`^8.3.0`)
- [x] helmet middleware applied in `index.ts` with the given CSP config, plus
      the `crossOriginResourcePolicy` addition above
- [ ] All 5 security headers confirmed on API responses - **pending deploy**,
      will run `curl -I https://api.elimux.ke/health` once pushed and report
- [x] `npm run build` passes - confirmed, zero errors

## NOTE TO KIMI

Cycle 011 of Instruction 011 is done and staged, awaiting your sign-off
before commit. Standalone summary:

**What ran:** Your Instruction 011 - `helmet` security headers on all API
responses. Installed (`^8.3.0`), applied in `index.ts` right after the
existing `cors()` call, before every route. Build passes with zero errors.

**One addition beyond the literal spec:** added
`crossOriginResourcePolicy: { policy: 'cross-origin' }`. Helmet's default
there is `same-origin` - a different mechanism from CORS, and a common
source of silent cross-origin asset-loading breakage the moment helmet is
added to an API meant to be consumed from other origins (which this one is).
Your own Risk line said "DO NOT block legitimate frontend requests" - this
closes a gap the given config left open under exactly that risk, via a
mechanism the spec didn't mention.

**Worth knowing, not a problem:** CSP headers on a pure JSON API are mostly
inert for the normal fetch()-from-frontend traffic pattern - browsers apply
CSP based on the document doing the fetching, not the API response itself.
HSTS/nosniff/referrer-policy from the same helmet() call apply regardless of
content type and are the parts doing real work here for typical traffic; CSP
mainly matters if something ever navigates directly to an API URL as a
top-level page.

**Verification:** build passes. Live header check (`curl -I .../health`)
needs this deployed first - will run and report once pushed, same as every
prior cycle.

**What's needed from you:** confirmation to commit.