CYCLE 027 — HOMEPAGE POLISH: ALL 5 FIXES (execute in order, no questions)

=== FIX 1: REMOVE SECONDARY NAV BAR FROM HOMEPAGE (Highest Priority) ===

The light gray bar with "For Employers / Achievements / Partner" breaks the dark hero. Remove it from the homepage ONLY.

In src/app/page.tsx or src/components/home/NewHomePage.tsx (wherever the secondary nav renders):

- Find the component that renders "For Employers", "Achievements", "Partner" links.
- Wrap it in a conditional: only render if NOT on homepage (pathname !== "/").
- OR: Remove it entirely from the homepage layout and let it appear only on inner pages.

The top navbar (ElimuX logo, Home, Institutions, AI Search, Programs, Log In, Get Started) stays. Only the secondary gray bar below it goes.

=== FIX 2: ENLARGE THE 6 CATEGORY CARDS ===

In src/components/home/NewHomePage.tsx:

Current cards feel like buttons, not entry points. Increase:

- Padding: from p-5 to p-6
- Icon circle: from w-12 h-12 (48px) to w-14 h-14 (56px)
- Icon size inside circle: from text-lg to text-2xl
- Label text: from text-sm to text-base font-semibold
- Card min-height: add min-h-[160px] so cards feel substantial
- Gap between cards: from gap-4 to gap-5

=== FIX 3: FIX SEARCH BAR SPACING ===

In src/components/search/AISearchOverlay.tsx (or wherever the search input renders):

- Add gap-3 between the input text and the Search button
- Button should not touch the right edge — add mr-1 or equivalent
- Input placeholder should have comfortable left padding (pl-4 minimum)
- Overall container: ensure rounded-2xl is consistent and the bar feels spacious, not cramped

=== FIX 4: ADD "OR BROWSE BY CATEGORY" LABEL ===

In src/components/home/NewHomePage.tsx, between the AI Search input and the 6 category cards:

Add a centered label:
- Text: "Or browse by category"
- Style: text-sm text-gray-400 dark:text-gray-500 text-center
- Margin: mt-8 mb-4
- Optional: small horizontal lines on each side for decoration (flex items-center gap-4, with <div className="h-px bg-gray-700 flex-1"> on each side)

=== FIX 5: ENHANCE HOVER EFFECTS ON CARDS ===

In src/components/home/NewHomePage.tsx, on the 6 category cards:

Current hover is too subtle. Make it feel alive:

- Transform: hover:-translate-y-2 (was -translate-y-1)
- Shadow: Add color-matched glow on hover
  - Universities: hover:shadow-[0_10px_40px_-4px_rgba(59,130,246,0.3)]
  - TVET: hover:shadow-[0_10px_40px_-4px_rgba(249,115,22,0.3)]
  - Scholarships: hover:shadow-[0_10px_40px_-4px_rgba(234,179,8,0.3)]
  - Internship: hover:shadow-[0_10px_40px_-4px_rgba(16,185,129,0.3)]
  - Attachment: hover:shadow-[0_10px_40px_-4px_rgba(139,92,246,0.3)]
  - Bursary: hover:shadow-[0_10px_40px_-4px_rgba(244,63,94,0.3)]
- Transition: transition-all duration-300 (smoother, more luxurious)
- Border: On hover, border-color should brighten slightly (border-slate-600 → border-slate-500)

=== VERIFICATION ===

After all 5 fixes:
1. npx tsc --noEmit
2. npm run build
3. npx next start
4. Open localhost:3000 and confirm:
   - [ ] No secondary gray nav bar on homepage
   - [ ] Cards are larger and feel substantial
   - [ ] Search bar has comfortable spacing
   - [ ] "Or browse by category" label visible between search and cards
   - [ ] Cards lift + glow dramatically on hover
   - [ ] Overall look feels premium and intentional

DO NOT commit. DO NOT push. Report results.