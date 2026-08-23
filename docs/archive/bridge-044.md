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

---

## Addendum — Cycle 026 follow-up: 4-step verification re-run, 2 tasks halted

Founder relayed a near-identical 4-step verification (previous archive:
`docs/archive/bridge-043.md` is this same file pre-addendum). Re-checked
against live state, including one thing not checked before — whether
`TVETA_SCRAPER_KEY` actually exists as a Railway variable (only the code
had been checked previously, not the env var itself).

### New finding

`TVETA_SCRAPER_KEY` **is** set as a Railway env var on `elimux-backend`
(production environment) — confirmed present via `railway variable list
--service elimux-backend --environment production --json` (existence/key
name only; value never fetched into this session). So the variable was
genuinely created per Cycle 026's instruction. It is still dead: nothing
in `src/` reads `process.env.TVETA_SCRAPER_KEY`, only `auth.ts:41`'s
`process.env.ADMIN_KEY`.

### Step-by-step outcome

1. **Test live API with `TVETA_SCRAPER_KEY`** — HALTED. Not run. Any
   result would be meaningless: `adminAuth` never compares against this
   variable, so the call 401s regardless of whether the key value itself
   is correct. Running it would only reproduce the already-known "backend
   ignores this header value" fact, not test the key.
2. **Check workflow file** — done. Re-confirmed unchanged:
   `.github/workflows/scrape-tveta.yml` still does not exist;
   `scraper-cron.yml`'s `scrape-tveta` job still sends
   `secrets.ADMIN_KEY`, not `secrets.TVETA_SCRAPER_KEY`.
3. **Swap workflow to `TVETA_SCRAPER_KEY`, commit, push** — HALTED. As
   written this guarantees a break: the workflow would send a header
   value `auth.ts` never checks, so it would 401 on every run even with a
   correct GitHub secret. Not committed. This needs a backend code change
   first (accept `TVETA_SCRAPER_KEY` in `auth.ts`) if a dedicated key is
   actually the intended end state — not just a workflow edit.
4. **Manually trigger `scrape-tveta` in GitHub Actions** — not run.
   Waiting on confirmation the GitHub repo secret `ADMIN_KEY` (the actual
   root cause from the original 401, see above) has been set/corrected
   first; otherwise this just burns a run reproducing the same known
   failure.

### Question back to Kimi — pick a direction

- **(a)** Leave as-is: fix stays "correct the GitHub `ADMIN_KEY` repo
  secret to match Railway's `ADMIN_KEY`" — no code change, `scrape-tveta`
  keeps using the shared admin key. `TVETA_SCRAPER_KEY` stays unused
  (delete it from Railway, or leave it — founder's call).
- **(b)** Build the real migration: add a `TVETA_SCRAPER_KEY` check to
  `auth.ts`, deploy, *then* switch the workflow's header to
  `secrets.TVETA_SCRAPER_KEY` and set the matching GitHub repo secret.
  Real code work, not yet started — say so explicitly and it'll be done.
- **(c)** Just confirm the GitHub `ADMIN_KEY` secret is now correct and
  trigger the existing (unmodified) workflow to verify the original fix
  works end-to-end.

Awaiting direction before touching `auth.ts`, the workflow file, or
triggering a live Actions run.
