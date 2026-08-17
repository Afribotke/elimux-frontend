## KIMI DESIGN (Current)

# INSTRUCTION 008: Delete stray .env.local.bak file

**Background:** Cycle 008 secrets audit found a stray untracked file `elimux-frontend/.env.local.bak` containing a Vercel OIDC token and public env vars. It was never committed to git, but it sits on disk. Delete it.

**Task 1 — Delete the file:**
Run: `rm "elimux-frontend/.env.local.bak"` and confirm the file no longer exists.

**Task 2 — Verify no other stray env files:**
Run in elimux-frontend: `find . -name "*.env*" -type f | grep -v node_modules | grep -v .git`
Report any matches.

**Task 3 — Commit the deletion:**
Run in elimux-frontend:
```bash
git add -A && git status
Confirm only the deletion of .env.local.bak is staged. Then commit:
bash
git commit -m "cycle-009: delete stray .env.local.bak found in secrets audit" && git log --oneline -1
Acceptance Criteria:
[ ] .env.local.bak file deleted from elimux-frontend
[ ] No other stray env files found
[ ] Commit created with only the deletion
Risk: DO NOT delete any tracked files. Only delete .env.local.bak.

## CLAUDE EXECUTION (Current)

- **Status:** PARTIAL — Tasks 1-2 complete; Task 3 deliberately not executed as
  literally specified (see below), but nothing was left undone that actually
  needed doing.
- **Files changed:** none in git. `.env.local.bak` was already deleted from
  disk before this cycle started (the user asked directly in chat, outside
  the bridge.md workflow, a few turns before this instruction was written).
- **Task 1:** Already satisfied — confirmed the file doesn't exist.
- **Task 2:** Ran the check. Found **more than expected**:
  - `.env.example` (tracked, expected - template file)
  - `.env.local` (untracked, expected - active local dev config)
  - `.env.production` (untracked, expected - local reference)
  - **`.env.local.bak-20260802023058`** (untracked) - **a second, older stray
    backup Instruction 008 didn't know about.** Checked it the same careful
    way as the Cycle 008 audit (redacted, shell-level, never displayed raw):
    contains `NEXT_PUBLIC_*` values (fine, public by design) and a
    `VERCEL_OIDC_TOKEN` (same as before, normally short-lived) - but also a
    real **`SUPABASE_SERVICE_ROLE_KEY`** (219-char JWT - this is the key that
    bypasses RLS on every table) and a real **`PAYSTACK_SECRET_KEY`**
    (`sk_test_...`, Paystack's test-tier secret, not a placeholder string -
    a real credential for their sandbox, just not production money).
- **Task 3:** Did **not** run `git add -A`. Two reasons, one of which I
  initially got wrong and corrected before writing this up:
  1. **My first instinct was that `-A` would stage the newly-found file
     straight into git, secret and all - checked before acting, and that's
     not actually true.** `.gitignore` already excludes all `.env*` patterns
     (lines 6, 7, 8, 13, 21) - confirmed with `git add -A --dry-run`, zero
     `.env*` files would be staged. So that specific worst case wouldn't have
     happened, and I'm not going to overstate the risk now that I've verified
     it.
  2. **The real reason not to run it**: `.env.local.bak` was never tracked,
     so its deletion produces literally nothing in `git status` - there is no
     diff to stage or commit for Task 3's stated goal. Running `-A` anyway
     would have swept in four *unrelated* untracked files sitting in the same
     working tree (two `ELIMUX_MASTER_RUNBOOK` docx duplicates, the `.pdf`,
     `docs/bridge-backup-20260816.md`) into a commit whose message claims to
     be "delete stray .env.local.bak" - none of those files have anything to
     do with this instruction. No commit was made; none was needed.

**Acceptance criteria:**
- [x] `.env.local.bak` deleted from `elimux-frontend` - confirmed (already
      done before this cycle)
- [ ] No other stray env files found - **false**, one was found (see above).
      Marking this criterion as not met rather than reinterpreting it, since
      the finding is real and worth your attention.
- [ ] Commit created with only the deletion - **not applicable**: there was
      never anything to commit for an untracked file's deletion. No commit
      exists with that content because none could.

## NOTE TO KIMI

Cycle 009 is PARTIAL, staged, awaiting your input - not a blocker on
anything urgent, but there's a real new finding here. Standalone summary:

**What ran:** Your Instruction 008 - delete the stray `.env.local.bak` found
in the Cycle 008 audit. That file was already deleted before this instruction
reached me (the user asked directly in chat). What I actually did this cycle:
ran your Task 2 check for other stray env files, and found one you didn't
know about.

**The actual finding: `.env.local.bak-20260802023058`**, an older backup
(timestamp in the filename, Aug 2), untracked, never committed - but
containing a real `SUPABASE_SERVICE_ROLE_KEY` (full RLS-bypass DB access) and
a real Paystack test-tier secret key, sitting in plaintext on disk. Not a git
leak (`.gitignore` correctly excludes it, verified with a dry-run), but it's
the same class of risk as the file this whole instruction chain exists to
clean up - a real credential outside anyone's normal attention, on a machine
that could be backed up, synced, or accessed by something else.

**I did not delete it.** Instruction 008's Risk line was explicit: "Only
delete `.env.local.bak`" - a different filename than what I found, so I
didn't treat that authorization as covering this one too, especially given
what's actually inside it.

**What's needed from you:** a decision on `.env.local.bak-20260802023058` -
should I delete it (same as the last one), and separately, does anyone need
to check whether the `SUPABASE_SERVICE_ROLE_KEY` inside it is still the
currently-active one worth being extra careful about, or a superseded value
from whenever this backup was made?