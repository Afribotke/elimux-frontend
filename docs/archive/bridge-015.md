===START===

## KIMI DESIGN (Current)

# INSTRUCTION 015: Generate Technical Blueprint for ElimuX Bursary Engine

**Background:** The Bursary Engine is a tenant-aware, white-label, modular platform for education funding. It lives alongside the existing ElimuX scholarship discovery platform. The domain `bursary.elimux.ke` is configured on Vercel and generating SSL. We build tenant-aware from day one but launch with 1 provider.

**Task 1 — Read the full blueprint:**
Read the file at `elimux-frontend/docs/ELIMUX_BURSARY_ENGINE_BLUEPRINT_v2_TENANT_AWARE.md` (or the version provided by the user). This contains the complete specification.

**Task 2 — Generate the Technical Blueprint Document:**
Create `elimux-frontend/docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md` with the following sections. Do NOT write code. Only architecture, data models, API specs, and implementation logic.

**Required Sections:**

### Section 1: System Architecture
- Diagram: Vercel (frontend) → Railway (backend) → Supabase (database)
- Tenant resolution flow: subdomain → middleware → database query
- Module activation check flow
- Request lifecycle: DNS → Vercel → Next.js → API route → Railway → Supabase

### Section 2: Database Schema (SQL)
Write complete CREATE TABLE statements for:
- `tenants` (root multi-tenant table)
- `tenant_domains` (custom domain support)
- `tenant_branding` (white-label configuration)
- `user_tenant_roles` (user-role per tenant)
- `bursary_providers` (extends tenants)
- `bursary_funds` (funding opportunities)
- `bursary_applicants` (student profiles)
- `bursary_applications` (application lifecycle)
- `bursary_documents` (uploaded documents with forensics)
- `bursary_disbursements` (immutable ledger)
- `bursary_fraud_registry` (cross-tenant hashed identifiers)
- `bursary_module_configs` (per-tenant module settings)
- `tenant_billing` (subscription and usage tracking)
- `mpesa_transactions` (payment records, tenant-scoped)

Include:
- All columns with types and constraints
- Foreign keys
- Indexes for performance
- RLS policies (tenant-scoped)
- Comments on complex fields

### Section 3: Backend API Specification
List every endpoint with:
- HTTP method and path
- Authentication requirement
- Module check (which module ID is required)
- Request body schema (JSON structure)
- Response schema (success and error)
- RLS enforcement point

Cover all categories:
- Tenant management
- Provider onboarding
- Fund CRUD
- Student application (self-service)
- School-mediated application
- Document upload and forensics
- Institution verification
- Government verification
- Provider review and allocation
- Disbursement (M-Pesa, bank, external)
- AI services (eligibility preview, document analyze, chat, fraud check, allocation suggest)
- Public transparency
- Fraud and admin
- Offline sync

### Section 4: Frontend Architecture
- Next.js App Router structure
- Tenant context provider (subdomain resolution, branding injection)
- Module gating (hide UI if module not active)
- Shared components with ElimuX (auth, layout, navigation)
- New components: Bursary discovery, Application wizard, Document upload, Status tracker, Provider dashboard, Admin fraud panel

### Section 5: Tenant Resolution Implementation
- Express middleware: `resolveTenant()` function
- Subdomain extraction from `Host` header
- Custom domain resolution via `tenant_domains` table
- Fallback to `x-tenant-id` header
- Setting Postgres `app.current_tenant_id` for RLS
- Error handling: 404 if tenant not found or inactive

### Section 6: Module System Implementation
- Module registry: array of module IDs and metadata
- `requireModule()` middleware factory
- Per-tenant activation check
- Module settings injection into requests
- Frontend module gating: `useModule()` hook

### Section 7: White-Label Implementation
- Dynamic CSS variable injection (`--tenant-primary`, `--tenant-secondary`, `--tenant-font`)
- Meta tag generation per tenant
- Favicon swap
- Email template customization (Handlebars/MJML)
- SMS template customization
- Public page generation per tenant

### Section 8: Integration Points
- How Bursary Engine shares existing ElimuX infrastructure:
  - Supabase auth (same users table)
  - Supabase storage (new bucket: `bursary-documents`)
  - Railway backend (new routes under `/api/bursary/*`)
  - Vercel frontend (new pages under `/bursary/*` and tenant subdomains)
  - PWA service worker (add bursary routes to cache)
  - M-Pesa service (reuse existing `mpesa.ts`)
  - Notification system (new templates for bursary events)

### Section 9: Security & Compliance
- RLS policy patterns for tenant isolation
- Cross-tenant fraud registry (hashed identifiers only)
- Data minimization per tenant
- Kenya Data Protection Act compliance
- GDPR alignment
- Audit logging strategy
- Secrets management (env vars per module)

### Section 10: Implementation Phases
- Phase 1 (Weeks 1-4): Foundation — single tenant, core modules, M-Pesa disbursement
- Phase 2 (Weeks 5-8): Intelligence — AI modules, bank transfer, government verification
- Phase 3 (Weeks 9-12): Scale — multi-country, third-party verification, impact analytics
- Phase 4 (Weeks 13-16): Ecosystem — alumni giving, mentorship, USSD, crowdfunding

For each phase, list:
- Tables to create
- API endpoints to implement
- Frontend pages to build
- Modules to activate
- Testing milestones

### Section 11: Performance & Scaling
- Database indexing strategy
- Query optimization for tenant-scoped data
- CDN configuration for tenant assets (logos, CSS)
- Rate limiting per tenant
- Caching strategy (Redis/Railway memory for tenant configs)
- File upload optimization (compression, virus scan hooks)

### Section 12: Deployment & DevOps
- Vercel wildcard domain configuration (`*.bursary.elimux.ke`)
- Railway service configuration (same backend, new routes)
- Supabase migration strategy (flat files in `elimux-sql/`)
- Environment variables checklist
- CI/CD pipeline (GitHub Actions)
- Monitoring and alerting (Railway logs, Supabase metrics)

**Task 3 — Validate completeness:**
After writing the document, verify:
- [ ] Every table from the v2 blueprint has a CREATE TABLE statement
- [ ] Every API endpoint from the v2 blueprint is listed with full spec
- [ ] `tenant_id` appears on every tenant-scoped table
- [ ] RLS policies enforce tenant isolation
- [ ] Module checks are specified for every module-gated endpoint
- [ ] White-label configuration is fully specified
- [ ] Integration with existing ElimuX is documented
- [ ] No code blocks (only SQL DDL, JSON schemas, and pseudocode)

**Task 4 — Save and commit:**
Save the document to `elimux-frontend/docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md`.
Run `npm run build` in `elimux-frontend` to verify the document doesn't break anything (it shouldn't, but check).
Commit: `git add docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md && git commit -m "cycle-015: add technical blueprint for bursary engine" && git push origin main`.

**Acceptance Criteria:**
- [ ] Technical blueprint document created at `elimux-frontend/docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md`
- [ ] All 12 sections are present and complete
- [ ] SQL DDL is valid PostgreSQL syntax
- [ ] API specs are complete enough for implementation
- [ ] No actual implementation code (only architecture and specs)
- [ ] Document is committed and pushed to GitHub
- [ ] `npm run build` passes in elimux-frontend

**Risk:** DO NOT write any implementation code (React components, API route handlers, business logic). This is a blueprint-only cycle. DO NOT modify existing ElimuX code. DO NOT create new backend files. Only create the markdown specification document.

===END===
