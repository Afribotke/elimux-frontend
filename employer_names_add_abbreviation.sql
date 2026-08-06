-- Add abbreviation column to employer_names
ALTER TABLE employer_names ADD COLUMN IF NOT EXISTS abbreviation TEXT;

-- Index for fast abbreviation search
CREATE INDEX IF NOT EXISTS idx_employer_names_abbreviation ON employer_names(abbreviation);

-- Backfill: build a first-letter acronym per row (e.g. "Kenya Revenue Authority" -> "KRA"),
-- mirroring the backend's extractAbbreviation() logic. New uploads compute this in the backend;
-- this is a one-time pass for rows created before the abbreviation column existed.
UPDATE employer_names e
SET abbreviation = sub.abbr
FROM (
  SELECT
    id,
    UPPER(STRING_AGG(LEFT(word, 1), '' ORDER BY ord)) AS abbr
  FROM employer_names,
    LATERAL unnest(
      string_to_array(
        TRIM(regexp_replace(
          regexp_replace(name, '\y(Limited|Ltd|Inc|PLC|LLC|Corp|Corporation|Group|Holdings|Company|Co|And|Of|The|For|In|On|At|To|By|With)\y', '', 'gi'),
          '\s+', ' ', 'g'
        )),
        ' '
      )
    ) WITH ORDINALITY AS t(word, ord)
  WHERE word <> ''
  GROUP BY id
  HAVING COUNT(*) >= 2
) AS sub
WHERE e.id = sub.id AND e.abbreviation IS NULL;
