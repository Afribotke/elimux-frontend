-- Staged for future use only — nothing in elimux-backend or elimux-frontend
-- reads or writes this table yet. Not wired into the admin dashboard.
--
-- RLS follows the existing convention for admin-only tables in this schema
-- (see elimux-sql/26_contact_messages.sql, 21_institution_accounts.sql):
-- enabled with no anon/authenticated policies, so only the backend's
-- service-role client can read/write. This admin dashboard authenticates
-- via a custom X-Admin-Key header checked by elimux-backend, not a Supabase
-- Auth session, so auth.uid()-based policies don't apply here.

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON public.activity_log(entity_type);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- If this project later adds real Supabase-Auth-based admin roles (a
-- `public.profiles` table with a `role` column, admins signed in via
-- Supabase Auth rather than the X-Admin-Key header), a browser-read policy
-- would look like this. Correct Postgres syntax note: CREATE POLICY has no
-- IF NOT EXISTS clause — only DROP POLICY supports IF EXISTS, so guard with
-- a drop-then-create pair to keep the migration re-runnable.
--
-- DROP POLICY IF EXISTS "Admins can read activity log" ON public.activity_log;
-- CREATE POLICY "Admins can read activity log"
-- ON public.activity_log FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
--   )
-- );
