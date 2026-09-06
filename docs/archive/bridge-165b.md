# docs/bridge.md — Cycle 165B: Deploy Scraper + Full University Sweep

## Objective
1. Ensure `scrape_attempted_at` column exists on `crm_contacts`
2. Commit and deploy Cycle 165 scraper to Railway
3. Run the scraper against all remaining university websites (emails only, no phones)
4. Report final reachable contact count

## CRITICAL RULES
1. Do NOT drop any table.
2. Scrape emails only — skip phone extraction entirely.
3. Process in batches of 50 with 2-second delays.
4. If the scraper stops, restart — it resumes automatically.
5. Commit and deploy first, then run.

---

## STEP 1: Ensure Schema is Ready

Run in Supabase SQL Editor:

```sql
-- Add scrape_attempted_at if not already present
ALTER TABLE crm_contacts 
ADD COLUMN IF NOT EXISTS scrape_attempted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_scrape_attempted 
ON crm_contacts(scrape_attempted_at) 
WHERE scrape_attempted_at IS NULL;

-- Verify
SELECT 
  COUNT(*) as total_with_website,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as has_email,
  COUNT(*) FILTER (WHERE scrape_attempted_at IS NULL AND email IS NULL AND website IS NOT NULL) as still_to_scrape
FROM crm_contacts 
WHERE entity_type = 'university';
Report exact output.
STEP 2: Update Scraper to Skip Phones
Read elimux-backend/src/routes/crm.ts. Find the extractContacts function and the scraper route. Make these two minimal changes:
Change 1: In extractContacts, comment out or remove phone extraction. Keep only email extraction:
TypeScript
function extractContacts(html: string): { emails: string[]; phones: string[] } {
  // Strip scripts and styles first
  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Extract emails only
  const rawEmails = cleanHtml.match(EMAIL_REGEX) || [];
  const emails = [...new Set(rawEmails)].filter(email => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && 
           !FALSE_POSITIVE_DOMAINS.has(domain) && 
           email.length < 100 &&
           !/\.(png|jpg|jpeg|gif|css|js|pdf|svg|webp)$/i.test(domain);
  });

  return { emails, phones: [] }; // phones intentionally empty
}
Change 2: In the scraper route, remove phone writing logic. Only write email:
TypeScript
// Replace the updates block in the scraper route with this:
const updates: Record<string, any> = {
  scrape_attempted_at: new Date().toISOString(),
  enriched_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

if (emails.length > 0) {
  updates.email = emails[0];
}
Run npx tsc --noEmit. Report: OK or errors.
STEP 3: Commit and Deploy
Commit these files:
elimux-backend/src/routes/crm.ts (scraper route + phone-skip fix)
elimux-backend/src/index.ts (router mount — already committed in 161C, verify it's there)
powershell
cd elimux-backend
git add src/routes/crm.ts
git status --short
git commit -m "feat(crm): Cycle 165B — email-only scraper, scrape_attempted_at resume"
git push origin main
Monitor Railway deploy. Report: deployment status + health check.
STEP 4: Run Full University Sweep
Once deployed, trigger batches via curl until all universities are processed.
Batch script (PowerShell):
powershell
$token = "YOUR_ADMIN_JWT_TOKEN"
$url = "https://api.elimux.ke/api/crm/scrape-contacts"
$totalBatches = 0
$totalEnriched = 0

while ($true) {
    $body = @{
        batch_size = 50
        delay_ms = 2000
        run_by = "1647cdd0-c463-4e03-a789-21a336f93bb5"
    } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri $url -Method POST `
            -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
            -Body $body -TimeoutSec 300

        $totalBatches++
        $totalEnriched += $response.enriched

        Write-Host "Batch $totalBatches | Processed: $($response.processed) | Enriched: $($response.enriched) | Errors: $($response.errors) | Remaining: $($response.remaining)"

        if ($response.remaining -eq 0 -or $response.processed -eq 0) {
            Write-Host "DONE. Total batches: $totalBatches | Total enriched: $totalEnriched"
            break
        }

        # Small pause between batches
        Start-Sleep -Seconds 5

    } catch {
        Write-Host "ERROR: $_"
        Write-Host "Pausing 30s before retry..."
        Start-Sleep -Seconds 30
    }
}
Run this script. It will take several hours. Report progress every ~10 batches.
If the script stops for any reason (network, token expiry, machine sleep), simply re-run it. The scraper resumes automatically because scrape_attempted_at prevents re-processing.
STEP 5: Final Validation
After the sweep completes, run:
sql
-- Final reachability
SELECT 
  entity_type,
  COUNT(*) as total,
  COUNT(email) as has_email,
  COUNT(phone) as has_phone,
  COUNT(*) FILTER (WHERE email IS NULL AND phone IS NULL AND whatsapp_number IS NULL) as unreachable
FROM crm_contacts
GROUP BY entity_type
ORDER BY total DESC;

-- Scrape activity summary
SELECT 
  COUNT(*) FILTER (WHERE action = 'contact_scraped') as scraped,
  COUNT(*) FILTER (WHERE action = 'contact_scrape_failed') as failed
FROM crm_activities
WHERE action IN ('contact_scraped', 'contact_scrape_failed');

-- Sample of newly found emails
SELECT name, entity_type, email, website
FROM crm_contacts
WHERE email IS NOT NULL AND entity_type = 'university'
ORDER BY enriched_at DESC
LIMIT 10;
STEP 6: Report Template
plain
## CYCLE 165B VALIDATION REPORT — Full University Sweep

### Deployment
| Check | Result |
|---|---|
| Scraper route deployed | YES / NO |
| Health check passes | |

### Sweep Progress
| Batches Run | Total Processed | Emails Found | Errors | Remaining |
|---|---|---|---|---|
| | | | | |

### Final Reachability
| Entity Type | Total | Has Email | Has Phone | Unreachable |
|---|---|---|---|---|
| university | | | | |
| company | | | | |
| school_public | | | | |

### Sample Verified Emails
| Institution | Email | Source Website |
|---|---|---|
| | | |

### Ready for Live Email Outreach?
YES / NO — (how many contacts can receive email?)
CRITICAL RULES
Scrape emails only. No phones.
Batch size 50, delay 2 seconds.
If script stops, re-run — it resumes automatically.
Report progress every 10 batches.
Do NOT start outreach until final validation is complete.