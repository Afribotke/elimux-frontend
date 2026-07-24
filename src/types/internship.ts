export interface Employer {
  id: string;
  company_name: string;
  company_email: string;
  company_phone?: string;
  registration_number?: string;
  industry: string;
  company_size?: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
  location_county?: string;
  is_verified: boolean;
  verification_status: string;
  average_rating: number;
  review_count: number;
  is_active: boolean;
}

export interface Internship {
  id: string;
  employer_id: string;
  employer?: Employer;
  title: string;
  description: string;
  requirements?: string;
  profession_category: string;
  course_tags?: string[];
  location_county?: string;
  is_remote: boolean;
  is_hybrid: boolean;
  duration_weeks: number;
  total_slots: number;
  remaining_slots: number;
  is_paid: boolean;
  stipend_amount_min?: number;
  stipend_amount_max?: number;
  currency: string;
  min_year_of_study: number;
  application_deadline: string;
  start_date?: string;
  end_date?: string;
  status: string;
  is_featured: boolean;
  requires_cover_letter: boolean;
  requires_portfolio: boolean;
  requires_video_intro: boolean;
  application_form_questions?: any[];
  nita_registered: boolean;
  match_score?: number;
  created_at: string;
}

export interface Application {
  id: string;
  student_id: string;
  internship_id: string;
  internship?: Internship;
  cover_letter?: string;
  portfolio_links?: string[];
  video_intro_url?: string;
  answers?: Record<string, string>;
  status: string;
  employer_notes?: string;
  interview_date?: string;
  interview_location?: string;
  interview_link?: string;
  submitted_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  registration_number?: string;
  university_name?: string;
  course_name?: string;
  course_category?: string;
  year_of_study: number;
  preferred_locations?: string[];
  preferred_industries?: string[];
  skills?: string[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  resume_url?: string;
  is_university_verified: boolean;
  is_open_to_remote: boolean;
  is_open_to_relocation: boolean;
  nita_number?: string;
}

export interface LogbookEntry {
  id: string;
  student_id: string;
  internship_id?: string;
  entry_date: string;
  week_number?: number;
  tasks_completed: string;
  skills_learned?: string;
  challenges_faced?: string;
  supervisor_feedback?: string;
  supervisor_name?: string;
  hours_worked?: number;
  is_approved: boolean;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  student_id: string;
  internship_id?: string;
  employer_id?: string;
  issue_date: string;
  completion_date?: string;
  hours_completed: number;
  certificate_type: string;
  is_verified: boolean;
  verified_by?: string;
  pdf_url?: string;
}

export interface GamificationAction {
  id: string;
  action_key: string;
  action_name: string;
  points: number;
  daily_limit?: number;
}

export interface StudentLevel {
  id: string;
  level_number: number;
  level_name: string;
  min_points: number;
  max_points: number;
  badge_url?: string;
  benefits: string[];
}
