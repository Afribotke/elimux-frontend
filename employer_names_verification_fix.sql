-- Rename website_url to suggested_website_url (unverified, system-guessed)
-- Add verified_website_url (employer-confirmed)
-- Add verification_status

ALTER TABLE employer_names
  RENAME COLUMN website_url TO suggested_website_url;

ALTER TABLE employer_names
  ADD COLUMN IF NOT EXISTS verified_website_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Update existing rows: all current URLs are unverified suggestions
UPDATE employer_names
  SET verification_status = 'unverified'
  WHERE verification_status IS NULL;
