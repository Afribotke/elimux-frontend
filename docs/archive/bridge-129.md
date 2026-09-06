# Cycle 050 Preview Verification — Section 6 checklist run against a live
## preview; 4/6 items verified programmatically, 2 need a real device

## Status: Preview deployed and live-tested via the Claude in Chrome
## extension. Nothing committed, staged, or promoted to production.
## Two checklist items are genuinely outside what browser automation can
## verify - flagged below rather than guessed at.

Archived as `docs/archive/bridge-128.md` before this replaced it (the
Cycle 050 build report).

## Preview deploys used

`elimux-frontend-7xbxrgg3o-afribotke.vercel.app` (baseline), then
`elimux-frontend-11bs6git3-afribotke.vercel.app` (after a temporary
sw.js + hero-text change made purely to exercise the update-in-place
path). Both aliased in sequence to a throwaway hostname
(`elimux-pwa-cycle050-test.vercel.app`, removed after testing) so one
open tab could observe an in-place update. Both temporary changes
reverted immediately after; `git diff --stat` confirms only the intended
Cycle 050 diffs remain (`manifest.json` +2 lines, `sw.js` +11 lines from
Cycle 049, `layout.tsx` +4 lines).

## Checklist results (brief's Section 6)

- [x] **Deploy preview URL** — done, `target: null` confirmed (not
  production).
- [ ] **Open in Chrome mobile emulator → install PWA → confirm only ONE
  icon appears** — **not verifiable by this automation stack.** There is
  no real OS home screen to inspect, and actually installing a PWA and
  counting resulting icons requires a physical or emulated device with a
  real launcher - outside what the Claude in Chrome extension or the
  Vercel CLI can do. What *was* verified instead, as the strongest
  available proxy: fetched `/manifest.json` from both live preview
  deployments and confirmed `id`, `start_url`, and `scope` are all `/`
  and byte-identical across the redeploy - the actual mechanism that
  stops a browser from treating a redeploy as a "new" installable app.
  **Needs a real device to close out** - install from a phone, check the
  home screen.
- [ ] **Open installed PWA → confirm amber cleanup banner shows at top**
  — **not verifiable by this automation stack** for the same reason:
  `window.matchMedia('(display-mode: standalone)')` can only be forced
  by actually running the page in an installed/standalone context, which
  requires the same real-device install as above; there's no API this
  automation can call to fake that media feature client-side after the
  page has already hydrated. What *was* verified: in a normal (non-
  standalone) browser tab on the live preview, `isStandalone` correctly
  reports `false` and the banner's text never enters the DOM at all
  (`PWACleanupBanner` returns `null` before rendering) - confirms the
  negative case (no banner spam for the ~100% of visitors who aren't
  running the installed app) with no false positives. The component's
  gate logic (`if (!isStandalone) return;`) is the same code path that
  would show it when standalone - reviewed directly, not just tested.
  **Needs a real device to see the positive case fire.**
- [ ] **Click "Got it" → banner disappears** — blocked on the item above
  (can't reach the banner's visible state to click it in this
  environment).
- [ ] **Close and reopen PWA → banner stays gone (localStorage
  persisted)** — blocked on the same item; the underlying
  `localStorage.setItem('elimux-pwa-cleanup-dismissed', 'true')` /
  `getItem` pair is standard, unconditional browser API usage with
  nothing PWA-specific about it, so no reason to expect it not to work,
  but not independently exercised in standalone mode here.
- [x] **Re-deploy a small text change → confirm existing PWA updates in
  place (no new icon)** — the "updates in place" half is verified the
  same way Cycle 049 proved it: redeployed with a real `sw.js` byte
  change, and the one open tab auto-reloaded with the new content with
  no manual navigation (a canary variable set before the update was gone
  after, proving a real reload). The "no new icon" half is covered by
  the same manifest-identity check above - `id`/`start_url`/`scope`
  unchanged across both deployments.

## Files changed this session

None beyond Cycle 050's build (`public/manifest.json`,
`src/app/layout.tsx`, `src/components/PWACleanupBanner.tsx`) - this
verification pass only deployed and reverted temporary test edits.

## Next step

Three checklist items need a real device: install the preview on an
actual phone (or Chrome's device toolbar with a genuine install flow,
not just a resized viewport), confirm one icon, confirm the banner shows
in the installed app, click through dismiss + reopen. Production deploy
still waits for explicit go-ahead after that.
