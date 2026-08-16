===START===

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
===END===