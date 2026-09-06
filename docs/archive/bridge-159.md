# docs/bridge.md — Cycle 159: Phase 1B — Sync Schools into Unified CRM

## Objective
Audit all school-related tables in the ElimuX database, then sync every school (public C1–C4, PR, private) into `crm_contacts` with correct `entity_type`, county, and contact info. Report exact findings before and after.

## CRITICAL RULES
1. Do NOT drop any table.
2. Do NOT modify existing `crm_contacts` rows (universities + companies).
3. Run SQL one block at a time. Report EXACT output.
4. If any step fails, STOP and report the error.

---

## STEP 1: Database Audit — School Tables

Run each query separately in Supabase SQL Editor and report EXACT output.

### 1.1 Find all school-related tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name ILIKE '%school%'
    OR table_name ILIKE '%kemis%'
    OR table_name ILIKE '%c1%'
    OR table_name ILIKE '%c2%'
    OR table_name ILIKE '%c3%'
    OR table_name ILIKE '%c4%'
    OR table_name ILIKE '%primary%'
    OR table_name ILIKE '%secondary%'
  )
ORDER BY table_name;
```

### 1.2 Columns for each school table found
For each table from 1.1:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'TABLE_NAME_HERE' 
ORDER BY ordinal_position;
```

### 1.3 Row counts
```sql
SELECT 'TABLE_NAME' as table_name, COUNT(*) as row_count FROM public.TABLE_NAME;
```

### 1.4 Sample rows (first 3)
```sql
SELECT * FROM public.TABLE_NAME LIMIT 3;
```

### 1.5 Check for school type/level/category columns
```sql
-- Run on each school table to see distinct values
SELECT DISTINCT level, type, category, ownership, status 
FROM public.TABLE_NAME 
WHERE level IS NOT NULL OR type IS NOT NULL OR category IS NOT NULL OR ownership IS NOT NULL
LIMIT 20;
```

## STEP 2: Sync Schools into crm_contacts

After audit, run this migration. Claude must adapt the column names based on the real schema found in Step 1.

```sql
-- ============================================
-- 2.1 Sync schools → crm_contacts
-- ============================================
-- NOTE: Claude must replace column names below with real ones from audit.
-- If table is named differently, adjust accordingly.

INSERT INTO crm_contacts (
  entity_type,
  name,
  slug,
  email,
  phone,
  website,
  country,
  county,
  constituency,
  town,
  status,
  priority,
  source,
  linked_school_id,
  tags,
  created_at,
  updated_at
)
SELECT
  CASE 
    WHEN s.ownership ILIKE '%private%' OR s.type ILIKE '%private%' THEN 'school_private'
    WHEN s.level ILIKE '%secondary%' OR s.category ILIKE '%secondary%' THEN 'school_public'
    WHEN s.level ILIKE '%primary%' OR s.category ILIKE '%primary%' THEN 'school_public'
    WHEN s.level ILIKE '%pr%' OR s.category ILIKE '%pr%' THEN 'school_public'
    ELSE 'school_public'
  END as entity_type,
  
  COALESCE(s.name, s.school_name, 'Unknown School') as name,
  
  LOWER(REGEXP_REPLACE(
    COALESCE(s.name, s.school_name, 'unknown'), 
    '[^a-zA-Z0-9]+', '-', 'g'
  )) || '-sch-' || LEFT(s.id::text, 8) as slug,
  
  s.email as email,
  s.phone as phone,
  s.website as website,
  'Kenya' as country,
  s.county as county,
  s.constituency as constituency,
  s.town as town,
  
  'new' as status,
  'medium' as priority,
  'kemis_government_data' as source,
  
  s.id as linked_school_id,
  
  ARRAY[
    COALESCE(s.level, s.category),
    COALESCE(s.ownership, 'public'),
    'kenya-schools'
  ] as tags,
  
  COALESCE(s.created_at, now()) as created_at,
  now() as updated_at

FROM schools s
WHERE s.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM crm_contacts cc 
    WHERE cc.linked_school_id = s.id
  )
ON CONFLICT (slug) DO NOTHING;

-- Report
SELECT 'SCHOOLS_SYNCED' as check, COUNT(*) as count FROM crm_contacts 
WHERE entity_type IN ('school_public', 'school_private');
```

## STEP 3: Validation

```sql
-- 3.1 Total CRM contacts by entity_type
SELECT entity_type, COUNT(*) as count 
FROM crm_contacts 
GROUP BY entity_type 
ORDER BY count DESC;

-- 3.2 School sample (first 5)
SELECT id, name, entity_type, county, constituency, tags, linked_school_id 
FROM crm_contacts 
WHERE entity_type IN ('school_public', 'school_private') 
LIMIT 5;

-- 3.3 Schools by county (top 10)
SELECT county, entity_type, COUNT(*) as count 
FROM crm_contacts 
WHERE entity_type IN ('school_public', 'school_private') 
GROUP BY county, entity_type 
ORDER BY count DESC 
LIMIT 10;

-- 3.4 Check for NULL counties
SELECT entity_type, COUNT(*) as missing_county 
FROM crm_contacts 
WHERE entity_type IN ('school_public', 'school_private') AND county IS NULL 
GROUP BY entity_type;
```

## STEP 4: Report Template

```plain
## CYCLE 159 VALIDATION REPORT — Schools Sync

### School Tables Audited
| Table Name | Row Count | Key Columns |
|---|---|---|
| (fill) | | |

### Migration Results
| Check | Expected | Actual | Pass? |
|---|---|---|---|
| Schools synced | (from audit) | | |
| Universities (unchanged) | 8,917 | | |
| Companies (unchanged) | 2,846 | | |
| Total CRM contacts | ~11,763 + schools | | |

### Sample Data Quality
| Check | Result |
|---|---|
| Schools with county | X% |
| Schools with email | X% |
| Schools with phone | X% |
| Private vs Public split | X / Y |

### Errors
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Phase 2 (Templates + Email)?
YES / NO
```

## CRITICAL RULES
- Adapt column names to match REAL schema found in audit.
- Do NOT drop any table.
- Do NOT modify existing crm_contacts rows.
- If school table doesn't exist or has different name, report it exactly.
- Do NOT commit or push.
