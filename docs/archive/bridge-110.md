# Cycle 038 Report — PWA Icon Re-Audit + Cache-Control Headers

## Status: DONE, `npm run build` green with zero errors, committed, pushed
## — but the audit found no bug, so this likely won't fix the reported
## Android screenshot by itself. Read the "what this doesn't fix" section.

Archived as `docs/archive/bridge-109.md` before this report replaced it.
Note: the `elimux-pwa-icons-complete.zip` mentioned in the cycle brief was
never actually placed on this filesystem (only referenced via a
`sandbox://` link from another AI session, which isn't reachable from
here) — Step 3 (copy files from the zip) could not be executed. Based on
the audit below, it's very likely a no-op anyway.

## Step 1 — manifest audit
`public/manifest.json`'s `icons` array is byte-identical to what I audited
in Cycle 034: all 8 standard sizes (72–512) plus 192/512 maskable, every
`src` pointing at a file that exists. No missing sizes, no path mismatches.

## Step 2 — icon file audit
All 16 files (8 standard + 8 maskable, 72 through 512) exist in `public/`,
sizes scale sensibly with resolution (72px ≈ 6–11KB up to 512px ≈
160–294KB — no suspiciously-tiny file that would indicate a leftover old
icon). Spot-checked five of them directly with the Read tool (72, 192,
192-maskable, 384, 512-maskable) — all five show the correct circular
blue-purple badge, none show the old yellow "E". Combined with Cycle 034's
own verification (which downloaded the live production file and confirmed
the same), and this session's own earlier re-check against
`www.elimux.ke` before this cycle even started — there is no code-level
bug here. Every manifest-referenced icon, in the repo and on production,
is already correct.

## Step 3 — file replacement
Not executed — no zip was ever delivered to this filesystem, and per the
Step 2 audit, all 16 target files already hold the correct new icon.

## Step 4 — manifest update
No changes made. The manifest already has maskable entries (192, 512) and
every path already resolves — matches the cycle's own fallback ("If the
manifest already had maskable entries, preserve them and just update the
file paths" — the paths were already correct).

## Step 5 — cache-control headers
Added, but the cycle's own snippet had a bug: `source: '/icon-:size*'` is
invalid syntax for this project's Next.js/path-to-regexp version — it
failed the build immediately (`TypeError: Can not repeat "size" without a
prefix and suffix`). Fixed by switching to a named-parameter-with-custom-
regex form instead: `source: '/icon-:size(.*)'`, which is valid and does
the same job. Verified via `next start` + curl that
`Cache-Control: public, max-age=0, must-revalidate` is now actually
present on `/icon-192x192.png` and `/manifest.json` responses (and, as a
side effect of the pattern, `/icon-128.png` too — harmless, that's the
separate navbar/admin-sidebar icon from Cycle 033) — and confirmed
`/favicon.ico` correctly did **not** pick up the new header, staying in
scope to icons only as the cycle asked.

## What this does and doesn't fix
This header change affects **future** requests for these files — it stops
browsers from caching them long-term going forward. It does **not**
retroactively fix an already-installed PWA's home-screen icon on a
specific Android device. That's a well-known platform behavior, not a
bug in this app: Android bakes the icon into the OS's app-shortcut/icon
store at *install time*, and an already-installed PWA does not
dynamically re-fetch a new icon from an updated manifest — Chrome's own
"clear cached images and files" doesn't touch that OS-level icon store
either. The only things that actually update it are (a) uninstalling and
reinstalling the PWA, or (b) a fresh install on a device that never had
it. I gave you both of those steps two cycles ago; if the screenshot
you're working from predates trying that, it's worth trying again now
specifically on that device before assuming there's still a code problem
here — because at this point I've verified the same 16 files are correct
in the repo, in this build, and live on production, twice, across two
sessions.

## Files Modified
- `next.config.js` — added `headers()` (didn't exist before) with the two
  cache-control rules, using the corrected source pattern.
- No icon files changed (all 16 already correct — see Step 2).
- No `manifest.json` changes (already correct — see Step 1 and 4).

## Verification
`npm run build` — exit 0 after the syntax fix (failed once first, on the
cycle's own snippet, before I corrected it). Ran `next start` and
curl-checked headers directly rather than trusting the config alone (see
Step 5). Could not do the literal Chrome DevTools → Application →
Manifest panel check — Claude-in-Chrome extension not connected this
session; substituted direct header inspection + file inspection instead.

Committed and pushed to `origin/main`.
