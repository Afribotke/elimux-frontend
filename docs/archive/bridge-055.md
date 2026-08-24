CYCLE 027 — HOMEPAGE FLOW REORDER + DISCOVERY TOOLS RESIZE (execute immediately, no questions)

In src/components/home/NewHomePage.tsx, reorder the sections to this exact flow from top to bottom:

1. Hero: Headline + Subheadline
2. AI Search Input (large, prominent)
3. 6 Category Cards (compact, already resized)
4. **DISCOVERY TOOLS** ← MOVED HERE
5. LIVE Partners & Advertisers
6. Stats Bar
7. Popular Programs
8. How It Works
9. Sponsor Banner
10. Footer

=== DISCOVERY TOOLS SECTION REQUIREMENTS ===

This section contains: CareerSearchDropdown, GradeMatcher, and ScholarshipDiscovery.

CURRENT PROBLEM: These components are too large and visually heavy. They compete with the hero and category cards.

FIX — MAKE THEM COMPACT:

1. Wrap all three in a single container:
   - bg: bg-gray-50 dark:bg-gray-900/50
   - border: border border-gray-200 dark:border-gray-800
   - rounded-2xl
   - padding: p-4 (not p-6 or p-8)
   - margin: my-4

2. Layout: Horizontal row on desktop (3 columns), stacked on mobile.
   - grid grid-cols-1 md:grid-cols-3 gap-4

3. Each tool card inside:
   - bg-white dark:bg-gray-800
   - rounded-xl
   - p-3 (compact padding)
   - shadow-sm (not shadow-card)
   - border border-gray-100 dark:border-gray-700

4. Icon: 24px (not 48px or 32px)
5. Title: text-sm font-semibold (not text-lg or text-base)
6. Description: text-xs text-gray-500 (one line max, truncate if needed)
7. Input/dropdown: compact height (h-9), text-sm
8. Button: compact (py-1.5 px-3), text-xs

9. Section header above the 3 cards:
   - "More Ways to Discover"
   - text-xs font-semibold text-gray-400 uppercase tracking-wider
   - mb-2

=== REORDER RULE ===

The AdPortalSection (LIVE Partners & Advertisers) must move DOWN to sit IMMEDIATELY BELOW the discovery tools section. It must NOT appear above them.

=== VERIFICATION ===

After changes:
1. npx tsc --noEmit
2. npm run build
3. npx next start
4. Open localhost:3000 and confirm:
   - AI Search is at the top, prominent
   - 6 category cards are compact below it
   - "More Ways to Discover" section appears next, with 3 compact cards in a row
   - LIVE Partners & Advertisers appears AFTER discovery tools
   - Stats bar is below Partners
   - Everything fits without excessive scrolling between sections
   - No section dominates the viewport — balanced visual weight

DO NOT commit. DO NOT push. Report results.