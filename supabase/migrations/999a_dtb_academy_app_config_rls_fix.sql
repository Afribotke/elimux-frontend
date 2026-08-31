-- ============================================================
-- DTB Academy Demo Module — Migration 999a (RLS fix)
-- Already applied directly to project ohlgjvenwekpbpkykutz via MCP
-- on 2026-08-31. Kept here for the repo's own migration history.
-- ============================================================

-- app_config was created without RLS in 999_dtb_academy_demo.sql, unlike
-- every other table in this schema. With RLS off, the broad
-- anon/authenticated GRANTs this project applies by default to new tables
-- (same grants exist on partner_applications, which is safe only because
-- RLS is on there) left app_config's INSERT/UPDATE/DELETE/TRUNCATE open to
-- any holder of the public anon key - i.e. any site visitor via the
-- Supabase REST API. Public config still needs to be readable client-side
-- (isDtbAcademyEnabled() runs from the browser), so: enable RLS, allow
-- public SELECT only. Writes are left to service_role, which bypasses RLS
-- entirely - same shape as partner_applications' own policies.

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_config"
  ON app_config FOR SELECT
  USING (true);
