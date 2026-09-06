# Cycle 050 Report — PWA Identity Lock & Duplicate Cleanup: built, build clean,
## one manifest gap found and fixed, NOT deployed (holding per Rule 6)

## Status: `npx tsc --noEmit` and `npm run build` both clean, zero errors.
## `public/manifest.json` verified valid JSON with id/start_url/scope all
## "/", matching Step 5d's expected output exactly. Nothing committed,
## staged, or deployed - waiting for explicit go-ahead per Section 6.

Archived as `docs/archive/bridge-127.md` before this replaced it.

This cycle's own brief (self-labeled "BRIDGE-125"/"Cycle 050") again
overwrote `docs/bridge.md` without archiving the prior report first -
this time Cycle 049's report. Recovered it from this session's own
transcript (still in context - written the same session) and archived
it to `docs/archive/bridge-126.md` before executing. Unlike the
Cycle 049 brief, this one's own numbering was already correct (050
correctly follows 049) and its Section 4 correctly named the exact
Cycle 049 files not to touch - so only the missing archive step needed
fixing, not the cycle number.

## What was built

- `public/manifest.json` - added `"id": "/"` as the first field, per
  Step 1.
- `src/components/PWACleanupBanner.tsx` - new file, built exactly per
  the brief's Step 2 snippet (standalone-mode-only banner, dismissal
  persisted in `localStorage`).
- `src/app/layout.tsx` - added the import and rendered
  `<PWACleanupBanner />` as the first child inside `<body>`, per Step 3.

## Deviation from the brief (gap found and fixed, not applied as written)

The brief's Step 1 target snippet included `"scope": "/"`, and its own
Step 5d verification script expects to print `scope: /`. The real
`public/manifest.json` had no `scope` field at all before this cycle -
confirmed by reading the file first, per Step 0's audit instruction to
"record" the existing start_url/scope values. Browsers default an
absent `scope` to the manifest's directory (effectively `/` here, since
`start_url` is `/`), so nothing was functionally broken - but Step 5d
would have printed `scope: undefined`, and the brief's own CRITICAL
RULES say scope "must stay '/' forever," which only means something if
the field exists to hold that value. Added `"scope": "/"` alongside
`"id": "/"` so the identity-locking intent and the verification script
both actually hold.

All other existing manifest fields (`description`, the real brand
colors `#ffffff`/`#1e40af`, `orientation: portrait-primary`, and the
full 10-icon set including maskable variants at root-level `/icon-*.png`
paths) were left untouched - the brief's own Step 1 target JSON used a
different icon set (`/icons/icon-192x192.png` etc., only 2 sizes, no
maskable, no description) that doesn't match this repo; per the brief's
own instruction ("preserve all existing fields, only add id"), kept the
real fields and added only `id` and `scope`.

## Verification done

- `npx tsc --noEmit`: zero errors.
- `npm run build`: zero errors, all routes generated.
- `node -e "JSON.parse(...)"`: manifest parses as valid JSON.
- `node -e "... m.id / m.start_url / m.scope"`: printed exactly
  `id: /`, `start_url: /`, `scope: /`, matching Step 5d's expected
  output.
- Confirmed via `git diff --stat` and file hashes that `src/hooks/usePWAUpdate.ts`,
  `src/components/PWAUpdateToast.tsx`, and `public/sw.js` (Cycle 049's
  files) are byte-identical to their post-Cycle-049 state - Section 4's
  "must remain untouched" requirement holds.
- Confirmed via `git status` that this cycle touched only
  `public/manifest.json`, `src/app/layout.tsx`, and the new
  `PWACleanupBanner.tsx` - no overlap with the staged Career Pathways
  files or the admin-users-table redesign.

Did not run the preview-deploy test checklist in Section 6 (install-prompt
re-evaluation, mobile emulator single-icon check, standalone-mode banner
visibility) - that section explicitly says to stop and wait for
explicit go-ahead before any deploy, which this report is doing.

## Files changed

`public/manifest.json` (added 2 fields), `src/app/layout.tsx` (added
import + 1 JSX line), `src/components/PWACleanupBanner.tsx` (new).

## Next step

Preview deploy + the Section 6 checklist (install prompt, single-icon
check in a mobile emulator, banner visibility in standalone mode, dismiss
persistence, and an in-place-update check with no new icon) is next -
waiting for explicit go-ahead, same as Cycle 049's production hold.
