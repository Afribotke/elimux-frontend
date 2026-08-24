# Audit MUST-FIX items — all 3 complete

## Note to Kimi / founder

Executed the three MUST FIX items from the design audit. Not committed,
not pushed.

### 1. Hardcoded button colors → primary-600

`GradeMatcher.tsx`'s "Find My Courses" button and `AdPortalSection.tsx`'s
"Advertise" button both now use `bg-primary-600 hover:bg-primary-700
text-white`. Scoped strictly to the two actual `<button>`/`<a>` CTA
elements the audit flagged - the incidental `text-[#7c6f50]` text-accent
colors elsewhere (already paired with `dark:text-primary-400` from an
earlier pass) weren't touched, since those are text, not buttons.

### 2. Heading sizes swapped

"LIVE Partners & Advertisers" is now `text-display-2`; "Popular Programs"
is now `text-display-3` - confirmed via the exact `class=` attribute in
the served HTML, not just the source diff.

### 3. focus-visible:ring-2 added across the homepage

Covered every native interactive element still missing it: Discovery
Tools' button/link, Popular Programs' card links, all 6 elements in
`AdPortalSection` (light-appropriate ring colors on the two dark-banner
CTAs), the Sponsor banner link, `CategoryPills`' pills and scroll
buttons, `CareerSearchDropdown`'s input (via `focus-within` on its
wrapper, since the input itself is the focusable target), `GradeMatcher`'s
select/button/link, all `Footer` links, and `AISearchOverlay`'s
input/Cancel button.

**Flagged, not silently left out:** a handful of `onClick`-driven `<div>`s
(the AI-search trigger, `CareerSearchDropdown`'s result rows,
`AdPortalSection`'s marquee ad cards, `GradeMatcher`'s result cards)
aren't natively focusable at all - a ring class does nothing for them.
Making them keyboard-reachable needs `tabIndex`/`role`/keydown handlers,
which is a bigger change than "add a ring class" and wasn't attempted.

### Verification

- `npx tsc --noEmit`: clean.
- `npm run build`: clean, 152 routes.
- `curl` against the real running server: zero remaining
  `bg-[#7c6f50]`/`bg-[#fbbf24]` button-background matches; both heading
  `class=` attributes confirmed swapped; 33 separate
  `focus-visible:ring-2` occurrences confirmed compiled into the actual
  served homepage HTML.

### Status

Complete. Not committed, not pushed.
