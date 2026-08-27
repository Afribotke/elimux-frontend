# Cycle 035 Report — Replace OG Social Share Image

## Status: DONE, `npm run build` green with zero errors, committed, pushed

Archived as `docs/archive/bridge-106.md` before this report replaced it
(that was Cycle 034's own report, kept for the record).

## File Modified
- `public/og-image-solid-bg.png` → copied to `public/og-image.png` (new
  file; no `og-image.png` existed before, so nothing was overwritten).
  1200×630, matches the dimensions already declared in metadata.
- `src/app/layout.tsx` — `metadata.openGraph` and `metadata.twitter`
  updated: new title/description copy (as given in the spec) and image
  now points at `/og-image.png` instead of the old absolute
  `https://www.elimux.ke/og-image.jpg`. Everything else in the metadata
  export (icons, manifest, keywords, robots, alternates, etc.) untouched.

## Step 3 — hardcoded tag search
`grep -r "og:image\|twitter:image" src/` — no matches. Nothing to remove.

## Verification
`npm run build` — exit 0, zero errors. Ran `next start` and pulled the
actual rendered `<head>` via curl rather than trusting the code change
alone: `og:image` resolves to `https://www.elimux.ke/og-image.png` (Next
auto-resolved the relative path against the existing `metadataBase`),
width/height/alt tags all present, `/og-image.png` itself serves 200.
Same for the `twitter:*` tags. Could not do the actual Ctrl+U view-source
in a live browser this session (Claude-in-Chrome extension not
connected) — the curl-against-`next start` check covers the same ground
(same HTML the browser would receive), but flagging the substitution
rather than claiming a literal browser check happened.

Committed as `feat: update OG social share image with branded banner`
and pushed to `origin/main`.

## Not touched, and why
- `public/og-image.jpg` (the old file) — now orphaned, nothing in the
  codebase references it anymore (confirmed via grep before making this
  change). Left in place rather than deleted — this cycle's own rules
  didn't ask for cleanup, only the swap, and deleting wasn't requested.
- `public/og-course.jpg`, `og-institution.jpg`, `og-program.jpg`,
  `og-scholarship.jpg`, `og-search.jpg`, `og-default.jpg` — these are
  separate per-page OG images (scholarships/[id], institutions/[id],
  programs/[id], search) set by their own page-level metadata, not the
  root default this cycle targeted. Confirmed via grep they're wired up
  independently and left them alone.
- Navbar, footer, favicon, PWA icons — untouched, per this cycle's rules.

## Step 5 — your action, once Vercel deploy is confirmed green
1. https://www.opengraph.xyz/url/https://www.elimux.ke — check the new
   banner (logo + category icons + URL) renders.
2. Share https://www.elimux.ke in WhatsApp and confirm the preview card.
   Note: WhatsApp/Facebook/LinkedIn all cache OG previews aggressively by
   URL — if an old preview still shows after the deploy is live, that's
   their cache, not the deploy. opengraph.xyz's scraper is fresh each
   time, so check there first; for WhatsApp specifically, sending the
   link to a chat that's never had it shared before avoids their cache
   entirely.
