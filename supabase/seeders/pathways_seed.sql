-- ============================================================
-- ELIMUX CAREER PATHWAYS AI — PHASE 1: SEED DATA
-- Run AFTER 20260829000001_pathways_schema.sql has been applied.
-- DO NOT RUN AUTOMATICALLY. Paste into Supabase Dashboard
-- -> SQL Editor -> New Query and run manually.
-- ============================================================

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
