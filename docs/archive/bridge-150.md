# Supabase SDK version bump — builds clean, NOT committed/deployed yet

Prior content archived to `docs/archive/bridge-149.md`.

## What happened

Ran the suggested version bump:
```
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```
`@supabase/supabase-js` 2.47.0 → 2.112.4, `@supabase/ssr` 0.5.2 → 0.12.5 —
a large jump (~65 minor versions on the first package), so there was real
risk of breaking API changes.

`npx tsc --noEmit`: clean. `npm run build`: exit 0, every route compiled,
nothing broke. Middleware bundle grew 66kB → 94.3kB (expected - newer SDK,
bigger bundle - not a red flag on its own).

## Status: not committed, not deployed, not tested live yet

This only touches `package.json`/`package-lock.json` (dependency bump) plus
whatever `npm install` regenerated in the lockfile - no source files
changed. Waiting on the go-ahead to commit + push before deploying and
retrying the signed-in test a third time, per this session's standing
pattern of confirming before every push.

## Once approved, the plan

1. Commit `package.json` + `package-lock.json` only, scoped (this repo's
   git index carries pre-existing unrelated staged content from earlier
   work this session - always pathspec the commit rather than a blanket
   add).
2. Push, wait for the Vercel deploy, confirm the alias.
3. Retry the signed-in test live (create a throwaway account, sign in,
   watch the `[Login]` console trail) - this will tell us definitively
   whether the version bump actually fixes the `signInWithPassword()` /
   `setSession()` hang, or whether it's still stuck at the same step.
4. Either way, report back with the real result rather than assuming the
   bump fixed it just because the build passed - a clean build only proves
   the API surface didn't change, not that the runtime hang is gone.
