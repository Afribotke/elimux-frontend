# CYCLE 170 AUDIT REPORT — Uncommitted Work Inventory

## Date: 2026-09-06
## Auditor: Claude
## Excluded: DTB Academy, KASNEB Onboarding

---

## SECTION A: GIT STATUS SUMMARY

- Working tree clean? **NO**
- Modified (tracked) files count: **4**
- Untracked files count: **64** (48 are historical `docs/archive/bridge-NNN.md` snapshots — pure
  docs, zero code risk; 16 are real code/asset files)
- Staged files count: **0**
- Stashes present: **YES** — 2 (`stash@{0}: pre-theme-sweep-backup`, `stash@{1}: WIP on main:
  ab08219 feat: Add institution onboarding portal`)

---

## SECTION B: MODIFIED FILES (with diff stats)

| File | Lines Changed | Feature | Verdict | Notes |
|------|--------------|---------|---------|-------|
| `docs/archive/bridge-121.md` | +894/edited | Bridge protocol / Career Pathways brief | **AWAITING KIMI** | Working tree has overwritten a real archived Cycle 045 report with a different, unrelated "Pathways-001-Corrected" build spec — flagged to Kimi in the prior cycle's addendum (see `docs/archive/bridge-170.md`, i.e. this cycle's own brief, which didn't yet answer it). Not resolving unilaterally — no verdict from the COMMIT/STASH/DISCARD/FINISH/ARCHIVE set fits until Kimi confirms whether the spec is real. |
| `docs/bridge.md` | +295/-213 | Bridge protocol (live file) | N/A | This *is* the live protocol file itself — not application work. Will be overwritten again once this report is pasted in per normal cycle flow. |
| `src/app/globals.css` | +23 | Career Pathways (PDF export print styles) | **COMMIT** | Purely additive `@media print` block (hides nav/footer, forces white background when printing). Zero risk to ship standalone — applies only when a user prints, doesn't expose any unfinished UI, and isn't gated behind the rest of the incomplete Pathways work. |
| `supabase/migrations/20260829000001_pathways_schema.sql` | +4 | Career Pathways (RLS hardening) | **FINISH — flag as possibly urgent** | Adds `ENABLE ROW LEVEL SECURITY` + a public-read policy for 2 tables (`kjsa_performance_levels`, `pathway_kjsa_requirements`) that the base migration created but never enabled RLS on. The *base* migration's tables are already referenced by committed, shipped API routes (`api/pathways`, `api/careers`, `api/kjsa`, etc. — see Section D), which strongly implies the base schema is already live in production. If so, these 2 tables may be sitting in production RIGHT NOW without RLS — a real gap, not a hypothetical one. This audit did not query the live DB to confirm (out of this cycle's read-only-file-audit scope) — flagged in Section F as the single highest-priority carry-forward item. |

---

## SECTION C: UNTRACKED FILES

| File | Feature | Verdict | Notes |
|------|---------|---------|-------|
| `docs/archive/bridge-123.md` … `bridge-167d-anomalous-coming-soon-gate.md` (46 files) + `bridge-170.md` (this cycle's own brief, archived per protocol) | Bridge protocol history | **COMMIT** | Real historical snapshots created over Cycles 123-167D per the established archive-before-overwrite protocol, apparently just never `git add`-ed along the way. Pure documentation, zero code risk — committing preserves history the protocol already assumes exists. |
| `public/elimux-complete-image-inventory.pdf` | Unclear (asset) | **DISCARD** (or confirm with founder) | Not referenced anywhere in `src`. Looks like a one-off audit deliverable, not an app asset. |
| `public/og-image-solid-bg.png` | Unclear (asset) | **DISCARD** (or confirm with founder) | Not referenced anywhere in `src`, including the unfinished `api/og/pathway/route.tsx`. Orphaned. |
| `public/previews/favicon-preview.png`, `public/previews/logo-assets-preview.png` | Rebrand preview renders | **DISCARD** | Look like one-off preview images generated during a past logo/favicon rebrand pass, not files the running app serves. |
| `public/table-1787829636220.csv`, `public/table-1787829673294.csv` | Unclear (scratch export) | **DISCARD** | Numeric-timestamp filenames strongly suggest auto-generated scratch exports, not real app data files. |
| `public/test-pathways.html` | Career Pathways (dev scratch) | **DISCARD — flag as a real risk if ever shipped** | A standalone, unauthenticated HTML test harness for the Pathways API, sitting directly in `public/` (title: "ElimuX Pathways API Test"). If this were ever accidentally committed and deployed, it would be live and publicly reachable at `/test-pathways.html`, exposing internal API test tooling. Currently harmless only because it's uncommitted. |
| `src/app/api/guidance/validate/route.ts` | Career Pathways | **FINISH** | Part of the same in-progress Pathways build as the rest of this section. |
| `src/app/api/kjsa/analyze/route.ts` | Career Pathways | **FINISH** | ditto |
| `src/app/api/og/pathway/route.tsx` | Career Pathways | **FINISH** | ditto — OG share-image generation for pathway results |
| `src/app/api/pathways/interpret/route.ts` | Career Pathways | **FINISH** | ditto |
| `src/app/api/schools/match/route.ts` | Career Pathways | **FINISH** | ditto |
| `src/app/pathways/results/PathwayResultsClient.tsx` | Career Pathways | **FINISH** | ditto — client component for the results page |
| `src/components/admin/InstitutionDetailDrawer.tsx` | Admin institutions | **DISCARD or FINISH-and-wire-up** | Not imported anywhere in the codebase (grepped `src` for the component name — only self-match). A sibling `InstitutionApplicationDrawer` already exists, tracked and committed. This looks like either an abandoned duplicate or a half-started replacement — needs a human call, not something to guess at. |
| `src/components/pathways/ShareResults.tsx` | Career Pathways | **FINISH** | ditto |
| `src/lib/pathways-pdf.ts` | Career Pathways | **FINISH** | PDF export logic — pairs with the `globals.css` print-styles change in Section B |
| `supabase/migrations/20260829000002_pathways_rls_fix.sql` | Career Pathways | **FINISH — needs live-DB check before running** | A second, never-committed migration file on top of the base schema. Given Section B's RLS finding, this may already partially or fully address that gap — needs to be read against actual current production RLS state before deciding whether to run it, supersede it, or merge it into the base migration. |
| `supabase/seeders/pathways_subject_combinations_seed.sql` | Career Pathways | **FINISH** | Seed data for the still-incomplete feature. |

---

## SECTION D: FEATURE STATUS CHECK

| Feature | Code Exists? | Committed? | Tested? | Status | Recommended Action |
|---------|-------------|-----------|---------|--------|------------------|
| Career Pathways | YES | **PARTIAL** | NO | Base schema, 5 pages, and 7 core API routes (`pathways`, `pathways/select`, `careers`, `combinations`, `kjsa`, `schools*`) are already committed and shipped (Aug 30 commits, predates this session). A *second wave* of uncommitted work sits on top: PDF export (`pathways-pdf.ts` + `globals.css` print styles), a results-sharing component, an OG-image route, and 4 more API routes (`kjsa/analyze`, `schools/match`, `pathways/interpret`, `guidance/validate`) whose route names don't match the original `Pathways-001-Corrected` spec found in `bridge-121.md` — suggesting a *later*, different, currently-unlocated brief drove this second wave. Homepage links to `/pathways` as a disabled "Coming Soon" card as of Cycle 169, specifically because this isn't ready. | Do not finish or commit until (1) Kimi confirms the `bridge-121.md` situation and (2) the source brief for the second-wave files (analyze/match/interpret/validate/OG/PDF/share) is located or re-issued — building blind against files with no known spec risks the exact kind of schema-invention bugs this bridge log has caught repeatedly before. |
| School Placement / Document Vault | **NO** ("Placement" exists as unrelated feature; "Vault" doesn't exist at all) | N/A | N/A | No feature under this name exists anywhere in the codebase. The only "placement" match is `src/app/university/placements/page.tsx`, a different, already-shipped, unrelated university-side feature. | Confirm with the founder whether "School Placement / Document Vault" is a real planned feature (in which case it hasn't been started) or a naming mix-up with something else already built. |
| CRM Outreach | YES | **YES, fully** | Backend-verified live (Cycles 167/167B/167C); UI rendering not yet human-confirmed | Zero uncommitted changes anywhere under `admin/crm`, `api/crm`, `components/crm`, or `crm-api.ts`. Matches the audit log's own account exactly. | None needed this cycle. Standing open item from Cycle 167C: someone with real admin login credentials should do one click-through pass to visually confirm the UI (blocked twice already on missing Chrome-extension connection + real session auth). |
| PWA Auto-Update | YES | **YES, fully** | Not re-verified this cycle | Zero uncommitted changes. | None. |
| Location Intelligence (Cycles 155-157) | YES (inside `aiSearch.ts`, not a dedicated file) | **YES, fully** | Live-verified per Cycle 157's own report | Zero uncommitted changes. Filename-pattern search for `*location*`/`*constituency*` correctly found nothing because the logic lives inside `lib/aiSearch.ts`, not a separately-named file — expected, not a gap. | None. |
| AI Search | YES | **YES, fully** | Live | Zero uncommitted changes across all 18 matched files. | None. |
| Senior Schools (C169) | YES | **YES** — commit `1a306d6` | **YES** — built, browser-verified locally, and confirmed live on `www.elimux.ke` via `vercel inspect` + direct curl, same session | Fully shipped this session. | None. |

---

## SECTION E: SUPABASE MIGRATIONS

| Migration File | Applied? | Pending? | Related Feature | Action Needed |
|---------------|---------|---------|----------------|-------------|
| `20260829000001_pathways_schema.sql` | **UNKNOWN — likely yes for the base schema** | Its own uncommitted 4-line RLS addition is definitely pending | Career Pathways | Needs a direct, read-only live-DB check (e.g. `information_schema`/`pg_policies` query via the Supabase MCP tool) to confirm current RLS state on `kjsa_performance_levels` and `pathway_kjsa_requirements` before deciding whether to run the pending lines. Not run this cycle — read-only DB queries weren't explicitly in this audit's file-based scope, flagged instead of assumed. |
| `20260829000002_pathways_rls_fix.sql` | UNKNOWN | Yes (never committed, never run) | Career Pathways | Read its actual contents against live schema state before running — may overlap with the pending lines in the base migration above. |
| `20260830000001_school_discovery_schema.sql` | UNKNOWN (no CLI link to confirm) | No local pending changes (file is clean/committed) | Schools feature | No working-tree action needed; live-apply status unconfirmed but out of this cycle's scope. |
| `999_dtb_academy_demo.sql`, `999a_dtb_academy_app_config_rls_fix.sql` | Presumed applied (DTB Academy is live per Cycles 152-154) | No | DTB Academy | **Excluded from this audit per brief's own scope.** |

`npx supabase migration list` failed with `LegacyProjectNotLinkedError` — this local checkout has
never run `supabase link`, so the CLI can't compare local migration files against the live
project's applied-migrations table. Noted rather than worked around, since linking a CLI to a
production project is a configuration change this cycle's "do not modify" rule should cover.

---

## SECTION F: CARRY-FORWARD DECISIONS

1. **`docs/archive/bridge-121.md`** — still unresolved. Real Cycle 045 archived report vs. a
   "Pathways-001-Corrected" spec, colliding in one file. Needs Kimi's direct answer before any
   verdict is final (see Section B).
2. **RLS gap on 2 pathways tables** — needs a live, read-only DB check against production
   (`kjsa_performance_levels`, `pathway_kjsa_requirements`) to confirm whether this is an active
   security gap right now, before anything else touches the pathways schema. Treat as the
   highest-priority item in this whole report.
3. **Second-wave Pathways files with no located brief** — `kjsa/analyze`, `schools/match`,
   `pathways/interpret`, `guidance/validate`, the OG route, the PDF export, and the share
   component don't map to the one Pathways spec that was found (`bridge-121.md`'s
   `Pathways-001-Corrected`). Either an intermediate brief exists somewhere unarchived, or this
   was built from verbal/out-of-band instructions. Worth asking directly rather than assumed.
4. **`InstitutionDetailDrawer.tsx`** — orphaned, unreferenced component sitting alongside a
   committed, working `InstitutionApplicationDrawer`. Needs a human call on intent.
5. **2 stashes** — `pre-theme-sweep-backup` touches `src/app/layout.tsx`, the same file Cycle 169
   just modified; popping it today would likely conflict. The `institution onboarding portal` WIP
   stash is tiny and likely superseded by the real ReviewCard fix already shipped 2026-07-19 per
   [[project_elimux_reviewcard_fix]] — worth confirming and dropping if so, rather than letting it
   sit indefinitely.
6. **10 stale feature branches** (`auth-hardening-preview`, `auth-security-preview`,
   `feat/admin-pricing-portal`, `feat/elimux22-ad-billing`, `feat/elimux23-payments`,
   `feat/skolex-ads`, `feat/skolex-home`, `feat/skolex-reference`, `feature/internship-module`,
   `feature/skills-toggle`) — not evaluated for merge-worthiness this cycle (branch archaeology
   was out of this audit's working-tree scope); worth a dedicated pass to decide which are
   superseded-and-safe-to-delete vs. still-relevant.
7. **`public/test-pathways.html`** — currently harmless only because uncommitted; worth a rule
   (or a `.gitignore` entry for scratch test HTML) so a future `git add -A` doesn't accidentally
   ship an unauthenticated internal API test page to production.
8. **48 uncommitted archive files** — cheap, safe, zero-risk to commit whenever convenient; just
   restores the bridge protocol's own history to git the way the protocol assumes it already is.

---

**Per the brief's Step 7: nothing was committed, staged (beyond the two audit files below), or
pushed this cycle.** `docs/audit-170-inventory.md` and `docs/audit-170-report.md` are the two
deliverables.
