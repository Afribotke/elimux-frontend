CYCLE 027 — HOMEPAGE POLISH: ALL 5 FIXES — REPORT

Status: COMPLETE (code + build verified; visual check not done — see note below)
Archive Ref: docs/archive/bridge-060.md (snapshot of the instruction this report replaces)

=== WHAT WAS DONE ===

FIX 1 — Secondary nav bar removed from homepage
File: src/components/DesktopNav.tsx
The "For Employers / Achievements / Partner" bar (Line 2 of the header,
SECONDARY_NAV) is now wrapped in `{!isHome && (...)}`, reusing the existing
`isHome` pathname check already in the component (it drives the
transparent-over-hero navbar behavior added in an earlier Cycle 027 task).
Top navbar (logo, Home, Institutions, AI Search, Programs, Log In, Get
Started) is untouched and still renders on every route including "/".

FIX 2 — 6 category cards enlarged
File: src/components/home/NewHomePage.tsx (HERO_CATEGORIES render block)
- padding p-5 -> p-6
- icon circle w-12 h-12 -> w-14 h-14
- icon text-lg -> text-2xl
- label text-sm -> text-base font-semibold (was already font-semibold)
- added min-h-[160px] + justify-center so short labels don't leave the
  card looking unbalanced
- gap-4 -> gap-5

FIX 3 — Search bar spacing
File: src/components/search/AISearchOverlay.tsx (closed/collapsed state)
- container: added gap-3, changed px-6 to pl-4 pr-2 (button now has its
  own right-side breathing room instead of sharing the container's px-6)
- Search button: added mr-1 so it doesn't touch the rounded-2xl edge
- rounded-2xl kept consistent, unchanged

FIX 4 — "Or browse by category" label
File: src/components/home/NewHomePage.tsx
Added between the AISearchOverlay and the category-card grid: centered
text-sm text-gray-400 dark:text-gray-500 label, mt-8 mb-4, flanked by two
h-px bg-gray-700 flex-1 divider lines exactly as specced.

FIX 5 — Hover effects enhanced
File: src/components/home/NewHomePage.tsx (HERO_CATEGORIES array + card
className)
- hover:-translate-y-1 -> hover:-translate-y-2
- transition duration-200 -> duration-300
- added hover:border-slate-500 (base border-slate-700)
- replaced each card's two-layer glow (generic dark shadow + color glow)
  with the single-shadow value this instruction specified:
  hover:shadow-[0_10px_40px_-4px_rgba(R,G,B,0.3)], one per category color
  (blue/orange/yellow/emerald/violet/rose), matching each card's existing
  top-border color.

Note: an earlier Cycle 027 instruction (see docs/archive/bridge-059.md)
had already set the two-layer glow + 8px/30px shadow + w-12/p-5 sizing on
these same cards. This report's values (10px/40px single shadow, w-14/p-6)
overwrite those per this instruction's explicit spec — most-recent-wins,
flagging it here rather than letting it look like an unexplained reversal.

=== VERIFICATION ===

1. npx tsc --noEmit — clean, no errors.
2. npm run build via the confirmed local recipe (NODE_OPTIONS=
   --max-old-space-size=2560, NEXT_PRIVATE_SKIP_SOURCEMAPS=1,
   NEXT_TELEMETRY_DISABLED=1, --no-lint) — succeeded, all routes built.
3. npx next start — running, http://localhost:3000 returns HTTP 200.
4. Visual checklist from the instruction (no gray bar on homepage, cards
   larger, search spacing comfortable, label visible, hover lift+glow,
   overall premium feel) — NOT verified visually this pass. Chrome
   browser automation was unavailable in this session (extension not
   connected), so nothing was actually clicked/screenshotted in a
   browser. Code-level checks (tsc, build, HTTP 200) confirm the app
   compiles and serves; they do not confirm the page looks right.
   Recommend an eyeball pass on http://localhost:3000 before treating
   this as fully verified.

=== FILES CHANGED (uncommitted, sitting on local commit 63a3258) ===

- elimux-frontend/src/components/DesktopNav.tsx
- elimux-frontend/src/components/home/NewHomePage.tsx
- elimux-frontend/src/components/search/AISearchOverlay.tsx

DO NOT commit. DO NOT push. (per this cycle's own instruction — left as-is.)
