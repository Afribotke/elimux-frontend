-- ============================================================
-- SEED: pathways.subject_combinations
--
-- This replaces a version of this seed that referenced a table
-- (pathways.careers) and columns (career_id, pathway_id, combination_name,
-- rank, suitability_score) that do not exist anywhere in this schema.
-- Written against the REAL live schema, checked via the Supabase MCP
-- connection immediately before writing this file:
--   pathways.subject_combinations: id, track_id, code, name,
--     subjects (uuid[] referencing pathways.subjects.id - NOT text),
--     career_tags (text[], informational only), is_active, created_at.
-- Also checked how the app code actually queries this table
-- (src/app/api/pathways/interpret/route.ts,
-- src/app/api/kjsa/analyze/route.ts): both filter by
-- track_id + is_active = true only. career_id/pathway_id/rank/
-- suitability_score are never queried anywhere - they were invented,
-- not real columns to preserve.
--
-- DO NOT RUN THIS AUTOMATICALLY. Paste into Supabase Dashboard
-- -> SQL Editor -> New Query and run manually, same as every other
-- pathways migration/seed in this project.
-- ============================================================

-- TRUNCATE fails here: pathways.guidance_sessions has an FK to this
-- table (both empty at the time this was written, but TRUNCATE checks
-- the constraint regardless without CASCADE). DELETE avoids the issue.
DELETE FROM pathways.subject_combinations;

-- Humanities & Business Studies track (Social Sciences pathway)
INSERT INTO pathways.subject_combinations (track_id, code, name, subjects, career_tags, is_active) VALUES
('2784661a-e63a-44e8-915e-978dcacd8c0e', 'HBS-1', 'History, Geography, CRE, Business Studies',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'HIS'), (SELECT id FROM pathways.subjects WHERE code = 'GEO'), (SELECT id FROM pathways.subjects WHERE code = 'CRE'), (SELECT id FROM pathways.subjects WHERE code = 'BST')],
  ARRAY['lawyer', 'accountant', 'entrepreneur'], true),
('2784661a-e63a-44e8-915e-978dcacd8c0e', 'HBS-2', 'History, Geography, CRE, Agriculture',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'HIS'), (SELECT id FROM pathways.subjects WHERE code = 'GEO'), (SELECT id FROM pathways.subjects WHERE code = 'CRE'), (SELECT id FROM pathways.subjects WHERE code = 'AGR')],
  ARRAY['lawyer'], true),
('2784661a-e63a-44e8-915e-978dcacd8c0e', 'HBS-3', 'History, Geography, Business Studies, Agriculture',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'HIS'), (SELECT id FROM pathways.subjects WHERE code = 'GEO'), (SELECT id FROM pathways.subjects WHERE code = 'BST'), (SELECT id FROM pathways.subjects WHERE code = 'AGR')],
  ARRAY['lawyer', 'accountant'], true),
('2784661a-e63a-44e8-915e-978dcacd8c0e', 'HBS-4', 'History, CRE, Business Studies, Mathematics',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'HIS'), (SELECT id FROM pathways.subjects WHERE code = 'CRE'), (SELECT id FROM pathways.subjects WHERE code = 'BST'), (SELECT id FROM pathways.subjects WHERE code = 'MAT')],
  ARRAY['lawyer'], true);

-- Pure Sciences track (STEM pathway)
INSERT INTO pathways.subject_combinations (track_id, code, name, subjects, career_tags, is_active) VALUES
('66d5a47b-da2b-46b1-bce6-372210a346c2', 'PS-1', 'Mathematics, Physics, Chemistry, Biology',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'MAT'), (SELECT id FROM pathways.subjects WHERE code = 'PHY'), (SELECT id FROM pathways.subjects WHERE code = 'CHE'), (SELECT id FROM pathways.subjects WHERE code = 'BIO')],
  ARRAY['doctor', 'nurse'], true),
('66d5a47b-da2b-46b1-bce6-372210a346c2', 'PS-2', 'Mathematics, Physics, Chemistry, Computer Studies',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'MAT'), (SELECT id FROM pathways.subjects WHERE code = 'PHY'), (SELECT id FROM pathways.subjects WHERE code = 'CHE'), (SELECT id FROM pathways.subjects WHERE code = 'CMP')],
  ARRAY['civil engineer', 'software engineer', 'pilot'], true),
('66d5a47b-da2b-46b1-bce6-372210a346c2', 'PS-3', 'Mathematics, Physics, Biology, Agriculture',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'MAT'), (SELECT id FROM pathways.subjects WHERE code = 'PHY'), (SELECT id FROM pathways.subjects WHERE code = 'BIO'), (SELECT id FROM pathways.subjects WHERE code = 'AGR')],
  ARRAY['doctor'], true);

-- Arts track (Arts & Sports Science pathway)
INSERT INTO pathways.subject_combinations (track_id, code, name, subjects, career_tags, is_active) VALUES
('0e155ff0-505c-45e5-9ca6-4504ed3815c2', 'ART-1', 'Music & Dance, Fine Arts, Home Science, French',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'MUD'), (SELECT id FROM pathways.subjects WHERE code = 'FAR'), (SELECT id FROM pathways.subjects WHERE code = 'HSC'), (SELECT id FROM pathways.subjects WHERE code = 'FRE')],
  ARRAY['musician'], true),
('0e155ff0-505c-45e5-9ca6-4504ed3815c2', 'ART-2', 'Fine Arts, Music & Dance, Home Science, German',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'FAR'), (SELECT id FROM pathways.subjects WHERE code = 'MUD'), (SELECT id FROM pathways.subjects WHERE code = 'HSC'), (SELECT id FROM pathways.subjects WHERE code = 'GER')],
  ARRAY['artist', 'actor'], true),
('0e155ff0-505c-45e5-9ca6-4504ed3815c2', 'ART-3', 'Theatre & Film, Music & Dance, Fine Arts, English',
  ARRAY[(SELECT id FROM pathways.subjects WHERE code = 'THF'), (SELECT id FROM pathways.subjects WHERE code = 'MUD'), (SELECT id FROM pathways.subjects WHERE code = 'FAR'), (SELECT id FROM pathways.subjects WHERE code = 'ENG')],
  ARRAY['actor', 'musician'], true);

-- Verify
SELECT sc.code, sc.name, t.name AS track, array_length(sc.subjects, 1) AS subject_count, sc.career_tags
FROM pathways.subject_combinations sc
JOIN pathways.tracks t ON sc.track_id = t.id
ORDER BY t.name, sc.code;
