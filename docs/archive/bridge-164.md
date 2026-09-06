# docs/bridge.md — Cycle 164: Bulk Data Discovery & Enrichment

## Objective
Audit all existing data sources for contact information (emails, phones, websites), then bulk-populate `crm_contacts` with whatever is found. Report exactly how many contacts become reachable. Do NOT build WhatsApp (Phase 4) until this is complete.

## CRITICAL RULES
1. Do NOT drop any table.
2. Do NOT modify existing frontend pages or backend routes.
3. Run SQL one block at a time. Report EXACT output.
4. If any step fails, STOP and report the error.
5. Do NOT commit or push until instructed.

---

## STEP 1: Deep Audit — Institutions Table

Run each query separately and report EXACT output.

### 1.1 List all columns in institutions
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'institutions' 
ORDER BY ordinal_position;
1.2 Check for any contact-related data
sql
-- Count non-null values per potential contact column
SELECT 
  COUNT(*) as total_rows,
  COUNT(email) as has_email,
  COUNT(website_url) as has_website_url,
  COUNT(website) as has_website,
  COUNT(contact_email) as has_contact_email,
  COUNT(phone) as has_phone,
  COUNT(phone_number) as has_phone_number,
  COUNT(mobile) as has_mobile,
  COUNT(address) as has_address,
  COUNT(city) as has_city,
  COUNT(country) as has_country
FROM institutions;
1.3 Sample rows with any contact data
sql
SELECT id, name, email, website_url, website, contact_email, phone, phone_number, mobile, address, city, country
FROM institutions 
WHERE email IS NOT NULL 
   OR website_url IS NOT NULL 
   OR website IS NOT NULL 
   OR contact_email IS NOT NULL
   OR phone IS NOT NULL
   OR phone_number IS NOT NULL
   OR mobile IS NOT NULL
LIMIT 10;
1.4 Check if institutions links to other tables with contact data
sql
-- Any foreign keys from institutions to contact-bearing tables?
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'institutions';
STEP 2: Deep Audit — Employer Names Table
2.1 List all columns
sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'employer_names' 
ORDER BY ordinal_position;
2.2 Check for website/contact data
sql
SELECT 
  COUNT(*) as total_rows,
  COUNT(suggested_website_url) as has_suggested_url,
  COUNT(verified_website_url) as has_verified_url,
  COUNT(discovery_source) as has_source
FROM employer_names;
2.3 Sample rows with URLs
sql
SELECT id, name, normalized_name, suggested_website_url, verified_website_url, discovery_source, discovery_status
FROM employer_names 
WHERE suggested_website_url IS NOT NULL OR verified_website_url IS NOT NULL
LIMIT 10;
2.4 Check employer_outreach for research data
sql
-- Does research_data contain emails or phones?
SELECT id, employer_name_id, research_data 
FROM employer_outreach 
WHERE research_data IS NOT NULL 
LIMIT 5;
STEP 3: Deep Audit — Senior Schools Table
3.1 List all columns
sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'senior_schools' 
ORDER BY ordinal_position;
3.2 Check for any contact data
sql
SELECT 
  COUNT(*) as total_rows,
  COUNT(email) as has_email,
  COUNT(phone) as has_phone,
  COUNT(website) as has_website,
  COUNT(headteacher_email) as has_headteacher_email,
  COUNT(headteacher_phone) as has_headteacher_phone,
  COUNT(principal_email) as has_principal_email,
  COUNT(principal_phone) as has_principal_phone
FROM senior_schools;
STEP 4: Bulk Enrichment — Migrate Found Data to crm_contacts
Claude: ONLY run the blocks below for tables where Step 1–3 found actual data. If a table has zero contact data, report "No data to migrate" and SKIP that block.
4.1 Enrich universities from institutions
sql
-- ONLY run if institutions has email or website data
UPDATE crm_contacts cc
SET 
  email = COALESCE(cc.email, i.email, i.contact_email),
  website = COALESCE(cc.website, i.website_url, i.website),
  phone = COALESCE(cc.phone, i.phone, i.phone_number, i.mobile),
  county = COALESCE(cc.county, i.city), -- if city maps to county
  enriched_at = now(),
  updated_at = now()
FROM institutions i
WHERE cc.linked_institution_id = i.id
  AND cc.entity_type = 'university'
  AND (i.email IS NOT NULL OR i.contact_email IS NOT NULL OR i.website_url IS NOT NULL OR i.website IS NOT NULL OR i.phone IS NOT NULL OR i.phone_number IS NOT NULL OR i.mobile IS NOT NULL);

-- Report
SELECT 'UNIVERSITIES_ENRICHED' as check, COUNT(*) as count 
FROM crm_contacts 
WHERE entity_type = 'university' AND (email IS NOT NULL OR website IS NOT NULL OR phone IS NOT NULL);
4.2 Enrich companies from employer_names
sql
-- ONLY run if employer_names has website data
UPDATE crm_contacts cc
SET 
  website = COALESCE(cc.website, en.verified_website_url, en.suggested_website_url),
  enriched_at = now(),
  updated_at = now()
FROM employer_names en
WHERE cc.legacy_employer_name_id = en.id
  AND cc.entity_type = 'company'
  AND (en.verified_website_url IS NOT NULL OR en.suggested_website_url IS NOT NULL);

-- Report
SELECT 'COMPANIES_ENRICHED' as check, COUNT(*) as count 
FROM crm_contacts 
WHERE entity_type = 'company' AND website IS NOT NULL;
4.3 Enrich companies from employer_outreach research_data
sql
-- ONLY run if research_data has contact_email or phone
-- This is a jsonb extraction — adapt based on actual research_data structure found in Step 2.4
-- UPDATE crm_contacts cc
-- SET 
--   email = COALESCE(cc.email, eo.research_data->>'contact_email'),
--   phone = COALESCE(cc.phone, eo.research_data->>'contact_phone'),
--   enriched_at = now(),
--   updated_at = now()
-- FROM employer_outreach eo
-- WHERE cc.legacy_employer_outreach_id = eo.id
--   AND cc.entity_type = 'company'
--   AND (eo.research_data->>'contact_email' IS NOT NULL OR eo.research_data->>'contact_phone' IS NOT NULL);
Claude: Check the actual structure of research_data in Step 2.4 first. If it contains contact info, write the correct JSON path and run. If not, skip and report.
STEP 5: Post-Enrichment Validation
5.1 Reachability by entity type
sql
SELECT 
  entity_type,
  COUNT(*) as total,
  COUNT(email) as has_email,
  COUNT(phone) as has_phone,
  COUNT(whatsapp_number) as has_whatsapp,
  COUNT(website) as has_website,
  COUNT(*) FILTER (WHERE email IS NULL AND phone IS NULL AND whatsapp_number IS NULL AND website IS NULL) as completely_unreachable
FROM crm_contacts
GROUP BY entity_type
ORDER BY total DESC;
5.2 Sample of newly enriched contacts (first 5 per type)
sql
(SELECT id, name, entity_type, email, phone, website, enriched_at 
 FROM crm_contacts WHERE enriched_at IS NOT NULL AND entity_type = 'university' LIMIT 5)
UNION ALL
(SELECT id, name, entity_type, email, phone, website, enriched_at 
 FROM crm_contacts WHERE enriched_at IS NOT NULL AND entity_type = 'company' LIMIT 5)
UNION ALL
(SELECT id, name, entity_type, email, phone, website, enriched_at 
 FROM crm_contacts WHERE enriched_at IS NOT NULL AND entity_type = 'school_public' LIMIT 5);
5.3 Check enrichment improved reachability
sql
SELECT 
  'Before enrichment' as period,
  COUNT(*) FILTER (WHERE email IS NULL AND phone IS NULL AND whatsapp_number IS NULL AND website IS NULL) as unreachable
FROM crm_contacts
WHERE enriched_at IS NULL
UNION ALL
SELECT 
  'After enrichment' as period,
  COUNT(*) FILTER (WHERE email IS NULL AND phone IS NULL AND whatsapp_number IS NULL AND website IS NULL) as unreachable
FROM crm_contacts;
STEP 6: Report Template
plain
## CYCLE 164 VALIDATION REPORT — Bulk Data Discovery & Enrichment

### Data Sources Audited
| Table | Columns Checked | Contact Data Found? |
|---|---|---|
| institutions | | YES / NO |
| employer_names | | YES / NO |
| employer_outreach | | YES / NO |
| senior_schools | | YES / NO |

### Enrichment Results
| Entity Type | Total | Now Has Email | Now Has Phone | Now Has Website | Still Unreachable |
|---|---|---|---|---|---|
| university | | | | | |
| company | | | | | |
| school_public | | | | | |
| school_private | | | | | |
| government | | | | | |
| partner | | | | | |

### Sample Enriched Contacts
| ID | Name | Type | Email | Phone | Website |
|---|---|---|---|---|---|
| | | | | | |

### Key Finding
(One sentence: what percentage of the CRM is now reachable?)

### Recommendation
(One sentence: proceed to outreach, or more data scraping needed?)

### Ready for Phase 4 (WhatsApp)?
YES / NO — (explain)
CRITICAL RULES
Audit FIRST. Only migrate data that actually exists.
Do NOT guess at JSON paths — inspect real research_data first.
Do NOT modify any frontend or existing backend route.
Do NOT commit or push until instructed.