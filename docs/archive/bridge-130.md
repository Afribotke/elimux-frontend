# Cycle 050 Production Deploy — PWA Identity Lock & Duplicate Cleanup is
## LIVE on www.elimux.ke; unrelated staged work deliberately excluded

## Status: Deployed to production (`target: "production"` confirmed).
## Live-verified via curl against www.elimux.ke: manifest id/start_url/
## scope all "/", sw.js carries the SKIP_WAITING handler, homepage 200.

Archived as `docs/archive/bridge-129.md` before this replaced it.

## What went to production

Only the Cycle 049 + Cycle 050 PWA work:
`public/manifest.json`, `public/sw.js`, `src/app/layout.tsx`,
`src/components/PWAUpdateToast.tsx`, `src/hooks/usePWAUpdate.ts`,
`src/components/PWACleanupBanner.tsx`.

## Deliberately excluded from this deploy

Founder said "vercel --prod, go," but `vercel --prod` deploys whatever
is on disk, not just what was tested - and the working tree also held
other unrelated, uncommitted work: Career Pathways Phase 2 (with a real
RLS bug in the already-applied Phase 1 migration that has never been
manually pasted into Supabase - see Cycle 048; shipping that code before
the fix would make `/api/kjsa/analyze` return 0% fit for every live
user), the admin users-table redesign, and several loose `public/`
marketing assets. Flagged this before deploying; founder chose to scope
the deploy to PWA-only.

Mechanics: `git stash push -u -- <the ~15 non-PWA paths>`, confirmed the
working tree held only PWA + docs changes, ran a fresh `npm run build`
to confirm that scoped state still compiles clean, deployed, then
`git stash pop` to restore everything - `git status` before and after
match, nothing lost. All of that Pathways/admin work remains exactly as
it was: uncommitted, unstaged/staged as before, not on production.

## Live verification (production)

- `curl https://www.elimux.ke/manifest.json` → `id: /`, `start_url: /`,
  `scope: /`.
- `curl https://www.elimux.ke/sw.js` → contains the `SKIP_WAITING`
  message handler.
- `curl -o /dev/null -w "%{http_code}" https://www.elimux.ke/` → `200`.

Did not repeat the device-dependent checks (install/single-icon,
standalone-mode banner) against production - those were already flagged
in the prior report as needing a real phone, not something this
automation stack can do on preview or production alike.

## Files changed

None this cycle beyond the deploy itself - the stash/pop round-trip is
a no-op on file contents (verified via `git status` before/after).

## Next step

None outstanding for the PWA work. The Pathways Phase 2 RLS fix
(`supabase/migrations/20260829000002_pathways_rls_fix.sql`) still needs
manual application to Supabase before Phase 2 code is safe to ship -
unrelated to this cycle, carried over from Cycle 048's own report.
