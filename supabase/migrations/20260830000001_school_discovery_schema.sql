-- Cycle 051: School Discovery Module (C1 Phase 1) + Career Pathways Integration
-- Deliberately separate from the pathways.* schema (KJSA wizard) per Cycle
-- 051-CORRECTION decision: pathways.* is deprecated, this is the replacement.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. senior_schools ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS senior_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text NOT NULL,
  county text NOT NULL,
  sub_county text,
  cluster_type text NOT NULL CHECK (cluster_type IN ('C1','C2','C3','C4')),
  gender text NOT NULL CHECK (gender IN ('Boys','Girls','Mixed')),
  accommodation_type text NOT NULL CHECK (accommodation_type IN ('Boarding','Day','Both')),
  school_type text NOT NULL DEFAULT 'Regular',
  knec_code text,
  uic_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_senior_schools_region ON senior_schools (region);
CREATE INDEX IF NOT EXISTS idx_senior_schools_county ON senior_schools (county);
CREATE INDEX IF NOT EXISTS idx_senior_schools_cluster ON senior_schools (cluster_type);
CREATE INDEX IF NOT EXISTS idx_senior_schools_gender ON senior_schools (gender);
CREATE INDEX IF NOT EXISTS idx_senior_schools_name_trgm ON senior_schools USING gin (name gin_trgm_ops);

ALTER TABLE senior_schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "senior_schools_public_read" ON senior_schools;
CREATE POLICY "senior_schools_public_read" ON senior_schools
  FOR SELECT USING (true);

-- 2. career_pathways ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  required_cluster_min text CHECK (required_cluster_min IN ('C1','C2','C3','C4')),
  recommended_regions text[] NOT NULL DEFAULT '{}',
  recommended_counties text[] NOT NULL DEFAULT '{}',
  career_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_pathways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_pathways_public_read" ON career_pathways;
CREATE POLICY "career_pathways_public_read" ON career_pathways
  FOR SELECT USING (true);

-- 3. student_pathway_selections ------------------------------------------------
CREATE TABLE IF NOT EXISTS student_pathway_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pathway_id uuid NOT NULL REFERENCES career_pathways(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','changed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_pathway_selections_user ON student_pathway_selections (user_id);
CREATE INDEX IF NOT EXISTS idx_student_pathway_selections_active
  ON student_pathway_selections (user_id) WHERE status = 'active';

ALTER TABLE student_pathway_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_pathway_selections_owner_all" ON student_pathway_selections;
CREATE POLICY "student_pathway_selections_owner_all" ON student_pathway_selections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. student_school_selections (the shortlist - My Shortlist tab / --------
--    AddToShortlistButton, optionally tagged with the pathway active when
--    the school was added) ---------------------------------------------
CREATE TABLE IF NOT EXISTS student_school_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES senior_schools(id) ON DELETE CASCADE,
  pathway_id uuid REFERENCES career_pathways(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_student_school_selections_user ON student_school_selections (user_id);

ALTER TABLE student_school_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_school_selections_owner_all" ON student_school_selections;
CREATE POLICY "student_school_selections_owner_all" ON student_school_selections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. pathway_school_mappings (optional curated pins; recommendation API
--    primarily matches dynamically on cluster_type/gender, this table is a
--    supplementary override and may remain empty) ----------------------------
CREATE TABLE IF NOT EXISTS pathway_school_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES career_pathways(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES senior_schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, school_id)
);

ALTER TABLE pathway_school_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pathway_school_mappings_public_read" ON pathway_school_mappings;
CREATE POLICY "pathway_school_mappings_public_read" ON pathway_school_mappings
  FOR SELECT USING (true);
