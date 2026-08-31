-- ============================================================
-- DTB Academy Demo Module — Migration 999
-- Status: Demo / pilot module, designed for easy deletion.
-- To rollback: see docs/bridge.md § 8 Rollback
-- ============================================================

-- 0. Generic app config table (did not exist yet in this project —
-- verified via information_schema before writing this migration).
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Feature flag
INSERT INTO app_config (key, value, description)
VALUES ('dtb_academy_enabled', 'true', 'Show DTB Academy financing panel on school pages')
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- 2. Partner applications table (generic — reusable for other banks)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_key TEXT NOT NULL DEFAULT 'dtb_academy',
  school_id UUID REFERENCES senior_schools(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','rejected','disbursed','closed')),

  -- Application data (JSONB = no schema changes for other partners)
  partner_data JSONB NOT NULL DEFAULT '{}',

  -- Loan terms (denormalized for quick display)
  loan_amount NUMERIC(12,2),
  interest_amount NUMERIC(12,2),
  total_repayment NUMERIC(12,2),
  repayment_months INTEGER,
  monthly_installment NUMERIC(12,2),

  -- Tracking
  reference_code TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_partner_apps_user ON partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_apps_partner ON partner_applications(partner_key);
CREATE INDEX IF NOT EXISTS idx_partner_apps_ref ON partner_applications(reference_code);

-- 4. RLS
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications"
  ON partner_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON partner_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON partner_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_apps_updated_at ON partner_applications;
CREATE TRIGGER trg_partner_apps_updated_at
  BEFORE UPDATE ON partner_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
