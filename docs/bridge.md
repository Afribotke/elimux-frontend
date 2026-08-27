# Cycle 037 Report — Unify Share System (ShareModal → ShareButton)

## Status: DONE, `npm run build` green with zero errors, one real bug in the
## drafted spec caught and worked around, committed and pushed

Archived as `docs/archive/bridge-108.md` before this report replaced it.

## Step 1 audit — corrections to two of the drafted spec's assumptions
Read all five named files before touching anything. Two things in the
spec's own analysis didn't hold up:

1. **"The old [ShareModal] doesn't [have analytics]" is wrong.**
   `ShareModal.tsx` called `trackEvent('share', {platform, url, item_type})`
   from `@/lib/analytics` on every copy/WhatsApp/email action — a real,
   already-consumed pipeline (`POST /api/admin/analytics/track`, feeding
   `analytics_events`). It's a *different* pipeline than the new system's
   `trackShareEvent` → `/api/share-events`, not an absent one. Net effect
   of this migration: program/institution shares stop appearing in
   whatever consumes `analytics_events` with `event_type='share'`, and
   start appearing in the newer `share_events` table instead (with better
   data — per-platform, smart-link-aware). Flagging in case anything on
   the backend/admin side still queries the old table for this.

2. **`ShareResultsModal.tsx` is not a second copy of the old system** — it
   shares a *set* of programs (a comparison or search's top picks) as one
   link via `createSharedSearch`, plus a print-to-PDF report. The new
   `ShareButton`/`ShareData` shape has no concept of "N programs bundled
   as one link." Migrating `CompareDrawer.tsx` to `ShareButton` as the
   spec's Step 4 suggested checking would have deleted the multi-program
   link and PDF-export features outright — not a cleanup, a regression.
   Left `ShareResultsModal.tsx` and `CompareDrawer.tsx` untouched; updated
   its header comment (it referenced the now-deleted `ShareModal.tsx`) to
   explain why it stays separate.

The spec's own `getDefaultShareData(path, pageType, { title, description,
image })` snippet also doesn't match the real function signature (it only
takes `(path, pageType)`, no third override argument) — didn't add that
parameter since program/institution pages need fully dynamic per-item
data anyway; built `shareData` objects inline instead, matching the exact
pattern `scholarships/[id]/page.tsx` already uses for the same reason.

## Files Modified
- `src/components/DetailActions.tsx` — now renders `ShareButton`
  (icon-only, `contentType`/`contentId` wired for smart-link resolution)
  instead of opening `ShareModal`. This is the single change point for
  both program and institution detail pages (neither page.tsx needed
  touching — matches the spec's own fallback for "if the page structure
  doesn't allow direct insertion").
- `src/components/ProgramCard.tsx` — same swap for the card-level share
  icon (top-left corner of every program card, e.g. on institution detail
  pages' program lists, `/programs`, search results). Removed the now-dead
  `useState` import along with the local `shareOpen` state.
- `src/app/favorites/page.tsx` — same swap for both the programs and
  institutions sections; removed the `openShare`/`shareTarget` state and
  the `ShareTarget` interface entirely.
- `src/components/ShareResultsModal.tsx` — comment only (see above).
- `src/components/BackgroundSyncManager.tsx` — comment only; it referenced
  `ShareModal` by name to explain why share actions aren't queued for
  offline replay. Updated to describe the real (still true) reason —
  the new system's smart-link/analytics calls are fire-and-forget
  best-effort pings too, so the "nothing worth protecting" conclusion
  still holds, just not via the deleted file's name.
- `src/components/ShareModal.tsx` — **deleted**.

## Step 5 — orphan search
`grep -r "ShareModal" src/` and `grep -r "share-modal" src/` — zero
matches. Clean.

## Step 6 verification
`npm run build` — exit 0, zero errors. Ran `next start` and checked real
pages rather than trusting the diff alone:
- A real program detail page → exactly 1 `ShareButton` (DetailActions).
- A real institution detail page → 27 `ShareButton`s: 1 (DetailActions,
  the institution itself) + 26 (one `ProgramCard` per program that
  institution lists) — matched the page's own 26 unique `/programs/...`
  links exactly, confirming the `ProgramCard` swap works at scale, not
  just in isolation.
- `/favorites` — 200, compiles clean (client-rendered, so its buttons
  don't show in static HTML — same limitation as every other
  client-component check this session).
- Scholarship and search pages were **not touched** by this migration
  (already on the new system before this cycle) — not re-verified, since
  nothing in their code changed.

Could not do the actual tap-to-open-bottom-sheet check on a real
device/browser (Claude-in-Chrome extension not connected this session) —
build- and HTML-verified, not visually confirmed on either program or
institution pages.

Committed and pushed to `origin/main`.

## Rules check
- Existing share/OG functionality on scholarship and search pages:
  untouched.
- Analytics tracking: not "removed" so much as switched pipelines (see
  correction #1 above) — flagging rather than claiming zero change.
- Dead code: `ShareModal.tsx` deleted, all its imports removed, two
  stale comments naming it corrected. `grep` confirms nothing orphaned.
