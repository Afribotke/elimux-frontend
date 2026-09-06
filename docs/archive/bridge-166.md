# docs/bridge.md — Cycle 166: CRM Cleanup — Kenya-Only Outreach List

## Objective
Flag and segregate non-Kenyan contacts so they never enter an outreach campaign. Produce a clean, actionable list of ~198 Kenya-relevant contacts ready for live email outreach. Schools remain blocked pending separate data source.

## CRITICAL RULES
1. Do NOT drop any table.
2. Do NOT delete rows — flag them as inactive/irrelevant.
3. Run SQL one block at a time. Report EXACT output.
4. If any step fails, STOP and report the error.
5. Do NOT commit or push until instructed.

---

## STEP 1: Flag Kenyan vs Non-Kenyan Universities

```sql
ALTER TABLE crm_contacts 
ADD COLUMN IF NOT EXISTS country_relevance text DEFAULT 'unknown' 
CHECK (country_relevance IN ('kenya', 'foreign', 'unknown'));

UPDATE crm_contacts cc
SET country_relevance = 'kenya'
FROM institutions i
JOIN countries c ON c.id = i.country_id
WHERE cc.linked_institution_id = i.id
  AND cc.entity_type = 'university'
  AND c.name ILIKE '%kenya%';

UPDATE crm_contacts
SET country_relevance = 'foreign'
WHERE entity_type = 'university'
  AND country_relevance = 'unknown';

UPDATE crm_contacts
SET country_relevance = 'kenya'
WHERE entity_type = 'company';
```

## STEP 2: Deactivate Foreign Universities from Outreach

```sql
UPDATE crm_contacts
SET status = 'dormant', priority = 'low', updated_at = now()
WHERE entity_type = 'university' AND country_relevance = 'foreign';
```

## STEP 3: Create Kenya-Only Outreach View

```sql
CREATE OR REPLACE VIEW crm_outreach_ready AS
SELECT id, name, entity_type, email, phone, website, county, status, priority, assigned_to, country_relevance, enriched_at
FROM crm_contacts
WHERE status NOT IN ('dormant', 'rejected', 'blacklisted')
  AND country_relevance = 'kenya'
  AND (email IS NOT NULL OR phone IS NOT NULL);
```

## STEP 4-5: Validation + Report Template
(Superseded by Cycle 166B before this cycle's report was written — see docs/archive/bridge-166b.md and the corresponding audit-log entry for what was actually executed and then partially reverted.)

CRITICAL RULES (restated)
- Do NOT delete any row. Only flag and update status.
- Do NOT modify existing frontend or backend routes.
- Do NOT commit or push until instructed.
