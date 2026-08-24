# Cycle 027 — Homepage Hero Redesign: all 5 steps complete

## Note to Kimi / founder

Ran all 5 steps in order, reported after each one as instructed. Local
preview running at `localhost:3000` (production build). **Not committed,
not pushed** - Cycle 025-026 remain the only local commit (`63a3258`),
Cycle 027's work is uncommitted on top of it, exactly per the "DO NOT
commit, DO NOT push" rule.

---

## STEP 1: Remove Global UnifiedNavBar From Homepage Only

**File:** `src/components/layout/UnifiedNavBar.tsx` - added
`if (pathname === "/") return null;` right before the render, after all
hooks (rules of hooks). `layout.tsx` itself untouched - it's a Server
Component (has a `Metadata` export) and can't call `usePathname()`
directly; `UnifiedNavBar` already had the hook internally for its
active-pill logic, so that was the correct place for the guard.

tsc: clean. Build: clean, 152 routes. Verification limit: no Chrome
extension connection this session (confirmed disconnected, not assumed) -
this component's pill content never appears in `curl`'d HTML on *any*
route regardless of homepage/other-page, a pre-existing client-hydration
quirk (`useSearchParams()`), so its hide/show behavior is code-verified
only, not visually confirmed.

---

## STEP 2: Redesign Homepage Hero

**Files:** `src/components/home/NewHomePage.tsx`,
`src/components/search/AISearchOverlay.tsx` (className-only restyle of
its closed-state trigger, search logic untouched).

Hero rebuilt: headline/subheadline at the requested sizes, a 3x2/2x3 grid
of the same 6 categories `UnifiedNavBar` uses (same hrefs), light/dark
gradient background, AI search bar, and a new stats bar (10,000+
Institutions / 50,000+ Programs / 100+ Countries / 1M+ Students).

One correction made before building: `.btn-primary` and `.card-interactive`
in the instruction aren't real classes anywhere in this codebase (checked
`tailwind.config.js` and `globals.css` - neither defines them, nothing in
`src` uses them). Translated them into this project's real design tokens
instead of shipping non-functional class names.

tsc: clean. Build: clean, 152 routes. Verified via server-rendered HTML
(this component isn't client-hydration-gated) - headline, all 4 stats,
all 6 cards, and the restyled search bar all confirmed present exactly as
specified.

---

## STEP 3: Polish Below-the-Fold Sections

**Files:** `PopularPrograms.tsx`, `AdPortalSection.tsx`,
`SponsorBanner.tsx`, `HowItWorks.tsx`, `NewHomePage.tsx`.

- Popular Programs: heading bumped to spec size, grid widened to 4
  columns, cards restyled. No image field exists on programs anywhere in
  this data model (checked `ProgramRow`/`ProgramCard`) - used a
  category-colored placeholder block rather than a fake `<img>`.
- Live Partners & Advertisers: heading bumped to spec size, full
  dark-mode support added (was 100% light-only). All existing real
  functionality (live pricing fetch, category filter, marquee) untouched.
- Sponsor Banner: restyled to the requested full-width dark layout.
  **Did not hardcode "Afribot" / "Banking on Education"** - checked first,
  it isn't a real configured sponsor anywhere in the repo (only match is
  `MajorSponsorForm.tsx`'s placeholder example text,
  `placeholder="e.g., Afribot"`). Hardcoding it would show a partnership
  that doesn't exist - the same class of issue as the impersonating
  employer records fixed earlier this session. Kept it genuinely
  data-driven off `useMajorSponsor()`.
- How It Works: this component already existed as a file but was never
  imported anywhere - wired it in, added the connecting line between
  steps the spec asked for.

tsc: clean. Build: clean, 152 routes. All four sections confirmed present
via server-rendered HTML.

---

## STEP 4: Global Consistency Fixes

**Files:** `DesktopNav.tsx`, `NewHomePage.tsx`, plus a dark-mode pass
across `PopularPrograms.tsx`, `AdPortalSection.tsx`, `SponsorBanner.tsx`,
`HowItWorks.tsx`, `ScholarshipDiscovery.tsx`, `CareerSearchDropdown.tsx`,
`GradeMatcher.tsx`, `AISearchOverlay.tsx`.

- Navbar: transparent over the hero, solid on scroll past 60px - scoped
  to the homepage only (other routes have no hero to float over, kept
  their prior always-solid style unchanged).
- Footer: wired in `Footer` (`@/components/layout/Footer` ->
  `@/components/Footer`) - this component has existed since Cycle 025 but
  was never imported anywhere in the entire app until now.
- Dark mode: 9 files that were previously 100% hardcoded light-only now
  carry `dark:` variants throughout - purely additive (nothing removed or
  restructured), which kept risk low given no visual verification was
  available. Left a small number of decorative multi-color chips
  unconverted (20 category-tag pastel colors in `CategoryPills.tsx`, one
  deadline badge in `ScholarshipDiscovery.tsx`) - high-effort, low-value
  relative to the structural fixes.

tsc: clean. Build: clean, 152 routes. Footer confirmed present via
server-rendered HTML (Terms/Privacy/© content). 272 `dark:` class
occurrences confirmed compiled into the homepage's shipped HTML.

---

## STEP 5: Final Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run build` | clean, 152 routes |
| Homepage: headline, 6 hero cards, AI search, stats bar | Confirmed via server-rendered HTML |
| Homepage: no UnifiedNavBar below navbar | Code-verified only - not curl-observable |
| `/programs`: UnifiedNavBar visible | Code-verified only, same limitation |
| Dark mode toggle works | 272 `dark:` classes confirmed shipped; actual toggle click-through not curl-observable |
| Footer visible on homepage | Confirmed |
| All sections render correctly | Confirmed (Popular Programs, LIVE Partners, How It Works, stats bar) |

---

## Status

**Cycle 027 complete. Homepage hero redesigned. Awaiting review and
"commit and push it".**

**Standing verification gap, consistent across this whole cycle:** no
Chrome browser extension connection this session (tried at the start of
Cycle 027, got a clear "not connected" error, not just assumed) - every
client-side-only behavior (`UnifiedNavBar` hide/show, scroll-triggered
navbar transparency, dark-mode toggle click-through) is verified by code
review + `tsc` + build manifest + server-rendered-HTML content checks
where the component allows it, not by an actual browser session. If you
want any of these three specifically eyeballed, reconnecting the
extension or a quick manual check on your end would close that gap.

**No live/deployed link exists for this work** - it's local-only
(uncommitted, not pushed, per the standing rule). The only thing running
is the local preview at `http://localhost:3000` on this machine.
