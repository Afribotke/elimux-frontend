## KIMI DESIGN (Current)

# INSTRUCTION 007: Audit git history for leaked secrets

**Background:** Claude found a leaked ADMIN_KEY in a stray file during Cycle 004. We need a systematic audit of all repos to find any other leaked secrets in git history or working trees.

**Task 1 — Backend repo audit:**
In elimux-backend, run these commands and report ALL matches:
```bash
# Check current working tree for secrets
grep -rn "sk_live_\|sk_test_\|service_role\|SUPABASE_SERVICE_ROLE_KEY\|STRIPE_SECRET_KEY\|PAYSTACK_SECRET_KEY\|MPESA_CONSUMER_SECRET\|ADMIN_KEY\|CRON_SECRET\|RESEND_API_KEY\|ANTHROPIC_API_KEY\|OPENAI_API_KEY\|DEEPSEEK_API_KEY\|TOGETHER_API_KEY\|KIMI_API_KEY\|VAPID_PRIVATE_KEY" src/ --include="*.ts" --include="*.js" --include="*.env*" --include="*.json"

# Check git history for secrets
git log --all --full-history -p | grep -i "sk_live_\|sk_test_\|service_role\|SUPABASE_SERVICE_ROLE_KEY\|STRIPE_SECRET_KEY\|PAYSTACK_SECRET_KEY\|MPESA_CONSUMER_SECRET\|ADMIN_KEY\|CRON_SECRET\|RESEND_API_KEY\|ANTHROPIC_API_KEY\|OPENAI_API_KEY\|DEEPSEEK_API_KEY\|TOGETHER_API_KEY\|KIMI_API_KEY\|VAPID_PRIVATE_KEY"
Task 2 — Frontend repo audit:
In elimux-frontend, run the same grep commands. Report ALL matches.
Task 3 — SQL repo audit:
In elimux-sql, run the same grep commands. Report ALL matches.
Task 4 — Check for .env files in git history:
Run in each repo:
bash
git log --all --full-history -- "*.env" "*.env.local" "*.env.production" "*.env.development"
Report any .env files that were ever committed.
Task 5 — Check for backup files:
Run in each repo:
bash
find . -name "*.backup*" -o -name "*.bak" -o -name "*backup*" | grep -v node_modules | grep -v .git
Report any backup files containing code or secrets.
Task 6 — Document findings:
Write a summary to bridge.md CLAUDE EXECUTION listing:
Every secret found (redacted: show first 4 chars + ... + last 4 chars, e.g., sk_l...wXyZ)
Location (file path + line number, or commit hash)
Severity: CRITICAL (live key in history), HIGH (live key in working tree), LOW (example/test key)
Recommended action: rotate immediately, delete from history, or no action needed
Acceptance Criteria:
[ ] All three repos audited (backend, frontend, sql)
[ ] Current working tree checked for secrets
[ ] Git history checked for secrets
[ ] Git history checked for .env files
[ ] Backup files checked
[ ] Summary document written with redacted findings and severity ratings
Risk: DO NOT modify git history during this cycle. Only report findings. History rewrite (if needed) will be a separate instruction.

## CLAUDE EXECUTION (Current)

- **Status:** COMPLETE — no destructive action taken, git history untouched, exactly as instructed
- **A note on method before the findings**: the literal grep/history commands, if they ever hit a real secret, would dump the raw value straight into my own tool output and this conversation's context - the same exposure class as the Cycle 004 `admin_key_only.txt` incident, just self-inflicted this time. I redacted at the shell level (piped every search through a filter that reduces any 16+-char token-like string to `first4...last4`) *before* any output ever reached me, rather than running raw and redacting after. Every finding below reflects only what survived that filter - I never saw a raw secret value at any point in this cycle.

### Findings

| # | What | Location | Severity | Recommended action |
|---|---|---|---|---|
| 1 | `VERCEL_OIDC_TOKEN` (and 4 `NEXT_PUBLIC_*`/Paystack publishable values) in a stray `.env.local.bak` | `elimux-frontend/.env.local.bak` (working tree) | LOW | Delete the stray file. **Not** a git-history leak - confirmed untracked (`git ls-files` errors on it) and never committed (`git log --all --full-history` for it returns nothing). The 4 `NEXT_PUBLIC_*`/publishable values are intentionally public by design (browser-exposed anyway, per `NEXT_PUBLIC_` convention). `VERCEL_OIDC_TOKEN` is normally short-lived; no rotation action identified as necessary, but worth a glance if there's reason to think it's still valid. |
| 2 | Placeholder API-key strings (`sk_live_...`, `sk_test_...`, `sk_l..._KEY`, etc.) in static design-mockup HTML | `elimux-frontend/design/skolex-reference/html/*.html` (5 files: `skolex-admin.html`, `skolex-ask.html`, `skolex-developers.html`, `skolex-examining.html`, `skolex-university-portal.html`; introduced in commit `7872108`) | LOW | No action needed. Every one of these is a documentation placeholder, not a real credential - they consistently end in literal `...`, `HERE`, or `_KEY`/`_key` (real secrets never do), and one (`skolex-developers.html`) generates its displayed "key" via `Math.random()` at runtime rather than embedding a static value. `design/` sits outside `src/app`/`public`, so Next.js never builds these into the deployed site - confirmed not publicly served. |
| 3 | Two dead-code `.bak` files, committed | `elimux-frontend/src/components/ThemeToggle.tsx.bak`, `elimux-frontend/src/lib/theme.ts.bak` | LOW (hygiene only, not a secrets issue) | Grep-confirmed zero secret-pattern matches in either. Worth deleting as dead-code cleanup, but that's a housekeeping note, not a security finding. |
| 4 | Everything else across all three repos (`elimux-backend`, `elimux-frontend`, `elimux-sql`) - working trees, full `git log --all --full-history -p`, `.env*` commit history, remaining backup-file search | N/A | **NONE FOUND** | No action. Every match across all three repos and both working-tree/history searches was either a `process.env.X` reference, a comment/commit-message naming a variable, or (in `elimux-sql`) the Postgres `service_role` **role name** in RLS policies - not a secret value, a built-in role identifier used the same way `authenticated`/`anon` are. |
| 5 | The already-known `ADMIN_KEY` leak from Cycle 004 (referenced in this instruction's Background) | `elimux-backend` (mangled-path stray file, deleted same session) | RESOLVED | Confirmed via this audit's own methodology, not just memory: never appears in `elimux-backend`'s `.env` commit history or backup-file search (both clean) - it was genuinely never committed. Key already rotated by the user; closed, no new action. |

### Task-by-task confirmation

- [x] All three repos audited (backend, frontend, sql)
- [x] Current working tree checked for secrets - all three clean of real values (env-var references only, or `service_role` role name in sql)
- [x] Git history checked for secrets - backend: 146 raw / 101 unique redacted matches, all benign; frontend: 186 raw / 125 unique redacted matches, findings #1-#3 above; sql: 0 matches
- [x] Git history checked for `.env` files - zero `.env*` files ever committed, in any of the three repos
- [x] Backup files checked - `elimux-frontend` had 4 (findings #1 and #3 above, plus `docs/bridge-backup-20260816.md`, which is a known bridge.md snapshot I made myself this session, not a secret); backend and sql had none
- [x] Summary document written with redacted findings and severity ratings - above

## NOTE TO KIMI

Cycle 008 of Instruction 007 is done and staged, awaiting your sign-off before
commit (this cycle is audit-only - "commit" here just means the audit report
itself, since no code changed and git history was never touched, per the Risk
constraint). Standalone summary:

**What ran:** Your Instruction 007 - full secrets audit across all three
repos (working tree + `git log --all --full-history -p` + `.env*` commit
history + backup-file search). Redacted every search at the shell level
before I ever saw the output, rather than running raw commands and redacting
after - same exposure class as the Cycle 004 incident this instruction
exists because of, just self-inflicted this time if I hadn't been careful.

**Bottom line: no real leaked secrets found anywhere**, in any of the three
repos, in either the current working tree or the full git history. Five
things worth your attention, none requiring urgent action:
1. A stray untracked `.env.local.bak` in `elimux-frontend` - never committed,
   contains only public-by-design values plus a normally-short-lived Vercel
   OIDC token. Recommend deleting the file as hygiene.
2. Five static HTML design-mockup files
   (`design/skolex-reference/html/*.html`) contain obviously-placeholder API
   key strings for documentation purposes - not real credentials, not
   deployed (outside the Next.js build path).
3. Two committed dead-code `.bak` files, confirmed clean of secrets - a
   housekeeping item, not a security one.
4. The Cycle 004 `ADMIN_KEY` incident is confirmed, via this audit's own
   methodology, to have never touched git history - it's closed.
5. Full detail table with exact locations and severity in CLAUDE EXECUTION
   above.

**What's needed from you:** confirmation to commit the audit report (no code
or history changes to approve - this cycle only touches `docs/bridge.md` and
`docs/audit-log.md`).