# CYCLE 027 — Homepage Design Audit & Standardization Proposal (read-only, complete)

## Note to Kimi / founder

Read-only analysis as instructed. No files touched, no code written.
Based on direct source review of every homepage component (I wrote or
edited most of these across Cycles 025-027 this session) plus targeted
verification checks against the actual code - everything below is
code-verified, not guessed. Chrome extension remains disconnected, so a
few items (contrast ratios, live responsive behavior) are flagged as
unverified rather than passed.

---

## 1. VISUAL HIERARCHY — FLAG

- Section priority order is correct (Hero -> Search -> Categories ->
  Discovery Tools -> Content -> Footer) after this cycle's reorders.
- **Real inversion found:** "LIVE Partners & Advertisers" (`text-display-3`,
  the smallest display size) sits directly above "Popular Programs"
  (`text-display-2`, one size larger). An earlier section has a visually
  smaller heading than a later one.
- Spacing between sections isn't systematic - `pt-10`, parent `py-*`, and
  `my-4` all appear without one shared scale.

## 2. TYPOGRAPHY — FLAG

- The `text-display-1/2/3` + `text-body-lg` scale is real and used
  correctly where applied, but inconsistently: Popular Programs/How It
  Works use `text-display-2`, LIVE Partners uses `text-display-3`, and
  the Discovery Tools header ("More Ways to Discover") uses a bespoke
  `text-xs uppercase tracking-wider` treatment outside the display scale
  entirely.
- Font family consistent (Inter via `next/font`, global). Line-height:
  no base override, relies on Tailwind defaults - no issue.

## 3. COLOR CONSISTENCY — FAIL

Most significant finding. Primary CTA color is not consistent - four
different hardcoded treatments live on the homepage right now:
- `bg-primary-600` (hero AI search, Discovery Tools "Match Me") - the
  actual design-system token.
- `bg-[#7c6f50] hover:bg-[#5e543c]` - `GradeMatcher`'s "Find My Courses"
  button, hardcoded brown hex, bypasses the theme entirely.
- `bg-[#fbbf24] text-[#0f172a] hover:bg-[#f59e0b]` - `AdPortalSection`'s
  "Advertise" button, hardcoded amber hex.
- `bg-emerald-600` - used on `/internships`/`/attachments` (same visual
  system, not strictly homepage) as a third "primary" color.

Dark mode: confirmed light-only leaks remain (a scope cut flagged at the
time, not fixed):
- `CategoryPills.tsx`'s 20 category-tag pastel colors - zero `dark:`
  variants.
- `GradeMatcher`'s `getGradeColor()` returns raw hex via inline `style`,
  entirely outside Tailwind's dark-mode system.
- One deadline-status badge in `ScholarshipDiscovery.tsx` (currently
  unused on the homepage, moot for now).

## 4. COMPONENT CONSISTENCY — FAIL

- Border-radius mixed even within `NewHomePage.tsx` alone: hero cards /
  Popular Programs / How It Works use `rounded-2xl`; Discovery Tools'
  wrapper and its 3 cards use `rounded-xl` (per that cycle's own explicit
  spec - deliberate, but still a mismatch against the rest); the "Check
  My Grade" button uses `rounded-lg`.
- Shadows mixed: `shadow-card`/`shadow-card-hover` (the real tokens) vs.
  `shadow-sm` (Discovery Tools, per spec) vs. none (AdPortalSection's ad
  ribbon).
- Icon sizing mixed: hero cards 32px, Discovery Tools 24px, How It Works
  48px - three scales, each individually correct per its own instruction,
  never reconciled against each other.
- Padding/gap not on one shared scale - `p-3`/`p-4`/`p-6`/`gap-4`/`gap-6`
  all appear, each locally reasonable.

## 5. INTERACTION & FEEDBACK — FLAG

- Hover states genuinely thorough everywhere interactive - no gaps found.
- Focus-visible rings: only the 6 hero cards have them (color-matched,
  this cycle's own work). Grepped the rest of `NewHomePage.tsx` - zero
  `focus-visible:` anywhere else: not on "Check My Grade", "Match Me",
  Popular Programs cards, or How It Works.
- Loading states present and real everywhere data is fetched - no gaps.
- Empty states mixed maturity: `/attachments` now uses the real
  `EmptyState` component (this session's own quick-fix). But
  `PopularPrograms`/`ScholarshipDiscovery` just `return null` when empty -
  silently invisible, not designed.

## 6. RESPONSIVE BEHAVIOR — PASS (one flag)

- Grid breakpoints used sensibly, no found breakage. Mobile bottom nav
  confirmed correct this session.
- Flag: hero's 6-card grid is `grid-cols-2` on mobile (2x3) rather than
  single-column or horizontal scroll - likely fine with `p-4` cards, but
  not visually confirmed (extension disconnected) - worth a real
  device/viewport check before shipping.

## 7. CONTENT & COPY — PASS

- Headlines clear and specific, no Lorem ipsum found, CTAs action-oriented.
- Soft flag, not a bug: "LIVE Partners & Advertisers" is entirely
  empty-inventory right now (all "Your ad here" placeholders) - accurate
  to current state, worth knowing it's the real empty product state, not
  demo content.

## 8. PERFORMANCE & ACCESSIBILITY — FLAG

- Images: confirmed zero `next/image` usage anywhere in homepage
  components - every sponsor/employer logo uses raw `<img>`.
- Contrast: not measurable without a real browser - flagged unverified,
  not passed.
- Form labels: `/internships`/`/attachments` filter inputs use placeholder
  text only, no associated `<label>` - real WCAG gap, though outside
  strict homepage scope.
- ARIA labels on icon-only buttons: mixed. `CategoryPills`' scroll
  buttons have proper `aria-label`. `AdPortalSection`'s scroll buttons
  (visually near-identical pattern) have zero - just raw `‹`/`›` glyphs.
  `DesktopNav`'s theme toggle has a proper `sr-only` label; its profile-
  avatar dropdown button does not.

---

## Prioritized List

**1. MUST FIX (blocks launch)**
- Unify primary CTA color - replace the 3 hardcoded hex-color buttons
  (`GradeMatcher`, `AdPortalSection`'s dark-banner CTA) plus reconcile
  `emerald-600` vs `primary-600` across `/internships`/`/attachments`,
  with one token.
- Add missing `focus-visible` rings outside the 6 hero cards - real
  accessibility gap, not cosmetic.
- Add `aria-label` to `AdPortalSection`'s scroll buttons.

**2. SHOULD FIX (polish gap)**
- Fix the LIVE Partners vs Popular Programs heading-size inversion.
- Reconcile border-radius/shadow/icon-size across all homepage cards into
  one documented set (Discovery Tools' compact variant can stay smaller
  deliberately, but as a *named* compact variant, not an accidental
  mismatch).
- Add real `dark:` coverage to `CategoryPills`' chip colors and
  `GradeMatcher`'s `getGradeColor()` hex values.
- Give `PopularPrograms`/`ScholarshipDiscovery` designed empty states
  instead of silent `return null`.

**3. NICE TO HAVE (future cycle)**
- Migrate raw `<img>` to `next/image` for sponsor/employer logos.
- One documented spacing scale instead of ad hoc padding/gap choices.
- Real contrast-ratio pass once the Chrome extension is available.

---

## Standardization Plan

**Proposed changes:**
1. Define the missing tokens once (reuse `primary-600` everywhere) and a
   shared "compact card" variant (radius/shadow/padding) alongside the
   existing full-size card style, instead of ad hoc per-component choices.
2. Sweep pass adding `focus-visible:ring-2` + `aria-label` where missing.
3. Fill remaining `dark:` gaps in `CategoryPills` and `GradeMatcher`.
4. Reorder/resize the two mismatched headings.

**Files touched:** `GradeMatcher.tsx`, `AdPortalSection.tsx`,
`CategoryPills.tsx`, `PopularPrograms.tsx`, `ScholarshipDiscovery.tsx`,
`NewHomePage.tsx`, possibly `tailwind.config.js` if a new shared
token/variant is added. Internship/attachment pages only if the
`emerald-600` vs `primary-600` reconciliation should be included -
separate from strictly "homepage."

**Estimated scope: Medium.** Mostly className-only changes (low risk, no
logic touched, same pattern as this session's dark-mode pass), but spread
across 6 files with real design decisions to lock in first (which color
wins, what the compact-card spec formally is) - not a one-file quick fix.

---

No code written, no files modified, per the instruction.
