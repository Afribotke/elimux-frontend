# Cycle 170 — Raw Command Output Inventory

Date: 2026-09-06
Working dir confirmed: `C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend`

## 2.1 — git status

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   docs/archive/bridge-121.md
  modified:   docs/bridge.md
  modified:   src/app/globals.css
  modified:   supabase/migrations/20260829000001_pathways_schema.sql

Untracked files:
  docs/archive/bridge-123.md ... bridge-167d-anomalous-coming-soon-gate.md, bridge-170.md (48 archive files total, all historical bridge snapshots)
  public/elimux-complete-image-inventory.pdf
  public/og-image-solid-bg.png
  public/previews/ (favicon-preview.png, logo-assets-preview.png)
  public/table-1787829636220.csv
  public/table-1787829673294.csv
  public/test-pathways.html
  src/app/api/guidance/validate/route.ts
  src/app/api/kjsa/analyze/route.ts
  src/app/api/og/pathway/route.tsx
  src/app/api/pathways/interpret/route.ts
  src/app/api/schools/match/route.ts
  src/app/pathways/results/PathwayResultsClient.tsx
  src/components/admin/InstitutionDetailDrawer.tsx
  src/components/pathways/ShareResults.tsx
  src/lib/pathways-pdf.ts
  supabase/migrations/20260829000002_pathways_rls_fix.sql
  supabase/seeders/pathways_subject_combinations_seed.sql
```

## 2.2 — Modified files (names only)

```
docs/archive/bridge-121.md
docs/bridge.md
src/app/globals.css
supabase/migrations/20260829000001_pathways_schema.sql
```

## 2.3 — Diff stats

```
 docs/archive/bridge-121.md                         | 894 +++++++++++++++++++--
 docs/bridge.md                                     | 295 +++----
 src/app/globals.css                                |  23 +
 .../migrations/20260829000001_pathways_schema.sql  |   4 +
 4 files changed, 1003 insertions(+), 213 deletions(-)
```
(`docs/bridge.md`'s own diff stat is inflated by this cycle's normal live-protocol traffic —
brief overwritten by report, report overwritten by addendum, addendum overwritten by Kimi's
Cycle 170 brief. Not "uncommitted work" in the code sense.)

## 2.4 — Untracked files (full list, 64 entries)

48 are historical `docs/archive/bridge-NNN.md` snapshots that were apparently never committed
(bridge-123 through bridge-167d, plus this cycle's own bridge-170.md) — see Section F, these are
pure documentation/history, zero code risk. The remaining 16 non-archive untracked entries:

```
public/elimux-complete-image-inventory.pdf
public/og-image-solid-bg.png
public/previews/favicon-preview.png
public/previews/logo-assets-preview.png
public/table-1787829636220.csv
public/table-1787829673294.csv
public/test-pathways.html
src/app/api/guidance/validate/route.ts
src/app/api/kjsa/analyze/route.ts
src/app/api/og/pathway/route.tsx
src/app/api/pathways/interpret/route.ts
src/app/api/schools/match/route.ts
src/app/pathways/results/PathwayResultsClient.tsx
src/components/admin/InstitutionDetailDrawer.tsx
src/components/pathways/ShareResults.tsx
src/lib/pathways-pdf.ts
supabase/migrations/20260829000002_pathways_rls_fix.sql
supabase/seeders/pathways_subject_combinations_seed.sql
```

## 2.5 — Staged but not committed

```
(empty)
```

## 2.6 — Last 15 commits

```
4c5e6dd docs: flag bridge-121.md anomaly to Kimi - unexecuted Pathways-001 brief in wrong archive slot
df6d24c docs: Cycle 169 - confirm live deploy verification in bridge.md
1a306d6 Cycle 169: Fix live favicon caching and restore Senior Schools homepage card
fc67f8f feat(crm): Cycle 167 — unified CRM admin UI, navigation, dashboard, templates, contact detail, send modal
e9e62c3 feat(crm): Phase 3 — Africa's Talking SMS integration, email-first router, sandbox warning
f24ace8 docs: AI search location intelligence cycle 157 - live deploy verification, production test report to Kimi
2c57cfa feat: AI search location badge - show detected county/town, location-aware empty state
fe4a049 Cycle 154 — Add DEMO markers to DTB Academy module
72b74c7 Fix: enable RLS on app_config (DTB Academy migration gap)
6d3a651 Cycle 153 — DTB Academy homepage banner replaces sponsor section
4a7bf38 Cycle 152 — DTB Academy financing module (demo)
6b5efef fix: nav bar didn't update immediately after login (race, not a session bug)
e0b3f1e fix(pwa): route same-origin /api/* through networkFirst, not cacheFirst
1234520 diag: surface swallowed errors + debug info on schools/selections and pathway-recommendations
d88a1f9 fix: pathway-recommendations returned 0 schools due to NOT IN (NULL) SQL gotcha
```

## 2.7 — Stashes

```
stash@{0}: On main: pre-theme-sweep-backup
stash@{1}: WIP on main: ab08219 feat: Add institution onboarding portal
```

`stash@{0}` diff-stat: `package-lock.json` (+922), `package.json` (+2), `src/app/layout.tsx` (25
lines), `src/components/DesktopNav.tsx`, `src/components/MobileNav.tsx`, `src/components/ThemeToggle.tsx`
(-18, deleted), `src/lib/theme.ts` (-60, deleted). Touches `layout.tsx` — the same file Cycle 169
just modified — popping this stash today would very likely conflict.

`stash@{1}` diff-stat: `src/components/ReviewCard.tsx` (+6/-6), `src/components/ReviewForm.tsx`
(+18/-2). Tiny. Per [[project_elimux_reviewcard_fix]] memory, ReviewCard was already fixed and
shipped in a later, different commit (2026-07-19) — this stash likely predates and is superseded
by that fix.

## 2.8 — Branches

```
  auth-hardening-preview    a95ea08 Cycle 042/043: OAuth callback hardening + browser-close session expiry + auth guard hardening
  auth-security-preview     d35fcbb Cycle 046: harden login page async calls, diagnostic report
  feat/admin-pricing-portal 60e6765 feat(admin-pricing-portal): founder pricing portal frontend (P4 Package 1)
  feat/elimux22-ad-billing  516047e Fix placement IDs to match live ad_slots
  feat/elimux23-payments    715aad6 Add phase 23 frontend: partner portal, self-serve ads, RBAC, semantic search, GDPR pages
  feat/skolex-ads           2bc7c49 Add pause control to FeaturedCarousel (closes spec gap: auto-rotate + arrows + pause)
  feat/skolex-home          09827c6 feat(skolex-home): P1 homepage hero port behind NEXT_PUBLIC_FEATURE_SKOLEX_HOME
  feat/skolex-reference     7872108 Add Skolex design-token reference (§11 harvest inventory)
  feature/internship-module ea43746 Add internship module: student browsing/applications, employer vacancy management, gamification, certificates, NITA oversight, admin tooling
  feature/skills-toggle     53d1868 feat(ai-search): University/Skills & Trades toggle UI + placeholder modes
* main                      4c5e6dd docs: flag bridge-121.md anomaly to Kimi - unexecuted Pathways-001 brief in wrong archive slot
```

10 stale feature branches, all behind `main` by a large margin (oldest-looking: `auth-hardening-preview`,
`auth-security-preview` from the Cycle 042-046 era). Not evaluated for merge-worthiness this cycle
(out of scope — this audit covers the working tree, not branch archaeology) but flagged for
Section F.

## 2.9 — status --short

(identical set to 2.1, short form — omitted here to avoid duplication)

## 3.1 — Migration files (sorted)

```
20260829000001_pathways_schema.sql   (tracked, MODIFIED — 4 uncommitted lines added: RLS enable + policy for kjsa_performance_levels and pathway_kjsa_requirements)
20260829000002_pathways_rls_fix.sql  (UNTRACKED — new file, never committed)
20260830000001_school_discovery_schema.sql  (tracked, clean — no working-tree changes)
999_dtb_academy_demo.sql             (tracked, clean)
999a_dtb_academy_app_config_rls_fix.sql  (tracked, clean)
```

Important caveat for Section E: this directory is NOT the source of truth for what's actually
been run against production. Per [[reference_elimux_sql_migrations]], most of this project's real
schema changes (all the CRM tables from Cycles 158-167, for example) were executed directly via
the Supabase MCP tool / SQL Editor and never saved as a migration file here at all. So "migration
file exists" and "migration file absent" both say nothing reliable about live DB state on their
own.

## 3.2 — Supabase CLI migration list

```
npm warn exec supabase@2.116.0 not found, installing...
{"_tag":"Error","error":{"code":"LegacyProjectNotLinkedError","message":"Cannot find project ref. Have you run supabase link?"}}
```

CLI not configured/linked in this working copy — skipped per the brief's own fallback instruction.
Applied-vs-pending status for any migration file in this repo cannot be determined from the CLI;
would need a direct query against the live project (`ohlgjvenwekpbpkykutz`) via the Supabase MCP
tools to check table/policy existence, which this cycle's "no modification" scope doesn't cover
(read-only `execute_sql` checks would be safe but weren't run — flagging as a Section F carry-forward
rather than assuming).

## 4.1-4.3 — Recently modified source files (14-day window, mtime-sorted)

Full raw listing captured during the session (150+ files — most are already-committed files
whose mtime simply reflects the last `git pull`/checkout, not real uncommitted work; cross-referenced
against git status in Section 5 below rather than reproduced in full here to avoid a
150-row wall of mostly-clean files). Genuinely recent, feature-clustered mtimes worth noting:
- 2026-09-06 (today): `NewHomePage.tsx`, `layout.tsx` (Cycle 169, committed), `crm-api.ts` +
  4 admin/crm page.tsx files + `SendMessageModal.tsx` + `CRMActingUserContext.tsx` + `admin/layout.tsx`
  (Cycle 167, already committed — mtime reflects this session's earlier build/verify pass touching
  them, not new edits)
- 2026-09-05: `api/crm/webhook/africastalking`, `track-click`, `track-open` (Cycle 160/Phase 3, committed)
- 2026-09-04: `ai-search/page.tsx`, `aiSearch.ts` (Cycle 155-157, committed)
- 2026-08-29 through 2026-08-31: the entire Career Pathways + School Discovery cluster (see
  Section D) — mix of committed (Aug 30 pages/routes) and still-uncommitted (Aug 29 PDF/share/
  analyze/match/interpret files) work from the same multi-day build window

## 5.1 — Career Pathways

Pages found under `src/app`: `pathways/` (layout, page, wizard/page, select/page, results/page —
all 5 tracked/committed), plus `pathways/results/PathwayResultsClient.tsx` (untracked).
API routes found matching `*pathway*`: none directly named `*pathway*route.ts` other than
`api/schools/pathway-recommendations/route.ts` (tracked) — the core pathway CRUD routes are named
`api/pathways/route.ts` and `api/pathways/select/route.ts` (both tracked) plus
`api/pathways/interpret/route.ts` (untracked).
Components matching `*pathway*`: `src/components/pathways/` (contains only `ShareResults.tsx`,
untracked), `src/components/CareerPathway.tsx` (tracked), `src/components/schools/pathway-recommendations.tsx` (tracked).
RLS migration exists: **True** (`20260829000001_pathways_schema.sql`, tracked but with 4
uncommitted lines).

## 5.2 — School Placement / Document Vault

Only match: `src/app/university/placements/page.tsx` (tracked, committed). No `*vault*` match
anywhere. This looks like an existing, already-shipped feature, not a pending one — no "Document
Vault" feature appears to exist in this codebase under any name.

## 5.3 — CRM Outreach

`src/app/admin/crm/*` (4 pages + layout), `src/app/api/crm/*` (3 routes), `src/components/crm/*`
(2 components), `src/lib/crm-api.ts` — **all tracked, all committed, zero uncommitted changes**.
Confirms Cycles 167/167B/167C's own reports. Older/adjacent outreach infrastructure also found,
all tracked: `src/app/admin/employers/outreach/*` (4 pages), `src/app/admin/scraper/*` (3 pages),
`src/app/admin/tveta-scraper/page.tsx`.

## 5.4 — PWA Auto-Update

`public/sw.js`, `src/components/PWACleanupBanner.tsx`, `src/components/PWAUpdateToast.tsx`,
`src/hooks/usePWAUpdate.ts`, `src/lib/pwaDevice.ts`, `src/lib/pwaQueue.ts` — **all tracked,
all committed, zero uncommitted changes**.

## 5.5 — Location Intelligence (Cycles 155-157)

Zero filename matches for `*location*` or `*constituency*` anywhere under `src`. This is expected,
not a gap: per [[project_elimux_ai_search_location]], the frontend half of this feature lives
inside `src/lib/aiSearch.ts` and `src/app/ai-search/page.tsx` (both tracked, committed, confirmed
live 2026-09-04) rather than in a dedicated location-named file; the extraction logic itself is in
the *backend* repo (`locationExtractor.ts`), out of this audit's scope (frontend-only).

## 5.6 — AI Search

18 matches under `src`, spanning `app/ai-search`, `app/search`, `app/admin/searches`,
`app/api/schools/search`, and assorted components/hooks/lib files — **all tracked, all committed,
zero uncommitted changes** (cross-checked each against `git status`).

## 5.7 — Senior Schools (Cycle 169) sanity check

```
git log --oneline --all -- src/components/home/NewHomePage.tsx
1a306d6 Cycle 169: Fix live favicon caching and restore Senior Schools homepage card
6d3a651 Cycle 153 — DTB Academy homepage banner replaces sponsor section
bd5b96f feat: add PWA share button to navbar, homepage, and footer

git log --oneline --all -- src/app/layout.tsx
1a306d6 Cycle 169: Fix live favicon caching and restore Senior Schools homepage card
f76fb01 feat: PWA auto-update + identity lock (Cycles 049-050)
af1eec9 feat: update OG social share image with branded banner
```

Confirmed: Cycle 169 IS committed (`1a306d6`) and — per this same session's earlier work — pushed,
deployed, and live-verified via `vercel inspect` + a direct curl of production.
