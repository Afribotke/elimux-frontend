# Cycle 027 — Complete University Scraper Scoped Key Migration

## Context
Founder has manually created `UNIVERSITY_SCRAPER_KEY` in both Railway and GitHub Repository secrets. This cycle wires it into the backend and workflow.

## Step 1: Audit Current State (Read-Only)

Before editing, confirm these files exist and their current content:

1. Find the university scraper route file:
   ```powershell
   Get-ChildItem -Recurse -Filter "*.ts" -Path "src\routes" | Select-String -Pattern "scraper" -List | Select-Object Filename, Path
Report back: which file handles the route the cron job hits?
Check the cron job in the workflow:
powershell
Get-Content ".github/workflows/scraper-cron.yml"
Report back: what is the exact curl URL and header for scrape-universities?
Step 2: Update Backend — Add universityScraperAuth
In src/middleware/auth.ts, add a new function below tvetaScraperAuth:
TypeScript
export const universityScraperAuth = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-admin-key'] as string;
  const validKeys = [process.env.ADMIN_KEY, process.env.UNIVERSITY_SCRAPER_KEY].filter(Boolean);
  if (!validKeys.includes(key)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
Then in the university scraper route file (from Step 1), find the route the cron job hits and apply universityScraperAuth to it. If the route is currently behind adminAuth, move it before the router.use(adminAuth) line (same pattern as TVETA).
Do NOT modify adminAuth itself.
Save, commit, and deploy to Railway. Confirm deployment is live.
Step 3: Update Workflow
In .github/workflows/scraper-cron.yml, find the scrape-universities job. Change:
yaml
-H "x-admin-key: ${{ secrets.ADMIN_KEY }}"
to:
yaml
-H "x-admin-key: ${{ secrets.UNIVERSITY_SCRAPER_KEY }}"
Commit and push.
Step 4: Verify End-to-End
Run this PowerShell test locally (replace YOUR_KEY with the actual UNIVERSITY_SCRAPER_KEY value):
powershell
$headers = @{"x-admin-key" = "YOUR_KEY"}
Invoke-RestMethod -Uri "https://api.elimux.ke/api/admin/scraper/run" -Method POST -Headers $headers
Expected: 200 OK (not 401).
Go to GitHub Actions → scraper-cron → Run workflow manually.
Wait for both scrape-tveta and scrape-universities to finish.
Report back: green/red for each job, and paste the last 10 lines of each log.
Deliverables
[ ] Backend route updated with universityScraperAuth (adminAuth untouched)
[ ] Backend deployed to Railway
[ ] scraper-cron.yml updated to use secrets.UNIVERSITY_SCRAPER_KEY
[ ] Local API test returns 200
[ ] GitHub Actions run: both jobs green