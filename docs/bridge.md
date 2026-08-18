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

## CLAUDE EXECUTION (Current)

**Status: COMPLETE** (Tasks 1–3 fully executed; Task 4's commit/push deliberately not run — staged only, awaiting explicit confirmation per rule 13, consistent with every prior code/doc-touching cycle).

**Task 1 (read the blueprint):** The file did not exist at the path the instruction named (`elimux-frontend/docs/ELIMUX_BURSARY_ENGINE_BLUEPRINT_v2_TENANT_AWARE.md` — confirmed absent via search of both repos). Found instead as PDFs in `~/Downloads/`: `ELIMUX_BURSARY_ENGINE_BLUEPRINT_v2_TENANT_AWARE.pdf` and `ELIMUX_BURSARY_ENGINE_BLUEPRINT.pdf` (v1.0). Both read in full via `pdftotext -layout` (v2: 1227 lines / 20 sections; v1: 2054 lines / 16 sections) — v2 explicitly defers to v1 for §7–17 detail ("identical to v1 blueprint"), so both were required, not just the one the instruction named.

**Task 2 (generate the document):** Written to `elimux-frontend/docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md`, all 12 required sections present. Grounded against the live repos rather than the source PDFs' assumptions alone — verified via direct grep/read, not carried over from memory: `elimux-sql`'s real flat-numbered migration convention (highest file today is `43_...`, no `migrations/` folder), `adminAuth` as the single live admin-auth function (Cycle 005 deleted the old `adminMiddleware`), zero pre-existing tenant/module code anywhere in either repo (confirmed greenfield, no naming collisions to resolve on that front), the real state of M-Pesa (`routes/payments-mpesa.ts` is a 501 stub, no `lib/mpesa.ts` exists, `mpesa_transactions` doesn't exist as a table — Cycle 013's full M-Pesa proposal remains BLOCKED/unshipped), the real storage-bucket pattern (`scholarship-documents`: private, 5MB cap, `{userId}/...` RLS path-scoping — mirrored for the new `bursary-documents` bucket rather than inventing a new convention), and the real `user_roles` table shape (global admin flag, no `tenant_id` column — contradicts the v2 source's own §4.6 claim that `user_roles` is "scoped by tenant_id"; that claim is incorrect against live schema and was not carried into the output).

**Three corrections made, all flagged inline in the document itself (not silently resolved):**
1. **Table-name collision, deliberately renamed:** Task 2 asks for a table literally named `mpesa_transactions`. Cycle 013's still-BLOCKED, unshipped instruction already proposed a table with that exact name for a *different* (scholarship-subscription) M-Pesa flow. Named the new one `bursary_mpesa_transactions` instead, so the two pending proposals don't collide regardless of which ships first.
2. **`user_roles` claim corrected:** the v2 source's §4.6 says the existing `user_roles` table is "scoped by tenant_id" — false against live schema (it has no `tenant_id` column, it's a global admin/super_admin flag). The blueprint's actual per-tenant-role table, `user_tenant_roles` (already fully specced in v2 §4.7), is what's used for tenant-scoped roles; `user_roles` is documented as untouched.
3. **Billing processor flagged, not assumed:** the v2 source specs `stripe_customer_id`/`stripe_subscription_id` on `tenant_billing`. Live ElimuX's actual subscription billing runs on Paystack (`STRIPE_SECRET_KEY` exists in env but no evidence it's wired to any live route). Renamed the columns to Paystack equivalents and flagged this as an open product question for founder/Kimi rather than silently keeping unused Stripe fields.

**Scope addition beyond Task 2's literal 14-table list:** added a 15th table, `bursary_audit_logs`, because Task 3's own acceptance criterion ("every table from the v2 blueprint has a CREATE TABLE statement") is broader than Task 2's explicit list — the v2 source's §4.6 also names `bursary_audit_logs` as tenant-required, and Section 9's audit-logging requirement is unfulfillable without a backing table. Flagged explicitly in the document (§2.15) rather than silently expanding scope. Also documented (not created as new tables) the two existing tables the v2 source says need `tenant_id` added later — `payments` (Paystack) and, conditionally, `scholarship_messages`.

**Section 5/6 code-block correction:** the source PDFs' §2.3/§2.4/§5.4 (v2) and §2.3 (v1) content is TypeScript. Per Task 3's explicit acceptance criterion ("No code blocks — only SQL DDL, JSON schemas, and pseudocode"), these were rewritten as algorithm-description pseudocode in the output document, not copy-pasted from the source PDFs.

**Task 3 (completeness validation):** All eight checklist items verified and individually justified at the bottom of the output document, not just checked off — including where the literal 14-table Task 2 list and the broader Task 3 wording actually disagreed (resolved via the `bursary_audit_logs` addition above, not by picking one instruction over the other silently).

**Task 4 (save, build, commit):**
- Saved: `elimux-frontend/docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md` ✅
- `npm run build` in `elimux-frontend`: **PASSED**, exit code 0, zero errors, full static/dynamic route manifest generated normally — the new doc-only file has no effect on the Next.js build (expected, since it's markdown outside `src/`).
- Commit/push: **NOT RUN**, deliberately. Staged for commit (`docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md`, `docs/bridge.md`) but not committed or pushed — matches the standing pattern from every prior cycle in this project ("awaiting explicit confirmation per rule 13") and this session's own instruction to never commit without being explicitly asked.

**Files touched this cycle:** `elimux-frontend/docs/TECHNICAL_BLUEPRINT_BURSARY_ENGINE.md` (new), `elimux-frontend/docs/archive/bridge-015.md` (new, archive snapshot of the KIMI DESIGN executed this cycle), `elimux-frontend/docs/bridge.md` (this CLAUDE EXECUTION section). No backend files created or modified, no existing ElimuX code touched, no live database changes — all consistent with the Risk constraint.

**Untracked files noticed but not touched (pre-existing, not from this cycle):** `docs/ELIMUX_MASTER_RUNBOOK.docx`, `docs/ELIMUX_MASTER_RUNBOOK (1).docx`, `docs/ELIMUX_MASTER_RUNBOOK.pdf`, `docs/bridge-backup-20260816.md` — flagged for awareness only, out of scope for this cycle's Risk constraint.

## NOTE TO KIMI

Three real open decisions surfaced while grounding this blueprint against live code — none resolved unilaterally, all need founder/Kimi sign-off before implementation starts:

1. **M-Pesa is not "reuse existing `mpesa.ts`"** — it doesn't exist. `routes/payments-mpesa.ts` is a 501 stub, and Cycle 013's full M-Pesa implementation (`lib/mpesa.ts`, disbursement routes, a `mpesa_transactions` table) is still BLOCKED pending your decision on that cycle's own flagged issues. The Bursary Engine's M-Pesa disbursement (Phase 1's headline payment method) has a real dependency on Cycle 013 finally shipping — or a Bursary-Engine-specific M-Pesa build happening first instead. Worth deciding which order these ship in.
2. **Billing processor:** `tenant_billing` in the v2 source specs Stripe fields; live billing runs on Paystack. Confirm whether Bursary Engine subscription billing should reuse the existing Paystack subscriber flow (`subscribers`/`subscriptions` tables) or needs its own integration — the blueprint currently assumes Paystack reuse but flags this as unconfirmed.
3. **`scholarship_messages` reuse for bursary communication** is only conditionally mentioned in the v2 source itself ("if used for bursary communication") — worth an explicit yes/no before implementation, since adding `tenant_id` to a table that also serves the unrelated scholarship-messaging feature is a real schema change with its own blast radius.

Also flagged in the document but lower-stakes: Resend's `elimux.ke` domain is still unverified account-wide (blocks every bursary transactional email regardless of how well the code is written), and no SMS provider (Twilio/Africa's Talking) has been chosen yet — both are Phase 1 blockers independent of anything in this blueprint cycle.