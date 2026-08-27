# Cycle 036 Report — OG Image (already live) + PWA Share System

## Status: DONE, `npm run build` green with zero errors, NOT yet committed/pushed (see note below)

Archived as `docs/archive/bridge-107.md` before this report replaced it.

## Part 1 — already done, no action taken
Checked before touching anything: `public/og-image.png` already exists and
is byte-identical to `public/og-image-solid-bg.png` (`cmp` confirms), and
`layout.tsx`'s `openGraph.images` / `twitter.images` already point at
`/og-image.png`. This was Cycle 035, pushed and confirmed live on
`www.elimux.ke` last session. Nothing to redo here.

## Part 2 — the important finding before writing any code
Before creating `src/lib/share.ts` and `src/components/ShareButton.tsx` as
asked, I searched the codebase for existing share infrastructure, because
the cycle's own rule ("Do NOT remove existing share/OG functionality")
implied something might already be there. It's more than "something":

- **`src/lib/share-utils.ts`** already has everything the spec's
  `share.ts` wants (Web Share API detection, clipboard fallback,
  `typeof navigator !== 'undefined'` guards) *plus* UTM tracking,
  6-platform share links (WhatsApp/Facebook/X/LinkedIn/Telegram/Email),
  trackable smart links, and share-event analytics (`/api/share-events`).
- **`src/hooks/useShare.ts`** is the real trigger hook (native share +
  clipboard, loading/error state).
- **`src/components/share/ShareButton.tsx`** (+ `ShareBottomSheet.tsx`,
  `ShareBar.tsx`, `ShareToast.tsx`, barrel-exported from
  `src/components/share/index.ts`) already does what the spec's new
  `ShareButton.tsx` wants — `floating` / `inline` / `icon-only` variants,
  native-share-first with a full multi-platform bottom sheet fallback —
  and does more (smart-link resolution, analytics).
- **`src/lib/share-metadata.ts`**'s `generateShareMetadata()` already *is*
  Step 6 (dynamic OG tags for detail pages) — and it's already wired into
  `app/programs/[id]/page.tsx`, `app/institutions/[id]/page.tsx`, *and*
  `app/scholarships/[id]/page.tsx` via each page's own `generateMetadata`.
  Nothing to add there.
- The new `ShareButton` (`@/components/share`) is already live on the
  **scholarship detail page** (icon-only, next to `ShareStats`) and the
  **search results page** (icon-only, shown once a query is active).

Writing a second, simpler, parallel `share.ts` + `ShareButton.tsx` at this
point would have meant a *third* share implementation in this codebase
(there's also an older `ShareModal.tsx`, wired into `DetailActions.tsx` —
used by the program and institution detail pages — plus `favorites/page.tsx`
and `CompareDrawer.tsx` via `ShareResultsModal.tsx`), fragmenting the
existing analytics/tracking and giving future maintainers three
inconsistent "Share" buttons to reason about. So: no new files. Instead I
wired the existing `@/components/share` `ShareButton` into the spots that
actually had nothing:

## Files Modified
- `src/components/MobileNav.tsx` — added an icon-only `ShareButton` next
  to the close (X) button in the full mobile-menu overlay header. Only
  place in the whole nav (desktop or mobile) that had zero share
  affordance.
- `src/components/home/NewHomePage.tsx` — added an icon-only `ShareButton`
  next to the hero's "AI-Powered Education & Career Hub" badge. The hero
  is *permanently* dark regardless of the site's light/dark toggle (an
  explicit, deliberate choice from an earlier cycle — see the comment
  already in that file), so the button's default light/dark-aware classes
  would have looked wrong there; overrode with `!` (Tailwind important
  modifier, available since this project runs Tailwind 3.4) to force a
  frosted white-on-dark look matching the existing hero badge.
- `src/components/Footer.tsx` — added an inline "Share ElimuX" button
  below the copyright line, styled with the footer's own existing design
  tokens (`bg-elimux-card` / `border-border` / `text-muted`) instead of
  the component's default light-mode classes, for the same dark-footer
  contrast reason as the hero.

All three use `getDefaultShareData('/', 'default')` from the existing
`share-utils.ts` (title/description/URL/OG-image/hashtags for the app
itself) rather than hand-typed duplicate strings — that helper already
existed for exactly this purpose and was previously unused.

## Deliberately not touched, and why
- **Program and institution detail pages** — already have a working share
  affordance (`DetailActions` → `ShareModal`). Spec's Step 4A wanted a
  `ShareButton` "near the Apply button" there; adding a second, different
  share button next to the existing one would be redundant UI, not new
  coverage, and the cycle's own rule says not to remove what's there. Left
  as-is; flagging here in case you want the older `ShareModal` on these
  two pages migrated to the newer `ShareButton` system in a future cycle
  (they'd gain the multi-platform bottom sheet and analytics tracking the
  older modal doesn't have).
- **Scholarship detail page and search results page** — already have
  `ShareButton` wired in (see above). Not duplicated.
- **`DesktopNav.tsx`** — the cycle's own Step 3 said "navbar (mobile) (or
  mobile nav component)" and the goal section says "navbar (mobile)"
  specifically; desktop users already have the browser's own address bar
  to copy/share a URL, so left untouched.

## Build/verify
`npm run build` (2.5GB heap cap) — exit 0, zero errors or warnings. Ran
`next start` and curl-checked the homepage — both new hero and footer
share buttons render server-side (2 `aria-label="Share this content"`
occurrences on `/`, as expected). The mobile-menu overlay button is
correctly absent from the initial HTML (that whole overlay only renders
once `open` state flips true, same as its sibling nav links and the
existing close button) — couldn't verify the actual tap-to-open behavior
without a real browser/device (Claude-in-Chrome extension not connected
this session), so that one specific case is code-reviewed and
build-verified but not visually confirmed.

## Not yet committed/pushed
Wanted to flag the "no new files, reused existing infrastructure instead"
decision before pushing it, since it's a real deviation from the literal
spec — let me know if this reasoning holds up or if you specifically
wanted the new parallel `share.ts`/`ShareButton.tsx` files for some reason
I'm not seeing (e.g. an intent to eventually delete the older systems).
