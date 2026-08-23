# Cycle 026 (CORRECTED) — TVETA Scraper Key: premise was false

## Note to Kimi

Cycle 026 (archived: `docs/archive/bridge-042.md`) instructed the founder to
test a `TVETA_SCRAPER_KEY` secret and check that `.github/workflows/scrape-tveta.yml`
references `secrets.TVETA_SCRAPER_KEY`. Verified directly against the live
`elimux-backend` repo before anyone ran Step 1 (which would have burned a
manual GitHub Actions run) — **that key does not exist anywhere in this
codebase, and that workflow file does not exist.**

### What's actually there

- `grep -r "TVETA_SCRAPER_KEY" elimux-backend` — zero matches, in any `.ts`,
  `.js`, or `.yml` file.
- Workflow files present: `.github/workflows/keep-alive.yml` and
  `.github/workflows/scraper-cron.yml`. No `scrape-tveta.yml`.
- The TVETA trigger is the `scrape-tveta` **job** inside
  `scraper-cron.yml` (not its own file), and it still posts with
  `-H "x-admin-key: ${{ secrets.ADMIN_KEY }}"`.
- `src/middleware/auth.ts:41` — `adminAuth` still does
  `const expected = process.env.ADMIN_KEY`. No `TVETA_SCRAPER_KEY` branch
  exists in that file or anywhere else in `src/`.

### Root cause of the original 401 (GitHub Actions run pasted by founder)

The workflow rendered `-H "x-admin-key: "` — completely empty, not wrong.
That's the signature of an unset `secrets.X` reference, not a bad value.
Confirmed via Railway CLI that `ADMIN_KEY` **is** set on `elimux-backend`
(production environment, 45 chars) — so the gap is specifically that the
GitHub repo secret `ADMIN_KEY` on `github.com/Afribotke/elimux-backend`
is missing or stale. No code or Railway change needed.

### Status

- If `TVETA_SCRAPER_KEY` was created in Railway and/or GitHub secrets per
  Cycle 026's instruction, it is currently unused dead configuration —
  nothing in the code reads it.
- Fix in progress on the founder's side: set the GitHub Actions repo
  secret `ADMIN_KEY` to match Railway's `ADMIN_KEY` value, then re-run
  `scrape-tveta` (job inside `scraper-cron.yml`).
- If a real migration to a dedicated `TVETA_SCRAPER_KEY` (separate from
  the shared `ADMIN_KEY`) is actually wanted, that's unbuilt work — needs
  an explicit ask, since it means editing `auth.ts` and the workflow, not
  just setting secrets.

### Verification commands used (read-only, no writes)

```bash
grep -rn "TVETA_SCRAPER_KEY" elimux-backend --include="*.ts" --include="*.js" --include="*.yml"
ls elimux-backend/.github/workflows/
sed -n '39,42p' elimux-backend/src/middleware/auth.ts
railway variable list --service elimux-backend --environment production --json   # checked key presence/length only, value never printed
```

DO NOT run Cycle 026 Step 1/2 as written — it tests a key the backend
cannot possibly accept. Await founder confirmation once the GitHub
`ADMIN_KEY` secret is corrected, then re-run `scrape-tveta` and report
green/red.
