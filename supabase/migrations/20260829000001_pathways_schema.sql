-- ============================================================
-- ELIMUX CAREER PATHWAYS AI — PHASE 1: FOUNDATION
-- SCHEMA: pathways (separate from existing public schema)
-- LEGAL COMPLIANCE: Kenya Data Protection Act 2019
-- NO personal identifiers stored. Anonymous by default.
-- NO KEMIS scraping. Public data sources only.
--
-- DO NOT RUN THIS AUTOMATICALLY. Paste into Supabase Dashboard
-- -> SQL Editor -> New Query and run manually.
-- ============================================================

-- Create dedicated schema for Career Pathways module
CREATE SCHEMA IF NOT EXISTS pathways;

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2.1 REFERENCE TABLES
-- ============================================================

CREATE TABLE pathways.pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pathways.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID REFERENCES pathways.pathways(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  UNIQUE(pathway_id, code)
);

CREATE TABLE pathways.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('core', 'stem', 'social', 'arts', 'sports', 'sne'))
);

CREATE TABLE pathways.kjsa_performance_levels (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  numeric_value INTEGER CHECK (numeric_value BETWEEN 1 AND 4)
);

-- ============================================================
-- 2.2 SUBJECT COMBINATIONS
-- ============================================================

CREATE TABLE pathways.subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES pathways.tracks(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  subjects UUID[] NOT NULL,
  career_tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.3 SCHOOLS (Manual entry from public sources — NO scraping)
-- ============================================================

CREATE TABLE pathways.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(2) NOT NULL CHECK (category IN ('C1','C2','C3','C4')),
  county VARCHAR(50) NOT NULL,
  sub_county VARCHAR(100) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('boys','girls','mixed')),
  accommodation VARCHAR(20) CHECK (accommodation IN ('boarding','day','boarding_and_day')),
  is_private BOOLEAN DEFAULT false,
  pathways UUID[],
  combinations UUID[],
  sne_has_support BOOLEAN DEFAULT false,
  sne_type VARCHAR(20) CHECK (sne_type IN ('pure_sne','integrated','none')),
  sne_impairments TEXT[],
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  data_source_url TEXT,
  data_last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.4 CAREER MAPPINGS
-- ============================================================

CREATE TABLE pathways.career_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_name VARCHAR(100) NOT NULL,
  career_aliases TEXT[],
  pathway_id UUID REFERENCES pathways.pathways(id),
  track_id UUID REFERENCES pathways.tracks(id),
  recommended_combinations UUID[],
  description TEXT,
  required_kjsa_subjects TEXT[],
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.5 KJSA TABLES (ANONYMOUS — NO personal identifiers)
-- ============================================================

CREATE TABLE pathways.kjsa_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID,
  results JSONB NOT NULL DEFAULT '[]',
  uploaded_via VARCHAR(20) CHECK (uploaded_via IN ('manual')) DEFAULT 'manual',
  parsed_confidence DECIMAL(3,2) DEFAULT 1.0,
  parent_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  deleted_by_user_at TIMESTAMPTZ
);

CREATE TABLE pathways.pathway_kjsa_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID REFERENCES pathways.pathways(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  minimum_level VARCHAR(2) REFERENCES pathways.kjsa_performance_levels(code),
  is_critical BOOLEAN DEFAULT false,
  weight DECIMAL(3,2) DEFAULT 1.0,
  UNIQUE(pathway_id, subject)
);

CREATE TABLE pathways.kjsa_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kjsa_result_id UUID REFERENCES pathways.kjsa_results(id) ON DELETE CASCADE,
  pathway_id UUID REFERENCES pathways.pathways(id),
  eligible BOOLEAN,
  confidence VARCHAR(10),
  reasoning TEXT,
  strongest_subjects JSONB,
  weakest_subjects JSONB,
  recommended_combinations UUID[],
  alternative_pathways UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.6 GUIDANCE SESSIONS
-- ============================================================

CREATE TABLE pathways.guidance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  learner_name VARCHAR(100),
  learner_grade VARCHAR(10),
  current_school VARCHAR(200),
  home_county VARCHAR(50),
  home_sub_county VARCHAR(100),
  career_goal VARCHAR(100),
  kjsa_result_id UUID REFERENCES pathways.kjsa_results(id) ON DELETE SET NULL,
  recommended_pathway_id UUID REFERENCES pathways.pathways(id),
  recommended_track_id UUID REFERENCES pathways.tracks(id),
  combination_1st UUID REFERENCES pathways.subject_combinations(id),
  combination_2nd UUID REFERENCES pathways.subject_combinations(id),
  combination_3rd UUID REFERENCES pathways.subject_combinations(id),
  selected_schools UUID[],
  is_sne BOOLEAN DEFAULT false,
  sne_impairment VARCHAR(50),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.7 ANALYTICS TABLES (Privacy-first, aggregates only)
-- ============================================================

CREATE TABLE pathways.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  session_id UUID,
  user_id UUID REFERENCES auth.users(id),
  county VARCHAR(50),
  gender_filter VARCHAR(10),
  career_goal VARCHAR(100),
  pathway_id UUID REFERENCES pathways.pathways(id),
  track_id UUID REFERENCES pathways.tracks(id),
  combination_id UUID REFERENCES pathways.subject_combinations(id),
  school_category VARCHAR(2),
  device_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pathways.analytics_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  county VARCHAR(50),
  pathway_id UUID REFERENCES pathways.pathways(id),
  total_sessions INTEGER DEFAULT 0,
  unique_learners INTEGER DEFAULT 0,
  career_searches INTEGER DEFAULT 0,
  pathway_selections INTEGER DEFAULT 0,
  combination_views INTEGER DEFAULT 0,
  school_views INTEGER DEFAULT 0,
  pdf_downloads INTEGER DEFAULT 0,
  kjsa_uploads INTEGER DEFAULT 0,
  male_sessions INTEGER DEFAULT 0,
  female_sessions INTEGER DEFAULT 0,
  mixed_sessions INTEGER DEFAULT 0,
  sne_sessions INTEGER DEFAULT 0,
  mobile_sessions INTEGER DEFAULT 0,
  desktop_sessions INTEGER DEFAULT 0,
  top_careers JSONB,
  top_counties JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_type, period_start, county, pathway_id)
);

CREATE TABLE pathways.gov_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(200) NOT NULL,
  organization_type VARCHAR(50) NOT NULL,
  contact_email VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20),
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('public', 'county', 'national', 'enterprise')),
  county_access TEXT[],
  amount_kes INTEGER,
  payment_status VARCHAR(20) DEFAULT 'pending',
  subscription_start DATE,
  subscription_end DATE,
  api_key VARCHAR(100),
  api_rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.8 INDEXES
-- ============================================================

CREATE INDEX idx_pathways_schools_county ON pathways.schools(county);
CREATE INDEX idx_pathways_schools_category ON pathways.schools(category);
CREATE INDEX idx_pathways_schools_gender ON pathways.schools(gender);
CREATE INDEX idx_pathways_schools_pathways ON pathways.schools USING GIN(pathways);
CREATE INDEX idx_pathways_combinations_track ON pathways.subject_combinations(track_id);
CREATE INDEX idx_pathways_career_name ON pathways.career_mappings(career_name);
CREATE INDEX idx_pathways_guidance_user ON pathways.guidance_sessions(user_id);
CREATE INDEX idx_pathways_kjsa_user ON pathways.kjsa_results(user_id);
CREATE INDEX idx_pathways_kjsa_expires ON pathways.kjsa_results(expires_at);
CREATE INDEX idx_pathways_analytics_events_type ON pathways.analytics_events(event_type);
CREATE INDEX idx_pathways_analytics_events_created ON pathways.analytics_events(created_at);
CREATE INDEX idx_pathways_analytics_events_county ON pathways.analytics_events(county);
CREATE INDEX idx_pathways_aggregates_period ON pathways.analytics_aggregates(period_type, period_start);

-- ============================================================
-- 2.9 RLS POLICIES
-- ============================================================

ALTER TABLE pathways.pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.subject_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.career_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.guidance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.kjsa_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.kjsa_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.analytics_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways.gov_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public read pathways" ON pathways.pathways FOR SELECT USING (true);
CREATE POLICY "Public read tracks" ON pathways.tracks FOR SELECT USING (true);
CREATE POLICY "Public read subjects" ON pathways.subjects FOR SELECT USING (true);
CREATE POLICY "Public read combinations" ON pathways.subject_combinations FOR SELECT USING (true);
CREATE POLICY "Public read schools" ON pathways.schools FOR SELECT USING (true);
CREATE POLICY "Public read careers" ON pathways.career_mappings FOR SELECT USING (true);

-- Users can only see their own sessions and KJSA data
CREATE POLICY "Users own sessions" ON pathways.guidance_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own KJSA" ON pathways.kjsa_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own analysis" ON pathways.kjsa_analysis FOR ALL USING (
  EXISTS (SELECT 1 FROM pathways.kjsa_results kr WHERE kr.id = pathways.kjsa_analysis.kjsa_result_id AND kr.user_id = auth.uid())
);

-- Analytics: service role only for writes, public for aggregate reads
CREATE POLICY "Service write analytics" ON pathways.analytics_events FOR INSERT WITH CHECK (false);
CREATE POLICY "Public read aggregates" ON pathways.analytics_aggregates FOR SELECT USING (true);

-- Subscriptions: admin only
CREATE POLICY "Admin subscriptions" ON pathways.gov_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- ============================================================
-- IMPORTANT — MANUAL STEP AFTER RUNNING THIS MIGRATION:
-- The `pathways` schema must be added to Supabase's exposed schema
-- list (Dashboard -> Project Settings -> API -> Exposed schemas)
-- before PostgREST/the JS client can query it. Without this step,
-- every API route added in this Phase 1 change will fail at runtime
-- with "schema must be one of the following: public, ..." even
-- though the tables exist.
-- ============================================================
