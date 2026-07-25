export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'student' | 'admin' | 'partner' | 'sponsor';
  created_at: string;
}

export interface Institution {
  id: string;
  name: string;
  country: string;
  city: string;
  website?: string;
  logo_url?: string;
  type: string;
  accreditation?: string;
  rating: number;
  description?: string;
  established_year?: number;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  institution_id: string;
  institution?: Institution;
  level: string;
  duration: string;
  tuition_fees: number;
  currency: string;
  tags: string[];
  intake_dates?: string[];
  requirements?: string[];
  created_at: string;
}

export interface Review {
  id: string;
  program_id: string;
  user_id: string;
  user?: User;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  program_id: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paystack' | 'mpesa';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_ref?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Ad {
  id: string;
  sponsor_id: string;
  title: string;
  content: string;
  image_url?: string;
  link_url: string;
  placement: 'homepage' | 'search' | 'sidebar' | 'banner';
  start_date: string;
  end_date: string;
  status: 'active' | 'paused' | 'ended';
  impressions: number;
  clicks: number;
  created_at: string;
}

export interface Partner {
  id: string;
  user_id: string;
  commission_rate: number;
  total_earnings: number;
  referral_code: string;
  referrals_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface SearchFilters {
  country?: string;
  level?: string;
  field?: string;
  minTuition?: number;
  maxTuition?: number;
  duration?: string;
}

export interface AISearchResult {
  answer: string;
  programs: Program[];
  institutions: Institution[];
  confidence: number;
}
