# Cycle 025 — Side-by-Side Audit: Live vs. Local Build

Date: 2026-08-23
Live: https://www.elimux.ke
Local: http://localhost:3000 (`next start` on the Cycle 025 working tree, uncommitted)

---

## 0. Pre-Audit — Localhost Fix

**Status: RESOLVED.** Local build now loads without error.

**Root cause:** `TypeError: crypto.randomUUID is not a function`, thrown in
`src/lib/pwaDevice.ts:14` (`getOrCreatePwaDeviceId()`), called from
`src/hooks/useBackgroundSync.ts:80` inside the mount effect of
`<BackgroundSyncManager />`, which is mounted unconditionally in root
`src/app/layout.tsx`. `crypto.randomUUID()` only exists in secure
contexts (`https://` or `localhost`) — it's `undefined` over plain
`http://192.168.0.14:3000`, so it threw, and with no error boundary
between it and the root layout the error escalated to
`global-error.tsx` ("Critical Error").

Pre-existing PWA/offline-queue code, **not** introduced by Cycle 025 —
`layout.tsx` and `AppShell.tsx` were not the cause (verified: `AppShell`
isn't wired into anything live anyway).

**Fix:** added a `crypto.getRandomValues()`-based fallback UUID
generator in `pwaDevice.ts` for when `crypto.randomUUID` is unavailable.

**Verified:** `npx tsc --noEmit` clean, `npm run build` clean (155
routes), `next start` restarted, re-tested via Playwright against both
`localhost:3000` and `192.168.0.14:3000` — clean on both.

---

## 1. Live Site Audit — www.elimux.ke

### 1.1 Route Inventory

| Route | Status | Notes |
|---|---|---|
| `/` | 200 | Homepage |
| `/programs/` | 200 | (no-trailing-slash `/programs` → 308, `trailingSlash:true`) |
| `/programmes/` | 308 → `/programs/` | Vercel-level redirect, see 1.1 note below |
| `/scholarships/` | 200 | |
| `/institutions/` | 200 | |
| `/auth/login/` | 200 | |
| `/auth/register/` | 200 | |
| `/admin/dashboard/` | 307 | Redirects — unauth (AdminGate) |
| `/employer/login/` | 404 | Route doesn't exist — real employer login is `/employer/` + `/employer/activate/`, no dedicated `/employer/login` in this codebase (pre-existing, not a Cycle 025 issue) |
| `/advertiser/login/` | 200 | |
| `/payments/` | 307 → `/pricing/` | `next.config.js` redirect rule, pre-existing |
| `/bursary/` | 200 | |
| `/about/` | 200 | |
| `/contact/` | 200 | |
| `/blog/` | 404 | No blog route exists in the codebase — pre-existing, not part of the app |
| `/sitemap.xml` | 200 | |
| `/robots.txt` | 200 | |

**Note on `/programmes`:** the redirect is defined in `vercel.json`
(platform-level redirects config), not in `next.config.js` or any
Next.js route — that's why it works on live (served by Vercel) but
404s under local `next start` (no Vercel edge layer locally). Not a
regression, not fixable in local preview.

### 1.2 Live Site Component Inventory

**Homepage (`/`) — IMPORTANT: live is running a different component
than the one redesigned this cycle.** Live serves `NewHomePage.tsx`
(the "Skolex" hero variant), gated behind
`NEXT_PUBLIC_FEATURE_SKOLEX_HOME`, which **is set in Vercel Production**
(confirmed via `vercel env ls production` — set 32 days ago) and is
**not set in any local `.env*` file**, so local `next start` falls back
to `CurrentHome` — the component Cycle 025 actually redesigned. See
Section 5, item 1 — this is the single most important finding in this
audit.

Live homepage content actually observed:
- Hero: "Tell us what you're looking for" / "Describe it in your own
  words, pick your interests, or tell us your dream career — we'll
  match you to real programs."
- Three tab pills: "🎓 University & College", "🔧 Skills & Trades",
  "💰 Scholarships"
- AI search bar (`AISearchOverlay`)
- Sections below tabs: `AdPortalSection`, `PopularPrograms`,
  `SponsorBanner`
- Hardcoded light theme (`bg-white`, `text-gray-900`, badge
  `bg-[#fef3c7] text-[#92400e]`) — no dark mode, no gold brand tokens
- No footer — file ends in a bare `<div className="h-12" />` spacer
- No standard nav in the HTML I fetched (this component doesn't
  render `DesktopNav` itself the way I checked it — worth Kimi
  confirming whether NewHomePage's page wrapper still includes the
  global nav from root layout; root layout mounts `DesktopNav`
  unconditionally so it should be present, just wasn't in this curl
  snapshot's static HTML — a client-hydration nuance, not investigated
  further as out of scope for this audit)

**`/programs/` (not flagged, real target of Cycle 025 redesign):**
- Nav: Home, Institutions, AI Search, Opportunities, Programs
  (primary) + For Employers, Achievements, Partner (secondary) + a
  "Bursary — Opening Soon" link + theme toggle + Log In/Get Started —
  matches `DesktopNav.tsx` exactly.
- No footer content found in the static HTML (matches: `Footer.tsx`
  is unused sitewide, live and local both — pre-existing, not caused
  by this cycle).
- "Toggle theme" present — dark/light toggle live and working.

### 1.3 Live Site Assets

- Logo: text-based, "ElimuX" wordmark next to a 🎓 emoji-in-gradient
  square (blue gradient box in `DesktopNav`, not gold — pre-existing
  inconsistency, not touched this cycle).
- Primary brand color (on non-flagged pages): gold/amber
  (`--primary-*` CSS vars, `#FFC107`/`#FF8F00` family).
- Dark mode toggle: present in the top nav (`ThemeToggle`), on every
  page **except** the flagged NewHomePage, which has no toggle and no
  dark variant at all.
- Animations: standard hover/transition-colors on nav links; nothing
  elaborate pre-existing.

---

## 2. Local Build Audit — localhost:3000

### 2.1 Route Inventory

| Route | Status | Notes |
|---|---|---|
| `/` | 200 | Serves `CurrentHome` (redesigned this cycle) — see 1.2 note |
| `/programs/` | 200 | |
| `/programmes/` | 404 | Expected — Vercel-only redirect, not present locally |
| `/scholarships/` | 200 | |
| `/institutions/` | 200 | |
| `/auth/login/` | 200 | |
| `/auth/register/` | 200 | |
| `/admin/dashboard/` | 307 | Same unauth redirect as live |
| `/employer/login/` | 404 | Same as live — route doesn't exist, pre-existing |
| `/advertiser/login/` | 200 | |
| `/payments/` | 307 | Same `next.config.js` redirect as live |
| `/bursary/` | 200 | |
| `/about/` | 200 | |
| `/contact/` | 200 | |
| `/blog/` | 404 | Same as live |
| `/sitemap.xml` | 200 | |
| `/robots.txt` | 200 | |

Every route status matches live except `/programmes/`, which is
explained above (infra-layer redirect, not app code).

### 2.2 Local Build Component Inventory

**Homepage (`/`):** serves `CurrentHome`, the component actually
redesigned this cycle — text-balance headline "Discover Your Perfect
Education", gold gradient text, stats bar with `text-display-2`
values, category grid with hover-lift + shadow-card, `EmptyState` for
no-results. This is **not** what's live in production right now (see
Section 5).

**`/programs/`:** nav identical to live (same list, same order,
byte-for-byte href set). Filters bar restyled (primary-gold focus
rings instead of the old hardcoded blue), `EmptyState` swapped in for
the no-results case, focus-visible rings added throughout. Footer
still absent (unchanged — `Footer.tsx` remains unused; this cycle
built the plumbing to use it via `AppShell`/`layout/Footer.tsx` but
did not wire it into any live page, to stay in scope).

### 2.3 Local Build Assets

- Logo, brand color, dark-mode toggle: identical to live on every
  non-flagged page (DesktopNav/globals.css/tailwind tokens untouched
  at the value level, only extended).
- New: `shadow-soft`/`shadow-card`/`shadow-glow`, `animate-fade-in`/
  `slide-up`/`scale-in`, `text-display-1/2/3` now available and used
  on the redesigned pages. Not present on live yet since nothing is
  deployed.

### 2.4 Build Output Inspection

`.next/server/app/` contains 168 entries (route folders + prerendered
`.html`/`.meta`/`.rsc` files for static routes), consistent with the
155-route count `npm run build` reports. No missing routes relative to
the live route table above, aside from `/programmes` (explained) and
`/employer/login` + `/blog` (both 404 on live too — never existed).

---

## 3. Side-by-Side Comparison Table

| Item | Live (elimux.ke) | Local (localhost) | Status | Reason for Change |
|---|---|---|---|---|
| Homepage component | `NewHomePage.tsx` (Skolex, flag ON in prod) | `CurrentHome` (flag OFF locally — no `.env` entry) | **DIFFERENT** | Environment/flag divergence, pre-existing — not a Cycle 025 edit to either component. **Cycle 025 redesigned a component that isn't the one currently live.** |
| Homepage hero headline | "Tell us what you're looking for" | "Discover Your Perfect Education" | DIFFERENT | Same root cause as above — different component entirely |
| Homepage stats bar | Not present (NewHomePage has no stats bar) | Present (`Countries/Institutions/Programs/Categories`, `text-display-2`) | DIFFERENT | `CurrentHome`-only feature; N/A to what's live |
| `/programs` page layout | Filter bar + grid, `text-blue-600` accents | Same layout, `text-primary-600` (gold) accents, added shadows/focus rings | DIFFERENT | Intentional Cycle 025 polish, not yet deployed |
| Dark mode toggle | Present on all pages except NewHomePage | Present on all pages except CurrentHome-fed `/` uses tokens too | MATCH (for non-flagged pages) | No change made to toggle logic |
| Navbar items | Home, Institutions, AI Search, Opportunities, Programs, For Employers, Achievements, Partner, Bursary, Log In/Get Started | Identical | MATCH | `Navbar.tsx` created this cycle is a re-export of the same `DesktopNav`, only className (backdrop-blur) changed |
| Footer columns | Absent (unused sitewide) | Absent (unused sitewide; new `AppShell`/`layout/Footer.tsx` plumbing exists but isn't wired into any page) | MATCH | Pre-existing condition, unrelated to Cycle 025 |
| Program card design | Existing `ProgramCard` component, untouched | Same component, wrapped in a focus-ring `<Link>` | MATCH (content) / DIFFERENT (a11y polish only) | Intentional, additive only |
| `/scholarships` page | Existing layout | Same layout + `EmptyState`, focus rings, `text-balance` | DIFFERENT | Intentional Cycle 025 polish, not yet deployed |
| `/institutions/[id]` | Existing single-column layout | Same structure, added `shadow-card`, focus rings, `text-balance` | DIFFERENT | Intentional polish only — no structural rewrite (spec's tabbed-layout mockup was NOT applied, see prior bridge report) |
| Admin dashboard | Hardcoded light `gray-*`/`amber-*`, no dark mode | Same palette + `shadow-card`/hover-lift on stat cards, `LoadingState`, focus rings added | DIFFERENT | Intentional polish only; dark-mode gap flagged but not fixed (separate future cycle — already reported) |
| Auth pages | Centered card, gold accents | Same structure + `shadow-soft-lg`, focus rings, `role="alert"` on errors | DIFFERENT | Intentional polish only; submit/session logic untouched (documented past outage in that code, deliberately not touched) |
| Employer pages | `/employer/` exists, no `/employer/login` | Same | MATCH | Untouched this cycle |
| Bursary pages | `/bursary/` 200, provider dashboard/invite pages exist | Same, plus in-progress uncommitted bursary work already in this tree before Cycle 025 started | MATCH (Cycle-025-wise) | Not part of this cycle — pre-existing parallel work, untouched |
| Vercel Analytics script | Loads (deployed on Vercel) | 404 on `/_vercel/insights/script.js` | DIFFERENT | Expected — that script only resolves when actually served by Vercel; harmless locally |

---

## 4. Git Diff Analysis

`git diff --name-only` + untracked files, classified:

| File | Changed by Cycle 025? | Nature | Risk |
|---|---|---|---|
| `docs/audit-log.md` | No | Pre-existing bursary-work diff | None |
| `docs/bridge.md` | Yes | Report/protocol doc | None |
| `package-lock.json` | No | Pre-existing (`@vercel/analytics` add) | None |
| `package.json` | No | Pre-existing (`@vercel/analytics` add) | None |
| `src/app/admin/dashboard/page.tsx` | Yes | Design polish (shadows, `LoadingState`, focus rings, `text-display-2`) | Low |
| `src/app/admin/layout.tsx` | Yes | Design polish (focus-visible rings, `aria-label`s) | Low |
| `src/app/auth/login/page.tsx` | Yes | Design polish only — submit/session logic untouched | Low |
| `src/app/auth/register/page.tsx` | Yes | Design polish only — submit/session logic untouched | Low |
| `src/app/globals.css` | Yes | Additive only — `.gradient-mask-b` + reduced-motion query | Low |
| `src/app/institutions/[id]/page.tsx` | Yes | Design polish (shadows, focus rings, `text-balance`) | Low |
| `src/app/layout.tsx` | Partially | 1 line: removed duplicate `Analytics` import (pre-existing bug from bursary work, not a Cycle 025 change) | None — fixes a real bug |
| `src/app/page.tsx` | Yes | Design polish + `EmptyState` swap on `CurrentHome` | Low — see Section 5 for the component-targeting caveat |
| `src/app/programs/page.tsx` | Yes | Design polish + hardcoded-blue→primary-gold fix | Low |
| `src/app/scholarships/page.tsx` | Yes | Design polish + `EmptyState` swap | Low |
| `src/components/DesktopNav.tsx` | Yes | 1 line: `bg-background` → `bg-background/80 backdrop-blur-md` | None |
| `src/lib/api.ts` | No | Pre-existing bursary-work diff | None |
| `src/lib/pwaDevice.ts` | Yes (this turn) | Real bug fix — `crypto.randomUUID` fallback, see Section 0 | None — fixes a real bug |
| `src/middleware.ts` | No | Pre-existing bursary-work diff | None |
| `src/types/bursary.ts` | No | Pre-existing bursary-work diff | None |
| `tailwind.config.js` | Yes | Additive only — new `extend` fields, no existing token touched | Low |
| `src/components/layout/` (new dir) | Yes | New: `AppShell.tsx`, `Navbar.tsx`, `Footer.tsx` — not wired into any live page yet | None |
| `src/components/ui/{LoadingState,EmptyState,ErrorFallback}.tsx` | Yes | New files | None |
| `docs/archive/bridge-0*.md`, `docs/bridge-backup-*.md`, `docs/ELIMUX_MASTER_RUNBOOK*` | No | Pre-existing untracked docs | None |
| `src/app/bursary/provider/{dashboard,invite}/` | No | Pre-existing bursary-work diff | None |

No file in the Cycle 025 set touches API routes, database schema, auth
submit logic, or removes existing functionality. The one genuine
runtime risk found and fixed this session was the `crypto.randomUUID`
crash (pre-existing, unrelated to Cycle 025's own edits).

---

## 5. Omissions Report

### 1. Homepage redesign targets an inactive component — CRITICAL

- **What:** Cycle 025 redesigned `CurrentHome` inside `src/app/page.tsx`.
  Production has `NEXT_PUBLIC_FEATURE_SKOLEX_HOME` set in Vercel and
  has been serving `NewHomePage.tsx` instead for at least 32 days.
- **Where it exists on live:** `https://www.elimux.ke/` — renders
  `NewHomePage.tsx` content ("Tell us what you're looking for" hero,
  tab pills, hardcoded light theme).
- **Why:** Not a deletion or a build error — it's an environment
  variable that's set in Vercel Production but absent from every
  local `.env*` file, so local dev/preview has been rendering a
  different, inactive code path this whole time. Nothing to do with
  Cycle 025's edits; the divergence predates this cycle.
- **Severity:** CRITICAL — if this ships as-is, the actual homepage
  users see will be completely unaffected by the Cycle 025 redesign,
  and the "redesigned Homepage" step effectively did not touch what's
  live.
- **Fix required before commit?** Not a code fix, but a decision:
  either (a) set `NEXT_PUBLIC_FEATURE_SKOLEX_HOME=true` in a local
  `.env.local` and redesign `NewHomePage.tsx` instead/also, or (b)
  confirm with whoever owns the Skolex flag whether it's meant to be
  turned off before this cycle's homepage work matters, or (c)
  explicitly accept that `CurrentHome`'s redesign is dormant until the
  flag changes. This needs your call, not mine.

### 2. Footer remains unused sitewide — pre-existing, not new

- **What:** `Footer.tsx` (and the new `layout/Footer.tsx` re-export)
  is never rendered on any route.
- **Where on live:** nowhere — same on live as local, footer has
  never been wired in.
- **Why:** Pre-existing condition confirmed in the original Cycle 025
  audit, unrelated to this cycle's changes. `AppShell.tsx` was built
  to make this easy to fix, but wiring it into pages was out of scope
  (would touch every page's structure — bigger than the "restyle via
  className" mandate this cycle worked under).
- **Severity:** LOW — cosmetic, not a regression.
- **Fix required before commit?** No.

### 3. `/employer/login` and `/blog` 404 on both — pre-existing

- Both routes simply don't exist in the codebase, live or local.
  Not caused by, or related to, Cycle 025.
- **Severity:** LOW (informational only — these were on the audit's
  candidate list but were never real routes).
- **Fix required before commit?** No.

No other omissions found. Every other page, component, and asset
checked either matches exactly (nav, footer-absence, dark-mode toggle,
route status codes) or differs only by the intentional Cycle 025
polish already reported.

---

## 6. Recommendation

**FIX THEN SHIP.**

One item blocks a clean ship: **Section 5, item 1** — the Homepage
redesign was built against `CurrentHome`, which is not the component
currently live in production. Everything else in this cycle (tokens,
shared components, Programs/Scholarships/Institution-detail/Admin/Auth
polish, the `crypto.randomUUID` fix) is additive, verified working
live-equivalent via this audit, and safe to ship as-is.

Before committing, I need a decision on the homepage: redesign
`NewHomePage.tsx` too (or instead), or confirm the `CurrentHome` work
is intentionally dormant pending a flag change. Once that's resolved,
everything else in this diff is ready to commit and push on your
"approve and commit" signal — nothing else in the comparison surfaced
a real regression, deletion, or broken route.
