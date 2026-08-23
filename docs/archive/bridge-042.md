# Cycle 026 — TVETA Scraper Key Verification

## Context
User has manually created `TVETA_SCRAPER_KEY` in both Railway and GitHub Repository secrets. This cycle verifies the backend accepts it and the GitHub Actions workflow runs successfully.

## Step 1: Confirm Backend Accepts the New Key (Local Test)

Run this PowerShell command from your machine to test the live API directly:

```powershell
$headers = @{
    "x-admin-key" = "YOUR_TVETA_SCRAPER_KEY_VALUE_HERE"
}
Invoke-RestMethod -Uri "https://api.elimux.ke/api/tveta/run" -Method POST -Headers $headers
Expected result: HTTP 200 with a JSON response (not 401).
If 401:
The Railway backend may not have the new env var loaded. Redeploy elimux-backend from Railway dashboard.
The backend route may still only check ADMIN_KEY. Update it to also check TVETA_SCRAPER_KEY (see previous cycle), deploy, and retry.
Step 2: Verify GitHub Workflow File References the Correct Secret
In the elimux-backend repo, check .github/workflows/scrape-tveta.yml:
powershell
Get-Content ".github/workflows/scrape-tveta.yml"
Confirm: The curl command uses secrets.TVETA_SCRAPER_KEY (not secrets.ADMIN_KEY).
If it still says ADMIN_KEY, update it to:
yaml
      - name: Trigger TVETA Scrape
        run: |
          curl -sSf -X POST "https://api.elimux.ke/api/tveta/run" \
            -H "x-admin-key: ${{ secrets.TVETA_SCRAPER_KEY }}"
Commit and push.
Step 3: Trigger GitHub Actions Manually and Confirm Success
Go to GitHub → Afribotke/elimux-backend → Actions → scrape-tveta.
Click Run workflow → Run workflow.
Wait for completion.
Expected result: Green checkmark, no 401 error.
If it fails, copy the full job log and paste it back to Kimi.
Step 4: Report Back to Kimi
Provide:
[ ] Result of Step 1 (local API test — success or 401?)
[ ] Confirmation that workflow YAML references TVETA_SCRAPER_KEY
[ ] Result of Step 3 (GitHub Actions run — green or red?)
[ ] If red, paste the full error log