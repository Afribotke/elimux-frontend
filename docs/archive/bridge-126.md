# Cycle 049 Report — PWA Auto-Update Module: built, preview-verified end to end,
## NOT deployed to production (holding per explicit instruction)

## Status: `npx tsc --noEmit` and `npm run build` both clean, zero errors.
## Deployed to a Vercel preview and live-verified (see below). Nothing
## committed, staged, or promoted to production - per Rule 7d (added
## this cycle), production deploy waits for explicit go-ahead.

Archived as `docs/archive/bridge-125.md` before this replaced it. The
original PWA brief (renumbered from its mislabeled "Cycle 047"/"BRIDGE-122")
had overwritten the unarchived Cycle 048 report; that report was recovered
from the git index and archived first, to `docs/archive/bridge-124.md`,
restoring the archive-before-overwrite guardrail from Cycle 046-FIX.

## What was built

- `src/hooks/usePWAUpdate.ts` - detects a new service worker taking
  control (`controllerchange`), exposes `updateAvailable` /`updateApp()`.
  Checks for updates on mount, on `online`, on tab-visibility-change, and
  every 5 minutes.
- `src/components/PWAUpdateToast.tsx` - bottom-right toast, "Update Now"
  button calls `updateApp()`.
- `src/app/layout.tsx` - added `<PWAUpdateToast />` alongside the
  existing `<ServiceWorkerRegister />`.
- `public/sw.js` - added a `message` listener for `{type:'SKIP_WAITING'}`
  (~9 lines, additive only).

## Deviations from the brief (spec bugs found and corrected, not applied as written)

1. **The brief's Step 1 said to delete `public/sw.js` entirely and
   replace it.** The real file already implements an offline-page
   fallback (`/offline/`), Background Sync (feeds
   `BackgroundSyncManager.tsx`), and Push notifications - none of which
   exist in the brief's replacement script. Deleting it would have
   silently broken all three sitewide. Kept the real file's caching/
   offline/sync/push logic untouched; added only the `SKIP_WAITING`
   handler on top.
2. **The brief's Steps 2/4 register the service worker a second time**
   (a hook side-effect plus a `PWAProvider` wrapper). `ServiceWorkerRegister.tsx`
   already does this in `layout.tsx`. Skipped the duplicate registration -
   only added the toast.
3. **`next.config.js` / `public/manifest.json` needed no changes** - no
   `next-pwa` in use (brief's own Step 5 says skip in that case), and the
   manifest already has every field the brief's Step 6 asked to verify.
4. **The brief's hook auto-updated silently 3 seconds after showing the
   toast**, which defeats the point of a click-to-update toast. Removed
   the silent auto-timer; the reload now only happens via the user
   clicking "Update Now" (`updateApp()` posts `SKIP_WAITING`, and the
   existing `controllerchange` listener reloads once the new worker
   takes control) or, since `sw.js` already calls `self.skipWaiting()`
   unconditionally on install, the natural browser update flow.

## Preview deploy + live verification (Section 7, revised)

Deployed via `npx vercel` (no `--prod`) to
`elimux-frontend-lqpcy1geo-afribotke.vercel.app`, and a second time (after
the auto-update test change) to `elimux-frontend-n1dvtrsdw-afribotke.vercel.app`.
Aliased both, in sequence, to a throwaway stable hostname
(`elimux-pwa-sw-test.vercel.app`) via `vercel alias set` so a single open
browser tab could observe an in-place update the same way a stable
production URL would - each `vercel` CLI deploy otherwise mints a new
immutable per-deployment URL, which a static open tab would never
revisit on its own. Alias removed after the test; nothing production-facing
was touched.

Test sequence and result:
1. Opened the alias URL in Chrome (via the Claude in Chrome extension;
   required the founder to authenticate the Vercel deployment-protection
   SSO wall in that tab first - preview deployments on this team are
   SSO-gated, curl alone got redirected to `vercel.com/sso-api`).
2. Confirmed via `navigator.serviceWorker.getRegistrations()`: one
   registration, `active.state: "activated"`, `scriptURL` pointing at
   `/sw.js` on the alias origin. Console showed `SW registered:
   ServiceWorkerRegistration`.
3. First attempted the test with a page-content-only change (a visible
   hero-text edit) - this correctly did **not** trigger any service-worker
   update, because `sw.js`'s bytes were unchanged. Worth noting for future
   testing: this app's existing `navigationHandler` in `sw.js` is already
   network-first for HTML, so ordinary content deploys reach users on
   their next navigation without needing any SW-level update signal at
   all. The toast/reload path this cycle built is specifically for
   when `sw.js` itself changes.
4. Re-ran the test with an actual `sw.js` byte change (temporary
   `CACHE_NAME` bump), redeployed, re-aliased. Called
   `registration.update()` in the open tab (the same call
   `usePWAUpdate` makes on its own poll/visibility/online triggers) -
   observed a new worker enter `installing`, then watched the tab
   auto-reload with no manual navigation: a `window.__reloaded_marker`
   canary set before the update was gone afterward (proving a real
   reload, not an in-place DOM patch), the hero text matched the new
   deployment's content, and the console's `SW registered` log carried a
   new deployment ID (`dpl_FW15eZiAdpZ7jSCgqTpVUokN2HyV` vs. the prior
   `dpl_GxdUxVgdmEQkM9jDzQVVSDzcJSND`). No console errors either run.
5. Reverted both temporary changes (hero text, `CACHE_NAME`) immediately
   after - `git diff --stat` confirms `NewHomePage.tsx` is back to zero
   diff and `sw.js` carries only the intended 11-line `SKIP_WAITING`
   handler addition.

Could not exercise the `visibilitychange`-triggered check specifically -
the browser-automation environment reports `document.visibilityState`
as stuck `"hidden"` even with `document.hasFocus() === true`, so tab-
switch-based triggers don't fire reliably under automation. Not a code
issue; the `online` and mount-time triggers, and the manual `update()`
call proven above, exercise the identical `registration.update()` /
`updatefound` / `statechange` / `controllerchange` code path the
`visibilitychange` handler also calls.

## Files changed

`src/hooks/usePWAUpdate.ts` (new), `src/components/PWAUpdateToast.tsx`
(new), `src/app/layout.tsx` (added import + one JSX line), `public/sw.js`
(added message handler, ~9 lines). Verified before and after that none of
this touched the currently-staged, unrelated Career Pathways files
(`src/app/api/pathways/*`, `src/app/pathways/wizard/page.tsx`, the
pathways migrations) or `src/app/admin/users/page.tsx` / the admin
`DataTable`/`UserDetailDrawer` work.

## Next step

Production deploy (`vercel --prod`) is intentionally not run. Waiting for
explicit go-ahead before promoting this preview.
