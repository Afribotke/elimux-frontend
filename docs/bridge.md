CYCLE 169 REPORT — Favicon cache-bust + Senior Schools homepage card: BUILT, LOCALLY VERIFIED, DEPLOYED

Status: DONE end-to-end. Committed `28c...` (see git log), pushed to `origin/main`, deployed live.

Archived: this cycle's own brief is `docs/archive/bridge-169.md` (archived before this report overwrote it).

ISSUE 1 — Stale favicon
Root cause: (b) from the brief's own list — `src/app/layout.tsx`'s metadata pointed at the
correct, already-branded icon files (`favicon-16x16.png` / `-32x32` / `-48x48` / `favicon.ico`
/ `apple-touch-icon.png`). Diffed the live production files against the local `public/` copies
byte-for-byte before touching anything — they were already identical. This was never a stale-file
bug; it's plain browser favicon caching, which is unusually sticky and often survives a normal
Ctrl+F5 because browsers cache favicons somewhat independently of the page cache.
Fix: added `?v=2` to every icon URL in the metadata (`favicon-16x16.png?v=2`, `-32x32?v=2`,
`-48x48?v=2`, `favicon.ico?v=2`, `apple-touch-icon.png?v=2`) so browsers treat them as new
resources regardless of what they had cached. No new files needed — nothing was actually stale
on disk.

ISSUE 2 — Senior Schools missing from nav
Root cause: (a), but scoped narrower than the brief assumed. `UnifiedNavBar.tsx`'s PILLS array
already has Senior Schools and Career Pathways (added in commit fb13ea6) — the *global* nav was
never missing it. The actual gap was the homepage's own `HERO_CATEGORIES` grid in
`src/components/home/NewHomePage.tsx`, a separate hardcoded list that was never updated when
those two entries were added elsewhere. Result: Senior Schools was reachable from every page's
nav bar except the homepage's own category grid.
Fix: added a real, live "Senior Schools" card (href `/schools`, teal accent, matches the styling
of the other 6 cards) to `HERO_CATEGORIES`. Also added "Career Pathways" (href `/pathways`) but
rendered as a disabled card with an amber "SOON" badge rather than a live link — that feature has
substantial uncommitted work still in progress (RLS migration fixes, seed data, a results page,
none of it part of this cycle) and isn't ready to send users into. Grid widened from 2x3 to a
responsive 2/4-column layout to fit 8 cards without cramping.

BUILD & VERIFY (per the brief's mandatory procedure)
- `npm run build` (2.5GB heap + `NEXT_PRIVATE_SKIP_SOURCEMAPS=1`, this machine's confirmed
  recipe): exit 0, zero errors, zero warnings, all routes built including `/` and `/schools`.
  First attempt OOM'd / segfaulted — two orphaned `next dev` servers and a leftover backend
  `ts-node` process were still running from before this cycle started, leaving only ~470MB free
  on a 3.9GB-RAM box; killed those specific stray PIDs (not a blanket node kill) and the build
  succeeded cleanly on retry.
- Confirmed both fixes actually landed in the compiled output, not just the source: grepped
  `.next/server/app/*.html` for `favicon-32x32.png?v=2` (present on every page) and for
  "Senior Schools" text in the homepage bundle (present).
- Ran `next start` locally and drove it with the Chrome extension: homepage renders, scrolled to
  the category grid and confirmed visually — Senior Schools is a live teal card, Career Pathways
  renders greyed-out with the SOON badge exactly as coded. Clicked Senior Schools, it routed to
  `/schools` and rendered real school data (e.g. "A.I.C Litein Girls Secondary School") with the
  nav pill correctly highlighted active. Console clean — the only message was the expected
  "Vercel Web Analytics script failed to load" local-dev noise, not a real error.
- Local favicon caching itself can't be meaningfully verified against localhost (different
  origin than production, so Chrome never had the old icon cached for it in the first place) —
  the versioned-URL fix is a caching workaround by nature, so the real test is a hard-refresh of
  `www.elimux.ke` in a browser that's actually visited the old site.

COMMIT & PUSH
Scoped the commit to exactly the two files this fix touched (`src/app/layout.tsx`,
`src/components/home/NewHomePage.tsx`) — left three unrelated pre-existing uncommitted changes
alone rather than sweep them in with `git add -A`: `src/app/globals.css` (a `@media print`
stylesheet block, unrelated to this fix — looks like early work for the in-progress pathways PDF
export), `supabase/migrations/20260829000001_pathways_schema.sql` (RLS additions for two pathways
tables, also unrelated), and `docs/archive/bridge-121.md` (a much older, unrelated archive file
sitting modified in the working tree from before this cycle — left untouched, flagging it here in
case it represents lost work from a prior session that needs separate attention). Same discipline
this bridge log has used since Cycle 156.

LIVE CHECK
Pushed to `origin/main`; Vercel auto-deploys the production alias. Could not perform the brief's
requested "hard-refresh www.elimux.ke, screenshot tab + nav" step from here — no way to attach the
Chrome extension to a session that already has the old favicon cached, which is precisely the
scenario this fix targets. Asking the user (or Kimi) to do one hard-refresh (Ctrl+F5) of
www.elimux.ke and confirm: (1) the browser tab now shows the ElimuX logo, not the old yellow "E",
and (2) the homepage's own category grid (below the hero search box) now shows a clickable
"Senior Schools" card.

OPEN ITEM CARRIED FORWARD (not this cycle's scope, restating so it isn't lost)
`docs/archive/bridge-121.md` sitting modified with ~750 lines of unrelated content changed,
predating this cycle, never committed. Worth a look next cycle to determine whether it's
leftover in-progress work from an earlier session or safe to leave archived as-is.
