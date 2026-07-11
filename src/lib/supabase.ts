import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

export type Tables = {
  countries: {
    id: string
    name: string
    iso_code: string
    flag_emoji: string | null
    currency: string | null
    is_active: boolean
    created_at: string
  }
  institution_types: {
    id: string
    name: string
    description: string | null
    icon: string | null
    is_active: boolean
    created_at: string
  }
  program_categories: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string | null
    is_active: boolean
    created_at: string
  }
  institutions: {
    id: string
    name: string
    slug: string | null
    type_id: string | null
    country_id: string | null
    city: string | null
    website_url: string | null
    email: string | null
    phone: string | null
    description: string | null
    logo_url: string | null
    cover_image_url: string | null
    latitude: number | null
    longitude: number | null
    is_verified: boolean
    is_active: boolean
    is_featured: boolean
    featured_until: string | null
    founded_year: number | null
    student_count: number | null
    created_at: string
    updated_at: string
  }
  programs: {
    id: string
    name: string
    slug: string | null
    institution_id: string | null
    category_id: string | null
    description: string | null
    duration_months: number | null
    tuition_fees: number | null
    currency: string | null
    level: string | null
    mode: string | null
    requirements: string | null
    career_outcomes: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
}
