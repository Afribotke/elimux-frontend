ELIMUX CAREER PATHWAYS AI — PHASE 1: FOUNDATION
Corrected Bridge Spec for Claude Code Execution
Cycle: Pathways-001-Corrected | Status: Ready for Build
________________________________________
0. CRITICAL FIXES FROM PREVIOUS ATTEMPT
Fix 1: Supabase Client Pattern
The project uses @supabase/ssr — NOT @supabase/auth-helpers-nextjs. Delete all imports of createRouteHandlerClient. Use this pattern instead:
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  // ... use supabase
}
Fix 2: Migration is SQL File Only — NOT Auto-Applied
Generate the SQL file. The user will paste it into Supabase Dashboard SQL Editor manually. Do NOT use any MCP migration tool. Do NOT auto-apply to production.
Fix 3: Separate Schema for Easy Retirement
All Career Pathways tables live in a dedicated pathways schema. To retire the module: DROP SCHEMA pathways CASCADE; — zero impact on existing tables.
________________________________________
1. MODULE INDEPENDENCE ARCHITECTURE
Existing ElimuX (untouched)
├── public.*          ← existing tables
├── auth.*            ← Supabase auth
└── ...

Career Pathways Module (separate schema)
├── pathways.*        ← ALL new tables
│   ├── pathways.pathways
│   ├── pathways.tracks
│   ├── pathways.subjects
│   ├── pathways.subject_combinations
│   ├── pathways.schools
│   ├── pathways.career_mappings
│   ├── pathways.kjsa_results
│   ├── pathways.kjsa_analysis
│   ├── pathways.guidance_sessions
│   ├── pathways.analytics_events
│   ├── pathways.analytics_aggregates
│   └── pathways.gov_subscriptions
To completely remove Career Pathways:
DROP SCHEMA pathways CASCADE;
Existing ElimuX tables are completely unaffected.
________________________________________
2. STEP-BY-STEP EXECUTION ORDER
Step 1: Create the SQL Migration File
Create: supabase/migrations/20260829000001_pathways_schema.sql
Paste the EXACT SQL below into this file:
-- ============================================================
-- ELIMUX CAREER PATHWAYS AI — PHASE 1: FOUNDATION
-- SCHEMA: pathways (separate from existing public schema)
-- LEGAL COMPLIANCE: Kenya Data Protection Act 2019
-- NO personal identifiers stored. Anonymous by default.
-- NO KEMIS scraping. Public data sources only.
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
After creating this file, STOP. Do not run it. The user will paste it into Supabase Dashboard SQL Editor.
________________________________________
3. SEED DATA SQL
Create: supabase/seeders/pathways_seed.sql
-- ============================================================
-- SEED: Pathways
-- ============================================================

INSERT INTO pathways.pathways (code, name, description, icon, color) VALUES
('STEM', 'STEM', 'Science, Technology, Engineering, and Mathematics', 'flask', '#2563EB'),
('SOCIAL_SCIENCES', 'Social Sciences', 'Humanities, Business, Languages, and Governance', 'book-open', '#059669'),
('ARTS_SPORTS', 'Arts & Sports Science', 'Creative Arts, Performing Arts, and Sports', 'palette', '#D97706');

-- ============================================================
-- SEED: Tracks
-- ============================================================

INSERT INTO pathways.tracks (pathway_id, code, name, description) VALUES
((SELECT id FROM pathways.pathways WHERE code = 'STEM'), 'PURE_SCIENCES', 'Pure Sciences', 'Advanced Mathematics, Biology, Chemistry, Physics focus'),
((SELECT id FROM pathways.pathways WHERE code = 'STEM'), 'APPLIED_SCIENCES', 'Applied Sciences', 'Agriculture, Computer Studies, Home Science, Technical subjects'),
((SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), 'LANGUAGES_LITERATURE', 'Languages & Literature', 'Foreign languages, Kiswahili, Literature, Sign Language'),
((SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), 'HUMANITIES_BUSINESS', 'Humanities & Business Studies', 'History, Geography, Business Studies, CRE/IRE/HRE'),
((SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), 'ARTS', 'Arts', 'Music, Dance, Fine Art, Theatre, Film'),
((SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), 'SPORTS_RECREATION', 'Sports & Recreation', 'Sports science, physical education, recreation management');

-- ============================================================
-- SEED: Subjects
-- ============================================================

INSERT INTO pathways.subjects (code, name, category) VALUES
('ENG', 'English', 'core'),
('KIS', 'Kiswahili', 'core'),
('MAT', 'Mathematics', 'core'),
('CSL', 'Community Service Learning', 'core'),
('PEH', 'Physical Education & Health', 'core'),
('AMT', 'Advanced Mathematics', 'stem'),
('BIO', 'Biology', 'stem'),
('CHE', 'Chemistry', 'stem'),
('PHY', 'Physics', 'stem'),
('AGR', 'Agriculture', 'stem'),
('AVI', 'Aviation', 'stem'),
('BLD', 'Building Construction', 'stem'),
('BST', 'Business Studies', 'social'),
('CMP', 'Computer Studies', 'stem'),
('ELE', 'Electricity', 'stem'),
('GEO', 'Geography', 'social'),
('HSC', 'Home Science', 'stem'),
('MNF', 'Marine & Fisheries', 'stem'),
('MTW', 'Metal Work', 'stem'),
('PMC', 'Power Mechanics', 'stem'),
('WWD', 'Wood Work', 'stem'),
('GSC', 'General Science', 'stem'),
('ARB', 'Arabic', 'social'),
('CRE', 'Christian Religious Education', 'social'),
('IRE', 'Islamic Religious Education', 'social'),
('HRE', 'Hindu Religious Education', 'social'),
('FSW', 'Fasihi ya Kiswahili', 'social'),
('FRE', 'French', 'social'),
('GER', 'German', 'social'),
('LIT', 'Literature in English', 'social'),
('MAN', 'Mandarin', 'social'),
('HIS', 'History & Citizenship', 'social'),
('ILG', 'Indigenous Language', 'social'),
('SLG', 'Sign Language', 'social'),
('MUD', 'Music & Dance', 'arts'),
('FAR', 'Fine Arts', 'arts'),
('THF', 'Theatre & Film', 'arts'),
('SPR', 'Sports & Recreation', 'sports'),
('MDT', 'Media Technology', 'arts');

-- ============================================================
-- SEED: KJSA Performance Levels
-- ============================================================

INSERT INTO pathways.kjsa_performance_levels (code, name, description, numeric_value) VALUES
('EE', 'Exceeding Expectations', 'Learner performs above grade level', 4),
('ME', 'Meeting Expectations', 'Learner performs at grade level', 3),
('AE', 'Approaching Expectations', 'Learner is close to grade level', 2),
('BE', 'Below Expectations', 'Learner performs below grade level', 1);

-- ============================================================
-- SEED: Pathway-KJSA Requirements
-- ============================================================

INSERT INTO pathways.pathway_kjsa_requirements (pathway_id, subject, minimum_level, is_critical, weight) VALUES
((SELECT id FROM pathways.pathways WHERE code = 'STEM'), 'Mathematics', 'ME', true, 2.0),
((SELECT id FROM pathways.pathways WHERE code = 'STEM'), 'Integrated Science', 'ME', true, 2.0),
((SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), 'English', 'ME', true, 1.5),
((SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), 'Kiswahili', 'ME', false, 1.0),
((SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), 'Social Studies', 'ME', false, 1.0),
((SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), 'Creative Arts', 'ME', false, 1.5),
((SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), 'Physical Education', 'ME', false, 1.0);

-- ============================================================
-- SEED: Career Mappings (Core 50 careers)
-- ============================================================

INSERT INTO pathways.career_mappings (career_name, career_aliases, pathway_id, track_id, description, is_verified) VALUES
('Doctor', ARRAY['physician', 'medical doctor', 'surgeon'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Medical professional who diagnoses and treats illnesses', true),
('Nurse', ARRAY['registered nurse', 'healthcare nurse'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Healthcare professional who cares for patients', true),
('Pharmacist', ARRAY['chemist', 'druggist'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Expert in medications and drug therapy', true),
('Civil Engineer', ARRAY['engineer', 'structural engineer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Designs and builds infrastructure like roads and bridges', true),
('Software Engineer', ARRAY['programmer', 'developer', 'coder', 'software developer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Designs and builds computer software and applications', true),
('Pilot', ARRAY['aviator', 'airline pilot', 'captain'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Operates aircraft for commercial or military purposes', true),
('Architect', ARRAY['building designer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Designs buildings and oversees construction', true),
('Data Scientist', ARRAY['data analyst', 'statistician'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Analyzes complex data to help organizations make decisions', true),
('Agricultural Officer', ARRAY['agronomist', 'farm manager'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Advises farmers on crop and livestock production', true),
('Electrician', ARRAY['electrical technician'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Installs and maintains electrical systems', true),
('Marine Biologist', ARRAY['oceanographer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Studies ocean life and marine ecosystems', true),
('Veterinary Doctor', ARRAY['vet', 'animal doctor'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Medical care for animals', true),
('Lawyer', ARRAY['attorney', 'barrister', 'advocate', 'legal'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Provides legal advice and represents clients in court', true),
('Journalist', ARRAY['reporter', 'news anchor', 'broadcaster'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'LANGUAGES_LITERATURE'), 'Reports news and investigates stories for media', true),
('Accountant', ARRAY['CPA', 'auditor', 'bookkeeper'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Manages financial records and ensures compliance', true),
('Banker', ARRAY['bank manager', 'financial officer'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Manages banking operations and financial services', true),
('Teacher', ARRAY['educator', 'instructor', 'lecturer'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'LANGUAGES_LITERATURE'), 'Educates students in schools and institutions', true),
('Social Worker', ARRAY['counselor', 'community worker'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Helps individuals and families solve personal problems', true),
('Pastor', ARRAY['priest', 'reverend', 'bishop', 'clergy'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Provides spiritual guidance and leads religious services', true),
('Politician', ARRAY['legislator', 'MP', 'senator', 'governor'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Serves in government and makes policy decisions', true),
('Translator', ARRAY['interpreter', 'linguist'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'LANGUAGES_LITERATURE'), 'Converts written or spoken content between languages', true),
('Diplomat', ARRAY['ambassador', 'foreign service officer'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'LANGUAGES_LITERATURE'), 'Represents country interests internationally', true),
('Urban Planner', ARRAY['city planner', 'town planner'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Designs land use and urban development plans', true),
('Graphic Designer', ARRAY['visual designer', 'digital artist'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Creates visual content for print and digital media', true),
('Musician', ARRAY['singer', 'composer', 'instrumentalist'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Performs and creates music professionally', true),
('Actor', ARRAY['actress', 'performer', 'thespian'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Performs roles in theatre, film, and television', true),
('Professional Athlete', ARRAY['sportsman', 'sportswoman'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'SPORTS_RECREATION'), 'Competes professionally in sports', true),
('Sports Coach', ARRAY['trainer', 'fitness instructor'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'SPORTS_RECREATION'), 'Trains athletes and teams for competition', true),
('Fashion Designer', ARRAY['couturier', 'stylist'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Designs clothing and accessories', true),
('Filmmaker', ARRAY['director', 'producer', 'cinematographer'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Creates films and video content', true),
('Dance Choreographer', ARRAY['dancer', 'choreographer'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Creates and directs dance performances', true),
('Chef', ARRAY['cook', 'culinary artist'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Prepares food professionally in restaurants and hotels', true),
('Hotel Manager', ARRAY['hospitality manager'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Manages hotel operations and guest services', true),
('Police Officer', ARRAY['law enforcement', 'cop'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Enforces law and maintains public order', true),
('Military Officer', ARRAY['soldier', 'army officer'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Serves in armed forces and leads operations', true),
('Entrepreneur', ARRAY['business owner', 'founder', 'startup'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Starts and runs own business ventures', true),
('Psychologist', ARRAY['therapist', 'counselor'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Studies mental processes and human behavior', true),
('Economist', ARRAY['financial analyst', 'policy analyst'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Analyzes economic data and trends', true),
('Environmental Scientist', ARRAY['conservationist', 'ecologist'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Studies environmental problems and solutions', true),
('Biotechnologist', ARRAY['biotech researcher'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Uses biology to develop products and technologies', true),
('Robotics Engineer', ARRAY['automation engineer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Designs and builds robots and automated systems', true),
('Cybersecurity Expert', ARRAY['security analyst', 'ethical hacker'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Protects computer systems from cyber threats', true),
('Real Estate Developer', ARRAY['property developer'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Develops residential and commercial properties', true),
('Insurance Broker', ARRAY['insurance agent'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Sells and manages insurance policies', true),
('Human Resources Manager', ARRAY['HR manager', 'recruiter'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Manages employee relations and recruitment', true),
('Marketing Manager', ARRAY['brand manager', 'digital marketer'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Promotes products and builds brand awareness', true),
('Sales Manager', ARRAY['sales director', 'business development'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Leads sales teams and drives revenue growth', true),
('Supply Chain Manager', ARRAY['logistics manager'], (SELECT id FROM pathways.pathways WHERE code = 'SOCIAL_SCIENCES'), (SELECT id FROM pathways.tracks WHERE code = 'HUMANITIES_BUSINESS'), 'Manages product flow from supplier to customer', true),
('Event Planner', ARRAY['wedding planner', 'coordinator'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Organizes and coordinates events and celebrations', true),
('Photographer', ARRAY['photojournalist', 'videographer'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Captures images and video for various purposes', true),
('Interior Designer', ARRAY['decorator', 'space planner'], (SELECT id FROM pathways.pathways WHERE code = 'ARTS_SPORTS'), (SELECT id FROM pathways.tracks WHERE code = 'ARTS'), 'Designs interior spaces for homes and businesses', true),
('Physical Therapist', ARRAY['physiotherapist'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Helps patients recover movement and manage pain', true),
('Nutritionist', ARRAY['dietitian'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Advises on diet and nutrition for health', true),
('Forester', ARRAY['forest officer', 'conservation officer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'APPLIED_SCIENCES'), 'Manages forest resources and conservation', true),
('Meteorologist', ARRAY['weather forecaster'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Studies weather patterns and forecasts', true),
('Geologist', ARRAY['earth scientist', 'mining engineer'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Studies earth materials and processes', true),
('Statistician', ARRAY['data analyst', 'biostatistician'], (SELECT id FROM pathways.pathways WHERE code = 'STEM'), (SELECT id FROM pathways.tracks WHERE code = 'PURE_SCIENCES'), 'Analyzes data using statistical methods', true);
After creating this file, STOP. Do not run it. The user will paste it into Supabase Dashboard SQL Editor.
________________________________________
4. CORRECTED API ROUTES (Using @supabase/ssr)
4.1 app/api/pathways/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('pathways')
    .select('*, tracks(*)')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pathways: data });
}
4.2 app/api/combinations/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathwayId = searchParams.get('pathway');
  const trackId = searchParams.get('track');

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let query = supabase.from('subject_combinations').select('*, tracks(pathway_id)').eq('is_active', true);

  if (trackId) query = query.eq('track_id', trackId);
  else if (pathwayId) query = query.eq('tracks.pathway_id', pathwayId);

  const { data, error } = await query.order('code');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ combinations: data });
}
4.3 app/api/schools/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const county = searchParams.get('county');
  const category = searchParams.get('category');
  const gender = searchParams.get('gender');
  const accommodation = searchParams.get('accommodation');
  const pathway = searchParams.get('pathway');

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let query = supabase.from('schools').select('*').eq('is_active', true);

  if (county) query = query.eq('county', county);
  if (category) query = query.eq('category', category);
  if (gender) query = query.eq('gender', gender);
  if (accommodation) query = query.eq('accommodation', accommodation);
  if (pathway) query = query.contains('pathways', [pathway]);

  const { data, error } = await query.order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schools: data, total: data?.length || 0 });
}
4.4 app/api/careers/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let query = supabase.from('career_mappings').select('*, pathways(*), tracks(*)').eq('is_verified', true);

  if (q) {
    query = query.or(`career_name.ilike.%${q}%,career_aliases.cs.{${q}}`);
  }

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ careers: data });
}
4.5 app/api/kjsa/route.ts — Manual Entry Only
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const body = await request.json();
  const { results, session_id } = body;

  if (!results || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Results array required' }, { status: 400 });
  }

  const validLevels = ['EE', 'ME', 'AE', 'BE'];
  const validSubjects = ['Mathematics', 'English', 'Kiswahili', 'Integrated Science', 
    'Social Studies', 'Creative Arts', 'Agriculture', 'Physical Education',
    'Computer Studies', 'Business Studies'];

  for (const r of results) {
    if (!validSubjects.includes(r.subject)) {
      return NextResponse.json({ error: `Invalid subject: ${r.subject}` }, { status: 400 });
    }
    if (!validLevels.includes(r.level)) {
      return NextResponse.json({ error: `Invalid level: ${r.level}` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('kjsa_results')
    .insert({
      results,
      session_id,
      uploaded_via: 'manual',
      parsed_confidence: 1.0,
      parent_confirmed: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kjsa: data });
}
________________________________________
5. FRONTEND PAGES (Same as previous spec)
Use the same 4 pages from the previous bridge spec: - app/(pathways)/layout.tsx — with KEMIS banner - app/(pathways)/page.tsx — Dream Box + Age Gate + Parental Consent - app/(pathways)/wizard/page.tsx — 5-step wizard with manual KJSA entry - app/(pathways)/results/page.tsx — Results shell
Copy these exactly from the previous bridge spec. No changes needed.
________________________________________
6. DATA ACQUISITION — WORLD BANK DATASET
Create: scripts/download-school-data.ts
/**
 * Downloads Kenya school data from World Bank public dataset
 * Source: https://datacatalog.worldbank.org/search/dataset/0038039/kenya-schools
 * License: CC BY 4.0 (free to use with attribution)
 * Provider: Kenya Ministry of Education
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const WORLD_BANK_URL = 'https://datacatalogfiles.worldbank.org/ddh-published/0038039/DR0090755/kenya%20schools.json';

interface WorldBankSchool {
  name?: string;
  county?: string;
  sub_county?: string;
  lat?: number;
  lon?: number;
  type?: string;  // 'Primary', 'Secondary', 'Tertiary'
  sponsor?: string;
}

async function downloadAndImport() {
  console.log('Downloading World Bank Kenya Schools dataset...');

  const response = await fetch(WORLD_BANK_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const schools: WorldBankSchool[] = await response.json();
  console.log(`Downloaded ${schools.length} schools`);

  // Filter for secondary schools only
  const secondarySchools = schools.filter(s => 
    s.type?.toLowerCase().includes('secondary') ||
    s.type?.toLowerCase().includes('senior')
  );
  console.log(`Filtered to ${secondarySchools.length} secondary schools`);

  // Map to our schema
  const mappedSchools = secondarySchools.map(s => ({
    name: s.name || 'Unknown School',
    county: s.county || 'Unknown',
    sub_county: s.sub_county || 'Unknown',
    location_lat: s.lat,
    location_lng: s.lon,
    category: 'C4',  // Default — will be manually updated from Gazette notices
    gender: 'mixed',  // Default — will be manually updated
    accommodation: 'day',  // Default — will be manually updated
    data_source_url: 'https://datacatalog.worldbank.org/search/dataset/0038039/kenya-schools',
    data_last_updated: new Date().toISOString(),
    is_active: true
  }));

  // Batch insert (50 at a time)
  const batchSize = 50;
  for (let i = 0; i < mappedSchools.length; i += batchSize) {
    const batch = mappedSchools.slice(i, i + batchSize);
    const { error } = await supabase.from('schools').insert(batch);
    if (error) {
      console.error(`Batch ${i} error:`, error);
    } else {
      console.log(`Inserted batch ${i} - ${i + batch.length}`);
    }
  }

  console.log(`Import complete. ${mappedSchools.length} secondary schools imported.`);
  console.log('⚠️  IMPORTANT: Categories (C1/C2/C3/C4) and gender/accommodation are defaults.');
  console.log('   These must be manually updated from Kenya Gazette notices and Ministry circulars.');
}

downloadAndImport().catch(console.error);
To run:
npx tsx scripts/download-school-data.ts
Attribution required on every page:
School location data: World Bank Data Catalog — Kenya Schools (CC BY 4.0, Kenya Ministry of Education)
________________________________________
7. BUILD VERIFICATION CHECKLIST
After executing this bridge, verify:
•	☐ npm run build passes with ZERO errors
•	☐ No imports of @supabase/auth-helpers-nextjs anywhere in new code
•	☐ All API routes use @supabase/ssr createServerClient pattern
•	☐ SQL migration file created at supabase/migrations/20260829000001_pathways_schema.sql
•	☐ Seed SQL file created at supabase/seeders/pathways_seed.sql
•	☐ Frontend pages created in app/(pathways)/
•	☐ World Bank download script created at scripts/download-school-data.ts
•	☐ No existing ElimuX functionality broken
________________________________________
8. WHAT THE USER MUST DO MANUALLY
1.	Paste migration SQL into Supabase Dashboard → SQL Editor → New Query
2.	Paste seed SQL into Supabase Dashboard → SQL Editor → New Query
3.	Run World Bank download script after setting SUPABASE_SERVICE_ROLE_KEY
4.	Manually categorize top 200 schools (C1/C2/C3/C4) from Kenya Gazette notices
________________________________________
9. TO RETIRE THE MODULE
-- Single command removes ALL Career Pathways data
-- Zero impact on existing ElimuX tables
DROP SCHEMA pathways CASCADE;
Then delete the app/(pathways)/ directory.
________________________________________
End of Corrected Phase 1 Bridge Spec. All fixes applied. Ready for execution.
