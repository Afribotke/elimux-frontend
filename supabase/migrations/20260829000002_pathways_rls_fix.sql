-- ============================================================
-- ELIMUX CAREER PATHWAYS AI — FIX: missing RLS policies
--
-- pathways.pathway_kjsa_requirements and pathways.kjsa_performance_levels
-- were left out of the original migration's RLS policy section (both
-- tables). Whoever applied 20260829000001 to the live database enabled
-- RLS on every table in the schema (confirmed via pg_class.relrowsecurity),
-- including these two - but no SELECT policy was ever added for them.
-- With RLS on and zero policies, Postgres denies all access to anon/
-- authenticated by default, so PostgREST silently returns empty results
-- for these two tables even though their seeded rows exist. Verified via
-- a service-role query: pathway_kjsa_requirements has all 7 seeded rows,
-- but the API sees none of them - this is what broke
-- /api/kjsa/analyze's pathway-fit scoring (every pathway showed 0%).
--
-- DO NOT RUN THIS AUTOMATICALLY. Paste into Supabase Dashboard
-- -> SQL Editor -> New Query and run manually, same as the other
-- pathways migrations.
-- ============================================================

CREATE POLICY "Public read kjsa performance levels" ON pathways.kjsa_performance_levels FOR SELECT USING (true);
CREATE POLICY "Public read pathway kjsa requirements" ON pathways.pathway_kjsa_requirements FOR SELECT USING (true);
