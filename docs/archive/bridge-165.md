# docs/bridge.md — Cycle 165: Website Contact Scraper

## Objective
Build a batch-processing scraper that visits the 9,355 known websites, extracts published email addresses and Kenyan phone numbers, and writes them into `crm_contacts`. Processes in small batches with delays to avoid being blocked. Logs every scrape to `crm_activities`.

## CRITICAL RULES
1. Do NOT drop any table.
2. Append-only to crm.ts. Do NOT replace existing routes.
3. Use `adminAuth` on the scraper route.
4. Import shared `supabase` from `../lib/supabase`.
5. Run `npx tsc --noEmit` after any change.
6. Process websites in batches (max 20 per call) with 2-second delays between requests.
7. If any step fails, STOP and report the error.
8. Do NOT commit or push until instructed.

---

## STEP 1: Add Scraper Route to crm.ts

Read the current end of `elimux-backend/src/routes/crm.ts`. Append this route BEFORE `export default router;`:

```typescript
// ============================================
// Website Contact Scraper (appended to crm.ts)
// ============================================

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?254|0)\s*[17]\d{2}\s*\d{3}\s*\d{3}|(?:\+?254|0)\s*11\s*\d{3}\s*\d{4}|(?:\+?254|0)[17]\d{8}|(?:\+?254|0)11\d{7}/g;

const FALSE_POSITIVE_DOMAINS = new Set([
  'example.com', 'test.com', 'domain.com', 'email.com', 'mail.com',
  'yourdomain.com', 'company.com', 'website.com', 'localhost',
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', // personal emails on websites are still valid leads
]);

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '').replace(/^0/, '+254').replace(/^254/, '+254');
  if (!cleaned.startsWith('+')) {
    return '+254' + cleaned;
  }
  return cleaned;
}

function extractContacts(html: string): { emails: string[]; phones: string[] } {
  // Extract emails
  const rawEmails = html.match(EMAIL_REGEX) || [];
  const emails = [...new Set(rawEmails)].filter(email => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !FALSE_POSITIVE_DOMAINS.has(domain) && email.length < 100;
  });

  // Extract phones
  const rawPhones = html.match(PHONE_REGEX) || [];
  const phones = [...new Set(rawPhones)]
    .map(normalizePhone)
    .filter(phone => phone.length >= 12 && phone.length <= 15); // +254 + 9 digits

  return { emails, phones };
}

// POST /api/crm/scrape-contacts — batch website scraper
router.post('/scrape-contacts', adminAuth, async (req, res) => {
  try {
    const { batch_size = 20, delay_ms = 2000, run_by } = req.body;

    // Fetch batch of contacts with websites but no email/phone
    const { data: contacts, error: fetchError } = await supabase
      .from('crm_contacts')
      .select('id, name, website, entity_type')
      .not('website', 'is', null)
      .is('email', null)
      .is('phone', null)
      .limit(batch_size);

    if (fetchError) throw fetchError;
    if (!contacts || contacts.length === 0) {
      return res.json({ 
        message: 'No contacts left to scrape', 
        processed: 0, 
        enriched: 0,
        errors: 0 
      });
    }

    const results = [];
    let enrichedCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      if (!contact.website) continue;

      // Ensure URL has protocol
      let url = contact.website.trim();
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'ElimuX-Contact-Research/1.0 (Education Partnership Outreach)',
            'Accept': 'text/html',
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeout);

        if (!response.ok) {
          results.push({ 
            id: contact.id, 
            name: contact.name, 
            status: 'http_error', 
            code: response.status 
          });
          errorCount++;
          continue;
        }

        const html = await response.text();
        const { emails, phones } = extractContacts(html);

        const updates: Record<string, any> = {
          enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (emails.length > 0) updates.email = emails[0]; // Take first found email
        if (phones.length > 0) updates.phone = phones[0]; // Take first found phone

        if (emails.length > 0 || phones.length > 0) {
          const { error: updateError } = await supabase
            .from('crm_contacts')
            .update(updates)
            .eq('id', contact.id);

          if (updateError) throw updateError;

          await supabase.from('crm_activities').insert({
            user_id: run_by || null,
            action: 'contact_scraped',
            entity_type: 'contact',
            entity_id: contact.id,
            metadata: {
              website: url,
              emails_found: emails.length,
              phones_found: phones.length,
              email_used: emails[0] || null,
              phone_used: phones[0] || null,
            },
          });

          enrichedCount++;
          results.push({
            id: contact.id,
            name: contact.name,
            status: 'enriched',
            email: emails[0] || null,
            phone: phones[0] || null,
          });
        } else {
          results.push({
            id: contact.id,
            name: contact.name,
            status: 'no_contacts_found',
          });
        }

        // Delay between requests
        if (delay_ms > 0) {
          await new Promise(resolve => setTimeout(resolve, delay_ms));
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          id: contact.id,
          name: contact.name,
          status: 'error',
          error: errorMsg,
        });
        errorCount++;

        // Log failure
        await supabase.from('crm_activities').insert({
          user_id: run_by || null,
          action: 'contact_scrape_failed',
          entity_type: 'contact',
          entity_id: contact.id,
          metadata: { website: url, error: errorMsg },
        });
      }
    }

    res.json({
      processed: contacts.length,
      enriched: enrichedCount,
      errors: errorCount,
      remaining: (await supabase
        .from('crm_contacts')
        .select('*', { count: 'exact', head: true })
        .not('website', 'is', null)
        .is('email', null)
        .is('phone', null)
      ).count || 0,
      results,
    });

  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
After appending, run:
powershell
cd elimux-backend
npx tsc --noEmit
Report: OK or exact errors.
STEP 2: Run Scraper in Batches
Claude: Run the scraper via curl or a direct test. Process in batches of 20 until all 9,355 websites are processed or a significant sample is done.
powershell
# Test with a small batch first (5 websites)
curl -X POST https://api.elimux.ke/api/crm/scrape-contacts `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -d '{"batch_size":5,"delay_ms":2000,"run_by":"1647cdd0-c463-4e03-a789-21a336f93bb5"}'
If testing locally:
powershell
cd elimux-backend
# Start the server or use railway run
railway run node -e "
const fetch = require('node-fetch');
async function run() {
  const res = await fetch('http://localhost:8080/api/crm/scrape-contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ADMIN_TOKEN' },
    body: JSON.stringify({ batch_size: 20, delay_ms: 2000, run_by: '1647cdd0-c463-4e03-a789-21a336f93bb5' })
  });
  console.log(await res.json());
}
run();
"
Process multiple batches. Report after each batch:
How many processed
How many enriched (email or phone found)
How many errors
How many remaining
Stop after either:
All 9,355 are processed, OR
500 websites processed (significant sample), OR
Rate limiting/blocking detected (report exact error)
STEP 3: Post-Scrape Validation
3.1 Reachability after scraping
sql
SELECT 
  entity_type,
  COUNT(*) as total,
  COUNT(email) as has_email,
  COUNT(phone) as has_phone,
  COUNT(*) FILTER (WHERE email IS NULL AND phone IS NULL AND whatsapp_number IS NULL) as still_unreachable
FROM crm_contacts
GROUP BY entity_type
ORDER BY total DESC;
3.2 Scrape activity log
sql
SELECT 
  action,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE metadata->>'emails_found' > '0' OR metadata->>'phones_found' > '0') as found_something
FROM crm_activities
WHERE action IN ('contact_scraped', 'contact_scrape_failed')
GROUP BY action;
3.3 Sample of newly enriched contacts
sql
SELECT id, name, entity_type, email, phone, website, enriched_at
FROM crm_contacts
WHERE enriched_at > (now() - interval '1 hour')
ORDER BY enriched_at DESC
LIMIT 10;
3.4 Website quality check
sql
-- How many of the heuristic company URLs were actually reachable?
SELECT 
  COUNT(*) as total_scraped,
  COUNT(*) FILTER (WHERE email IS NOT NULL OR phone IS NOT NULL) as yielded_contacts,
  COUNT(*) FILTER (WHERE email IS NULL AND phone IS NULL) as no_contacts_found
FROM crm_contacts
WHERE entity_type = 'company' AND website IS NOT NULL;
STEP 4: Report Template
plain
## CYCLE 165 VALIDATION REPORT — Website Contact Scraper

### Build Status
| Check | Result |
|---|---|
| Scraper route added to crm.ts | |
| TypeScript compilation | OK / ERRORS: ___ |

### Scraping Run
| Batch | Processed | Enriched | Errors | Remaining |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| ... | | | | |

### Final Reachability
| Entity Type | Total | Has Email | Has Phone | Still Unreachable |
|---|---|---|---|---|
| university | | | | |
| company | | | | |
| school_public | | | | |

### Scrape Quality
| Metric | Value |
|---|---|
| Total websites scraped | |
| Emails found | |
| Phones found | |
| Heuristic URLs that yielded real contacts | |
| Most common error | |

### Sample Enriched Contacts
| Name | Type | Email | Phone | Source Website |
|---|---|---|---|---|
| | | | | |

### Recommendation
(One sentence: is the CRM now ready for live email outreach?)

### Ready for Phase 4 (WhatsApp)?
YES / NO — (explain)
CRITICAL RULES
Start with a small batch (5 websites) to verify the scraper works.
Use 2-second delays between requests — do not hammer websites.
10-second timeout per website — skip slow/unresponsive sites.
If a website blocks the scraper (403/429), report it and pause.
Do NOT commit or push until instructed.
The scraper is resumable — it only processes contacts where email IS NULL and phone IS NULL.