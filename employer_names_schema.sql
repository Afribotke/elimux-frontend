-- Employer names table (uploaded by admin, discovered by system, verified by employer)
CREATE TABLE IF NOT EXISTS employer_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL, -- lowercase, no spaces, for URL guessing
  website_url TEXT,
  discovery_source TEXT CHECK (discovery_source IN ('heuristic', 'manual', 'search_api')),
  discovery_status TEXT DEFAULT 'pending' CHECK (discovery_status IN ('pending', 'found', 'verified', 'not_found')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast autocomplete
CREATE INDEX IF NOT EXISTS idx_employer_names_normalized ON employer_names(normalized_name);
CREATE INDEX IF NOT EXISTS idx_employer_names_name_trgm ON employer_names USING gin (name gin_trgm_ops);

-- Enable pg_trgm extension for fuzzy search (run once per database)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- RLS: Public can read active names, only admins can write
ALTER TABLE employer_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active employer names"
  ON employer_names FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access on employer names"
  ON employer_names FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
    )
  );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_employer_names_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_employer_names_updated_at
  BEFORE UPDATE ON employer_names
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_names_updated_at();
