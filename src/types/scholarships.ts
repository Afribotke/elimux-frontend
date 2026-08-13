// ============================================
// ElimuX Scholarship Module - Admin Types (matches LIVE schema)
// ============================================

export type ScholarshipSponsorType =
  | 'government' | 'foundation' | 'university' | 'international'
  | 'embassy' | 'corporate' | 'ngo'

export type ScholarshipSponsorTier = 'free' | 'hub' | 'premium'

export type ApplicationStatus = 'open' | 'closed' | 'upcoming'

export type DurationUnit = 'months' | 'years' | 'one_time'

export type CriteriaType =
  | 'min_gpa' | 'max_gpa' | 'course_field' | 'country' | 'county'
  | 'gender' | 'financial_need' | 'age_min' | 'age_max'
  | 'extracurricular' | 'career_goal' | 'disability' | 'orphan_status'
  | 'work_experience_years' | 'language_proficiency' | 'nationality'
  | 'other'

export interface ScholarshipSponsor {
  id: string
  name: string
  type: ScholarshipSponsorType
  logo_url?: string | null
  website?: string | null
  country_code?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  description?: string | null
  is_verified: boolean
  tier: ScholarshipSponsorTier
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface ScholarshipEligibility {
  id: string
  scholarship_id: string
  criteria_type: CriteriaType
  criteria_value: string
  is_required: boolean
  description?: string | null
  created_at: string
}

export interface ScholarshipDocument {
  id: string
  scholarship_id: string
  document_name: string
  document_description?: string | null
  is_required: boolean
  file_type_hint?: string | null
  max_file_size_mb: number
  created_at: string
}

export interface Scholarship {
  id: string
  title: string
  provider: string
  provider_logo_url?: string | null
  description?: string | null
  eligibility?: string | null
  benefits?: string | null
  amount?: string | null
  currency?: string | null
  coverage_type?: string | null
  institution_id?: string | null
  country_id?: string | null
  study_levels?: string[] | null
  disciplines?: string[] | null
  target_groups?: string[] | null
  application_opens?: string | null
  application_deadline: string
  notification_date?: string | null
  application_url?: string | null
  application_process?: string | null
  required_documents?: string[] | null
  status?: string | null
  is_featured?: boolean | null
  source_url?: string | null
  scraped_at?: string | null
  verified_at?: string | null
  created_at?: string
  updated_at?: string
  provider_id?: string | null
  sponsor_id?: string | null
  funding_amount?: number | null
  duration?: number | null
  duration_unit?: DurationUnit | null
  is_sponsored?: boolean | null
  created_by?: string | null
  application_status?: ApplicationStatus | null
  provider_sponsor?: ScholarshipSponsor | null
  sponsor?: ScholarshipSponsor | null
  eligibility_criteria?: ScholarshipEligibility[]
  documents?: ScholarshipDocument[]
}

export interface ScholarshipFormData {
  title: string
  provider: string
  description?: string
  eligibility?: string
  benefits?: string
  amount?: string
  currency?: string
  coverage_type?: string
  institution_id?: string
  country_id?: string
  study_levels?: string[]
  disciplines?: string[]
  target_groups?: string[]
  application_opens?: string
  application_deadline: string
  notification_date?: string
  application_url?: string
  application_process?: string
  required_documents?: string[]
  status?: string
  is_featured?: boolean
  source_url?: string
  provider_id?: string | null
  sponsor_id?: string | null
  funding_amount?: number | null
  duration?: number | null
  duration_unit?: DurationUnit | null
  is_sponsored?: boolean
  application_status?: ApplicationStatus
  eligibility_criteria: Omit<ScholarshipEligibility, 'id' | 'scholarship_id' | 'created_at'>[]
  documents: Omit<ScholarshipDocument, 'id' | 'scholarship_id' | 'created_at'>[]
}

export interface ScholarshipSponsorFormData {
  name: string
  type: ScholarshipSponsorType
  logo_url?: string
  website?: string
  country_code?: string
  contact_email?: string
  contact_phone?: string
  description?: string
  is_verified?: boolean
  tier?: ScholarshipSponsorTier
}
