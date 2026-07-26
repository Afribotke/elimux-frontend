-- ============================================
-- ElimuX Grade Matcher Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add grade columns to programs table
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS minimum_kcse_grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS minimum_kcse_grade_numeric INTEGER;

-- 2. Create index for fast grade filtering
CREATE INDEX IF NOT EXISTS idx_programs_grade_numeric
ON public.programs(minimum_kcse_grade_numeric);

-- 3. Create careers table (for the dropdown)
CREATE TABLE IF NOT EXISTS public.careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    course_count INTEGER DEFAULT 0,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on careers
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- 5. RLS policy: careers are viewable by everyone
CREATE POLICY IF NOT EXISTS "Careers are viewable by everyone"
ON public.careers FOR SELECT USING (true);

-- 6. Backfill existing programs with default grade
UPDATE public.programs
SET minimum_kcse_grade = 'C-',
    minimum_kcse_grade_numeric = 5
WHERE minimum_kcse_grade IS NULL;

-- 7. Seed sample careers (optional — remove if you already have data)
INSERT INTO public.careers (name, category, course_count, slug, description)
VALUES
  ('Doctor', 'Medicine & Health', 1240, 'doctor', 'Medical practitioner career path'),
  ('Software Engineer', 'Technology', 2890, 'software-engineer', 'Build software and applications'),
  ('Lawyer', 'Law', 856, 'lawyer', 'Legal practice and advocacy'),
  ('Entrepreneur', 'Business', 1102, 'entrepreneur', 'Start and manage businesses'),
  ('Civil Engineer', 'Engineering', 634, 'civil-engineer', 'Design infrastructure and buildings'),
  ('Teacher', 'Education', 1567, 'teacher', 'Educate and mentor students'),
  ('Nurse', 'Medicine & Health', 982, 'nurse', 'Patient care and health support'),
  ('Graphic Designer', 'Arts & Design', 743, 'graphic-designer', 'Visual communication and design')
ON CONFLICT (slug) DO NOTHING;

-- 8. Comments for documentation
COMMENT ON COLUMN public.programs.minimum_kcse_grade IS 'Minimum KCSE grade required (e.g., C-, D+, A)';
COMMENT ON COLUMN public.programs.minimum_kcse_grade_numeric IS 'Numeric equivalent: A=12, A-=11, B+=10, B=9, B-=8, C+=7, C=6, C-=5, D+=4, D=3, D-=2, E=1';
