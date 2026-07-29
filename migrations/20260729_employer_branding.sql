ALTER TABLE employers ADD COLUMN IF NOT EXISTS brand_colors JSONB;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS logo_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;
