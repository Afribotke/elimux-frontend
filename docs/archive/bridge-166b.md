# docs/bridge.md — Cycle 166B: Correction — User Decides Outreach Scope

## Objective
Undo the auto-exclusion logic from Cycle 166. Keep `country_relevance` as a metadata label only. All contacts with email/phone remain active for outreach. The user decides who to approach.

## CRITICAL RULES
1. Do NOT drop any table.
2. Revert any status changes that auto-excluded contacts.
3. Keep country_relevance as label only — no business logic gates on it.
4. Do NOT commit or push until instructed.

---

## STEP 1: Revert Foreign University Status

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- 1.1 Re-activate all foreign universities that were set to dormant
-- ============================================
UPDATE crm_contacts
SET 
  status = 'new',
  priority = 'medium',
  updated_at = now()
WHERE entity_type = 'university'
  AND country_relevance = 'foreign'
  AND status = 'dormant';

-- Report
SELECT 
  entity_type,
  country_relevance,
  status,
  COUNT(*) as count
FROM crm_contacts
WHERE entity_type = 'university'
GROUP BY entity_type, country_relevance, status
ORDER BY country_relevance, status;
STEP 2: Fix Outreach View to Include All Contacts
sql
-- ============================================
-- 2.1 Replace the restrictive view with an inclusive one
-- ============================================
DROP VIEW IF EXISTS crm_outreach_ready;

CREATE OR REPLACE VIEW crm_outreach_ready AS
SELECT 
  id,
  name,
  entity_type,
  email,
  phone,
  website,
  county,
  country,
  country_relevance,
  status,
  priority,
  assigned_to,
  enriched_at
FROM crm_contacts
WHERE status NOT IN ('rejected', 'blacklisted')
  AND (email IS NOT NULL OR phone IS NOT NULL);

-- Verify
SELECT 
  country_relevance,
  entity_type,
  COUNT(*) as ready_for_outreach 
FROM crm_outreach_ready 
GROUP BY country_relevance, entity_type
ORDER BY country_relevance, entity_type;
STEP 3: Validation
3.1 Total reachable contacts (all countries)
sql
SELECT 
  entity_type,
  country_relevance,
  COUNT(*) as total,
  COUNT(email) as has_email,
  COUNT(phone) as has_phone
FROM crm_contacts
WHERE status NOT IN ('rejected', 'blacklisted')
GROUP BY entity_type, country_relevance
ORDER BY entity_type, country_relevance;
3.2 Sample of ready contacts by region
sql
SELECT name, entity_type, email, country, country_relevance, status
FROM crm_contacts
WHERE email IS NOT NULL
ORDER BY country_relevance, entity_type, name
LIMIT 15;
STEP 4: Report Template
plain
## CYCLE 166B VALIDATION REPORT — Correction: User Decides Outreach

### Reversion
| Action | Rows Affected |
|---|---|
| Foreign universities re-activated | |

### Outreach Pool (All Contacts, User Decides)
| Country Relevance | Entity Type | Count | Has Email |
|---|---|---|---|
| kenya | university | | |
| foreign | university | | |
| kenya | company | | |

### Total Reachable
| Metric | Count |
|---|---|
| Total contacts with email | |
| Total contacts with phone | |
| Kenya universities | |
| Foreign universities | |
| Companies | |

### System Behavior
| Rule | Status |
|---|---|
| Auto-exclude foreign contacts | REMOVED |
| User decides who to approach | ACTIVE |
| country_relevance used for | Filtering/labeling only |

### Ready for Live Outreach?
YES — [N] contacts have email. User decides which to approach.
CRITICAL RULES
country_relevance is metadata only. Never gates outreach.
User has full authority over who receives outreach.
Do NOT commit or push until instructed.