# docs/bridge.md — Cycle 158: Phase 1 — Unified CRM Foundation

## Objective
Create the unified CRM schema, migrate existing employer data, sync universities from institutions, and harden RLS. Old tables remain untouched until validation passes.

## CRITICAL RULES
1. Do NOT drop any existing table until the validation step confirms migration success.
2. Do NOT modify existing frontend pages or backend routes in this cycle.
3. Run SQL in Supabase SQL Editor one block at a time.
4. Report EXACT output of every validation query.
5. If any step fails, STOP and report the error. Do not proceed to the next step.

---

## STEP 1: Create Unified CRM Schema

Run this SQL block in Supabase SQL Editor as ONE transaction:

```sql
-- ============================================
-- 1.1 CRM Contacts (Master Table)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  entity_type           text NOT NULL CHECK (entity_type IN (
                          'university','school_public','school_private',
                          'company','government','partner','other'
                        )),
  name                  text NOT NULL,
  slug                  text UNIQUE,
  
  -- Links to existing ElimuX entities
  linked_institution_id uuid,
  linked_school_id      uuid,
  linked_employer_id    uuid,
  legacy_employer_name_id uuid,
  legacy_employer_outreach_id uuid,
  
  -- Location
  country               text DEFAULT 'Kenya',
  county                text,
  constituency          text,
  town                  text,
  
  -- Contact Channels
  email                 text,
  phone                 text,
  whatsapp_number       text,
  website               text,
  
  -- CRM State
  status                text DEFAULT 'new' CHECK (status IN (
                          'new','contacted','responded','negotiating',
                          'onboarded','active','dormant','rejected','blacklisted'
                        )),
  priority              text DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  
  -- Assignment
  assigned_to           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at           timestamptz,
  
  -- Engagement
  last_contact_at       timestamptz,
  last_contact_via      text CHECK (last_contact_via IN ('email','sms','whatsapp','call','visit')),
  next_followup_at      timestamptz,
  contact_count         int DEFAULT 0,
  response_count        int DEFAULT 0,
  
  -- Metadata
  source                text DEFAULT 'manual',
  notes                 text,
  tags                  text[],
  research_data         jsonb,
  
  -- Enrichment
  enriched_at           timestamptz,
  enrichment_data       jsonb,
  
  -- Compliance
  unsubscribed_email    boolean DEFAULT false,
  unsubscribed_sms      boolean DEFAULT false,
  unsubscribed_whatsapp boolean DEFAULT false,
  consent_recorded_at   timestamptz,
  
  -- Audit
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_crm_contacts_entity_type ON crm_contacts(entity_type);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_crm_contacts_assigned_to ON crm_contacts(assigned_to);
CREATE INDEX idx_crm_contacts_county ON crm_contacts(county);
CREATE INDEX idx_crm_contacts_country ON crm_contacts(country);
CREATE INDEX idx_crm_contacts_next_followup ON crm_contacts(next_followup_at);
CREATE INDEX idx_crm_contacts_legacy_employer_name ON crm_contacts(legacy_employer_name_id);
CREATE INDEX idx_crm_contacts_linked_institution ON crm_contacts(linked_institution_id);

-- ============================================
-- 1.2 CRM Contact People (Key Personnel)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_contact_people (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
  name            text NOT NULL,
  title           text,
  email           text,
  phone           text,
  whatsapp        text,
  is_primary      boolean DEFAULT false,
  is_decision_maker boolean DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_contact_people_contact ON crm_contact_people(contact_id);

-- ============================================
-- 1.3 CRM Message Templates (Schema Only)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_message_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  category          text NOT NULL CHECK (category IN (
                      'onboarding','followup','reminder','negotiation',
                      're_engagement','announcement','custom'
                    )),
  
  channel_email     boolean DEFAULT false,
  subject_email     text,
  body_html         text,
  body_text         text,
  
  channel_sms       boolean DEFAULT false,
  body_sms          text,
  
  channel_whatsapp  boolean DEFAULT false,
  body_whatsapp     text,
  
  target_entity_types text[],
  
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active         boolean DEFAULT true,
  usage_count       int DEFAULT 0,
  
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ============================================
-- 1.4 CRM Messages (Universal Send Log)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
  person_id       uuid REFERENCES crm_contact_people(id) ON DELETE SET NULL,
  template_id     uuid REFERENCES crm_message_templates(id) ON DELETE SET NULL,
  
  channel         text NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  subject         text,
  body            text NOT NULL,
  
  status          text DEFAULT 'queued' CHECK (status IN (
                    'queued','pending_approval','sent','delivered',
                    'read','opened','clicked','replied','failed','bounced','suppressed'
                  )),
  
  provider        text,
  provider_msg_id text,
  
  sent_at         timestamptz,
  delivered_at    timestamptz,
  read_at         timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  replied_at      timestamptz,
  failed_at       timestamptz,
  fail_reason     text,
  
  sent_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address      inet,
  user_agent      text,
  cost_kes        decimal(10,2),
  
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_messages_contact ON crm_messages(contact_id);
CREATE INDEX idx_crm_messages_status ON crm_messages(status);
CREATE INDEX idx_crm_messages_sent_by ON crm_messages(sent_by);

-- ============================================
-- 1.5 CRM Activities (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  metadata    jsonb,
  ip_address  inet,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_activities_user ON crm_activities(user_id);
CREATE INDEX idx_crm_activities_entity ON crm_activities(entity_type, entity_id);
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at);

-- ============================================
-- 1.6 CRM Team (Evolved from outreach_team)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_team (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('super_admin','manager','sales_rep','viewer')),
  reports_to  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  county_scope text[], -- ['Nairobi','Mombasa'] or NULL for all
  entity_type_scope text[], -- ['company','university'] or NULL for all
  is_active   boolean DEFAULT true,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_crm_team_user ON crm_team(user_id);
CREATE INDEX idx_crm_team_reports_to ON crm_team(reports_to);

-- ============================================
-- 1.7 Trigger: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_message_templates_updated_at BEFORE UPDATE ON crm_message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## STEP 2: Migrate Employer Data

Run this SQL block in Supabase SQL Editor:

```sql
-- ============================================
-- 2.1 Migrate employer_names + employer_outreach → crm_contacts
-- ============================================
INSERT INTO crm_contacts (
  entity_type,
  name,
  slug,
  email,
  website,
  country,
  county,
  status,
  priority,
  assigned_to,
  supervised_by,
  notes,
  research_data,
  last_contact_at,
  next_followup_at,
  source,
  legacy_employer_name_id,
  legacy_employer_outreach_id,
  created_at,
  updated_at
)
SELECT
  'company' as entity_type,
  COALESCE(en.name, 'Unknown Company') as name,
  LOWER(REGEXP_REPLACE(COALESCE(en.name, 'unknown'), '[^a-zA-Z0-9]+', '-', 'g')) as slug,
  eo.research_data->>'contact_email' as email,
  COALESCE(en.verified_website_url, en.suggested_website_url) as website,
  'Kenya' as country,
  eo.research_data->>'county' as county,
  COALESCE(eo.status, 'new') as status,
  COALESCE(eo.priority, 'medium') as priority,
  eo.assigned_to,
  eo.supervised_by,
  eo.notes,
  eo.research_data,
  eo.last_contact_date as last_contact_at,
  eo.next_follow_up_date as next_followup_at,
  COALESCE(en.discovery_source, 'manual') as source,
  en.id as legacy_employer_name_id,
  eo.id as legacy_employer_outreach_id,
  COALESCE(eo.invitation_sent_at, now()) as created_at,
  now() as updated_at
FROM employer_names en
LEFT JOIN employer_outreach eo ON eo.employer_name_id = en.id
WHERE en.is_active = true
ON CONFLICT (slug) DO NOTHING;

-- Report how many were inserted
SELECT 'COMPANIES_MIGRATED' as check, COUNT(*) as count FROM crm_contacts WHERE entity_type = 'company';
```

## STEP 3: Sync Universities from Institutions

Run this SQL block:

```sql
-- ============================================
-- 3.1 Sync institutions → crm_contacts (universities)
-- ============================================
INSERT INTO crm_contacts (
  entity_type,
  name,
  slug,
  email,
  website,
  country,
  county,
  status,
  priority,
  source,
  linked_institution_id,
  created_at,
  updated_at
)
SELECT
  'university' as entity_type,
  COALESCE(i.name, 'Unknown Institution') as name,
  LOWER(REGEXP_REPLACE(COALESCE(i.name, 'unknown'), '[^a-zA-Z0-9]+', '-', 'g')) || '-uni' as slug,
  i.contact_email as email,
  i.website_url as website,
  COALESCE(i.country, 'Kenya') as country,
  i.county,
  'new' as status,
  'medium' as priority,
  'elimux_database' as source,
  i.id as linked_institution_id,
  now() as created_at,
  now() as updated_at
FROM institutions i
WHERE i.type = 'university' OR i.type IS NULL
ON CONFLICT (slug) DO NOTHING;

-- Report
SELECT 'UNIVERSITIES_SYNCED' as check, COUNT(*) as count FROM crm_contacts WHERE entity_type = 'university';
```

## STEP 4: Migrate Verified Employers

Run this SQL block:

```sql
-- ============================================
-- 4.1 Link verified employers to their crm_contacts
-- ============================================
UPDATE crm_contacts
SET 
  linked_employer_id = e.id,
  status = 'onboarded',
  email = COALESCE(crm_contacts.email, e.company_email),
  phone = COALESCE(crm_contacts.phone, e.company_phone),
  county = COALESCE(crm_contacts.county, e.location_county)
FROM employers e
WHERE crm_contacts.legacy_employer_name_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM employer_names en 
    WHERE en.id = crm_contacts.legacy_employer_name_id
      AND LOWER(en.normalized_name) = LOWER(e.company_name)
  );

-- Report
SELECT 'EMPLOYERS_LINKED' as check, COUNT(*) as count FROM crm_contacts WHERE linked_employer_id IS NOT NULL;
```

## STEP 5: Migrate Outreach Activity Logs

Run this SQL block:

```sql
-- ============================================
-- 5.1 Migrate outreach_activity_logs → crm_activities
-- ============================================
INSERT INTO crm_activities (user_id, action, entity_type, entity_id, metadata, created_at)
SELECT
  performed_by as user_id,
  action,
  'contact' as entity_type,
  cc.id as entity_id,
  details as metadata,
  COALESCE(details->>'timestamp', now()::text)::timestamptz as created_at
FROM outreach_activity_logs oal
JOIN crm_contacts cc ON cc.legacy_employer_outreach_id = oal.employer_outreach_id;

-- Report
SELECT 'ACTIVITIES_MIGRATED' as check, COUNT(*) as count FROM crm_activities;
```

## STEP 6: Migrate Outreach Team

Run this SQL block:

```sql
-- ============================================
-- 6.1 Migrate outreach_team → crm_team
-- ============================================
INSERT INTO crm_team (user_id, role, reports_to, is_active, created_at)
SELECT
  user_id,
  CASE 
    WHEN role = 'manager' THEN 'manager'
    WHEN role = 'rep' THEN 'sales_rep'
    ELSE 'sales_rep'
  END as role,
  reports_to,
  true as is_active,
  now() as created_at
FROM outreach_team
ON CONFLICT DO NOTHING;

-- Report
SELECT 'TEAM_MIGRATED' as check, COUNT(*) as count FROM crm_team;
```

## STEP 7: Harden RLS (Critical Security Fix)

Run this SQL block:

```sql
-- ============================================
-- 7.1 Enable RLS on all new CRM tables
-- ============================================
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contact_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_team ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7.2 Drop any existing permissive public policies on old tables
-- ============================================
-- First, list what exists (for reporting)
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('employer_names', 'potential_employers', 'nita_employer_registry');

-- ============================================
-- 7.3 Create secure policies for crm_contacts
-- ============================================

-- Super Admin: full access
CREATE POLICY crm_contacts_super_admin ON crm_contacts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Manager: see all, edit all
CREATE POLICY crm_contacts_manager ON crm_contacts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_team 
      WHERE crm_team.user_id = auth.uid() 
        AND crm_team.role = 'manager' 
        AND crm_team.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_team 
      WHERE crm_team.user_id = auth.uid() 
        AND crm_team.role = 'manager' 
        AND crm_team.is_active = true
    )
  );

-- Sales Rep: see/edit only assigned contacts
CREATE POLICY crm_contacts_rep_select ON crm_contacts
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM crm_team 
      WHERE crm_team.user_id = auth.uid() 
        AND crm_team.role IN ('manager','super_admin') 
        AND crm_team.is_active = true
    )
  );

CREATE POLICY crm_contacts_rep_update ON crm_contacts
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Service role: full access (for backend)
CREATE POLICY crm_contacts_service ON crm_contacts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7.4 Secure policies for crm_messages
-- ============================================
CREATE POLICY crm_messages_super_admin ON crm_messages
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY crm_messages_sender ON crm_messages
  FOR ALL TO authenticated
  USING (sent_by = auth.uid());

CREATE POLICY crm_messages_service ON crm_messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7.5 Secure policies for crm_activities
-- ============================================
CREATE POLICY crm_activities_all ON crm_activities
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY crm_activities_service ON crm_activities
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7.6 Secure policies for crm_team
-- ============================================
CREATE POLICY crm_team_super_admin ON crm_team
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY crm_team_self ON crm_team
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY crm_team_service ON crm_team
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 7.7 Fix old employer_names RLS (remove permissive public)
-- ============================================
-- Drop existing permissive public policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'employer_names' AND roles = '{public}'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON employer_names', pol.policyname);
  END LOOP;
END $$;

-- Add secure policy for employer_names
CREATE POLICY employer_names_service ON employer_names
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY employer_names_admin ON employer_names
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

## STEP 8: Validation — Run These Queries and Report EXACT Output

```sql
-- 8.1 Total contacts by entity_type
SELECT entity_type, COUNT(*) as count FROM crm_contacts GROUP BY entity_type ORDER BY count DESC;

-- 8.2 Sample of migrated companies (first 5)
SELECT id, name, entity_type, status, county, assigned_to, legacy_employer_name_id 
FROM crm_contacts WHERE entity_type = 'company' LIMIT 5;

-- 8.3 Sample of synced universities (first 5)
SELECT id, name, entity_type, status, county, linked_institution_id 
FROM crm_contacts WHERE entity_type = 'university' LIMIT 5;

-- 8.4 Count of linked verified employers
SELECT COUNT(*) as linked_employers FROM crm_contacts WHERE linked_employer_id IS NOT NULL;

-- 8.5 RLS policy check
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename LIKE 'crm_%' OR tablename = 'employer_names'
ORDER BY tablename, policyname;

-- 8.6 Team members migrated
SELECT role, COUNT(*) FROM crm_team GROUP BY role;

-- 8.7 Activities migrated
SELECT COUNT(*) as total_activities FROM crm_activities;
```

## STEP 9: Backend TypeScript Types (Create File)

Create the file `elimux-backend/src/types/crm.ts` with this exact content:

```typescript
export type CRMEntityType = 'university' | 'school_public' | 'school_private' | 'company' | 'government' | 'partner' | 'other';
export type CRMStatus = 'new' | 'contacted' | 'responded' | 'negotiating' | 'onboarded' | 'active' | 'dormant' | 'rejected' | 'blacklisted';
export type CRMPriority = 'low' | 'medium' | 'high';
export type CRMChannel = 'email' | 'sms' | 'whatsapp';
export type CRMMessageStatus = 'queued' | 'pending_approval' | 'sent' | 'delivered' | 'read' | 'opened' | 'clicked' | 'replied' | 'failed' | 'bounced' | 'suppressed';
export type CRMTeamRole = 'super_admin' | 'manager' | 'sales_rep' | 'viewer';
export type CRMMessageCategory = 'onboarding' | 'followup' | 'reminder' | 'negotiation' | 're_engagement' | 'announcement' | 'custom';

export interface CRMContact {
  id: string;
  entity_type: CRMEntityType;
  name: string;
  slug?: string;
  linked_institution_id?: string;
  linked_school_id?: string;
  linked_employer_id?: string;
  legacy_employer_name_id?: string;
  legacy_employer_outreach_id?: string;
  country?: string;
  county?: string;
  constituency?: string;
  town?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  website?: string;
  status: CRMStatus;
  priority: CRMPriority;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  last_contact_at?: string;
  last_contact_via?: string;
  next_followup_at?: string;
  contact_count: number;
  response_count: number;
  source: string;
  notes?: string;
  tags?: string[];
  research_data?: Record<string, unknown>;
  enriched_at?: string;
  enrichment_data?: Record<string, unknown>;
  unsubscribed_email: boolean;
  unsubscribed_sms: boolean;
  unsubscribed_whatsapp: boolean;
  consent_recorded_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMContactPerson {
  id: string;
  contact_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  is_primary?: boolean;
  is_decision_maker?: boolean;
  notes?: string;
  created_at: string;
}

export interface CRMMessageTemplate {
  id: string;
  name: string;
  category: CRMMessageCategory;
  channel_email: boolean;
  subject_email?: string;
  body_html?: string;
  body_text?: string;
  channel_sms: boolean;
  body_sms?: string;
  channel_whatsapp: boolean;
  body_whatsapp?: string;
  target_entity_types?: CRMEntityType[];
  created_by?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CRMMessage {
  id: string;
  contact_id: string;
  person_id?: string;
  template_id?: string;
  channel: CRMChannel;
  subject?: string;
  body: string;
  status: CRMMessageStatus;
  provider?: string;
  provider_msg_id?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  failed_at?: string;
  fail_reason?: string;
  sent_by?: string;
  ip_address?: string;
  user_agent?: string;
  cost_kes?: number;
  created_at: string;
}

export interface CRMActivity {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface CRMTeamMember {
  id: string;
  user_id: string;
  role: CRMTeamRole;
  reports_to?: string;
  county_scope?: string[];
  entity_type_scope?: CRMEntityType[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
}
```

## STEP 10: Final Report Template

After completing all steps, fill in and return:

```plain
## PHASE 1 VALIDATION REPORT

### Migration Results
| Check | Expected | Actual | Pass? |
|---|---|---|---|
| Companies migrated | ~2,846 | | |
| Universities synced | (count from institutions) | | |
| Verified employers linked | 6 | | |
| Activities migrated | (from outreach_activity_logs) | | |
| Team members migrated | (from outreach_team) | | |

### Schema Created
| Table | Exists? | Row Count |
|---|---|---|
| crm_contacts | | |
| crm_contact_people | | |
| crm_message_templates | | |
| crm_messages | | |
| crm_activities | | |
| crm_team | | |

### RLS Status
| Table | Secure Policies? | Public Permissive Removed? |
|---|---|---|
| crm_contacts | | |
| crm_messages | | |
| crm_activities | | |
| crm_team | | |
| employer_names | | |

### Files Created
| File Path | Status |
|---|---|
| elimux-backend/src/types/crm.ts | |

### Old Tables Status
| Table | Action Taken |
|---|---|
| employer_names | KEPT (pending Phase 5 cleanup) |
| employer_outreach | KEPT (pending Phase 5 cleanup) |
| potential_employers | (state) |
| outreach_activity_logs | KEPT (pending Phase 5 cleanup) |
| outreach_team | KEPT (pending Phase 5 cleanup) |

### Errors Encountered
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Phase 2?
YES / NO — (explain if NO)
```

## CRITICAL RULES
- Do NOT drop any old table. They stay until Phase 5.
- Do NOT modify existing frontend pages or backend routes.
- If any SQL step fails, STOP and report the exact error.
- Do NOT commit or push. Stage only if requested.
- Report validation output exactly as returned by Supabase.
