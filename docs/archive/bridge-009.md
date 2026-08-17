===START===

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
===END===