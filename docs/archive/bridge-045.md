# Cycle 026 — Scoped TVETA Key (Corrected: Do NOT Touch adminAuth Middleware)

## Context
Claude audit found `adminAuth` gates ~130 routes (payments, user management, etc.). Modifying it to accept `TVETA_SCRAPER_KEY` would create a second master key — unacceptable. Instead, the TVETA route handler checks `TVETA_SCRAPER_KEY` locally, bypassing `adminAuth` for that endpoint only.

## Step 1: Find the TVETA Route Handler

Find the file handling `POST /api/tveta/run`. It likely uses `adminAuth` middleware. Remove `adminAuth` from this route and add a local, scoped check instead.

**Before (example):**
```typescript
router.post('/run', adminAuth, async (req, res) => { ... })
After:
TypeScript
router.post('/run', async (req, res) => {
  const scraperKey = req.headers['x-admin-key'] as string;
  if (scraperKey !== process.env.TVETA_SCRAPER_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... existing handler logic ...
});
Critical: Do NOT modify src/middleware/auth.ts. adminAuth stays master-key-only.
Save, commit, and deploy to Railway. Confirm deployment is live.
Step 2: Update Workflow to Use TVETA_SCRAPER_KEY
File: .github/workflows/scraper-cron.yml
Find the scrape-tveta job. Change its curl header from:
yaml
-H "x-admin-key: ${{ secrets.ADMIN_KEY }}"
to:
yaml
-H "x-admin-key: ${{ secrets.TVETA_SCRAPER_KEY }}"
Also fix the scrape-universities pipefail bug in the same file. Add set -o pipefail to its run step so 401s are not silently swallowed.
Commit and push.
Step 3: Verify End-to-End
Run this PowerShell test locally (replace YOUR_KEY with the actual TVETA_SCRAPER_KEY value):
powershell
$headers = @{"x-admin-key" = "YOUR_KEY"}
Invoke-RestMethod -Uri "https://api.elimux.ke/api/tveta/run" -Method POST -Headers $headers
Expected: 200 OK (not 401).
Test that the master ADMIN_KEY still works on other admin endpoints (spot-check one).
Go to GitHub Actions → scraper-cron → Run workflow manually.
Wait for scrape-tveta to finish. Expected: green checkmark.
Deliverables
[ ] TVETA route handler updated with local TVETA_SCRAPER_KEY check (adminAuth untouched)
[ ] Backend deployed to Railway
[ ] scraper-cron.yml updated to use secrets.TVETA_SCRAPER_KEY
[ ] scrape-universities pipefail bug fixed
[ ] Local API test returns 200 with TVETA key
[ ] Spot-check confirms ADMIN_KEY still works on other admin routes
[ ] GitHub Actions run passes green