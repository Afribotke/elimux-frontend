// ============================================================
// ELIMUX EMPLOYER PORTAL TYPES
// ============================================================

export type EmployerRole = 'super_admin' | 'admin' | 'manager' | 'supervisor' | 'viewer';

export type RequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'filled'
  | 'closed'
  | 'rejected';

export type LocationType = 'on_site' | 'remote' | 'hybrid';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface EmployerProfile {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  company_size?: string;
  nita_employer_number?: string;
  year_established?: number;
  registration_number?: string;
  tax_pin?: string;
  county?: string;
  town?: string;
  is_verified: boolean;
  verification_status: VerificationStatus;
  admin_user_id?: string;
  branding_primary_color?: string;
  branding_logo_url?: string;
  subscription_tier: string;
  max_departments: number;
  max_team_members: number;
  max_active_interns: number;
  created_at: string;
  updated_at: string;
}

export interface EmployerDepartment {
  id: string;
  employer_id: string;
  name: string;
  description?: string;
  head_name?: string;
  head_email?: string;
  head_phone?: string;
  max_interns: number;
  created_at: string;
  updated_at: string;
}

export interface EmployerTeamMember {
  id: string;
  employer_id: string;
  user_id: string;
  role: EmployerRole;
  department_id?: string;
  is_active: boolean;
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  department_name?: string;
}

export interface InternshipRequisition {
  id: string;
  employer_id: string;
  department_id?: string;
  requested_by: string;
  title: string;
  description: string;
  requirements: string[];
  skills_required: string[];
  duration_months: number;
  number_of_slots: number;
  stipend_amount?: number;
  stipend_currency: string;
  location_type: LocationType;
  location_city?: string;
  start_date?: string;
  status: RequisitionStatus;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  filled_at?: string;
  created_at: string;
  updated_at: string;
  department_name?: string;
  requested_by_name?: string;
  approved_by_name?: string;
}

export interface DashboardStats {
  totalActiveInterns: number;
  openPositions: number;
  pendingRequisitions: number;
  totalTrainees: number;
  approvedRequisitions: number;
  filledPositions: number;
  departmentBreakdown: {
    department_name: string;
    count: number;
  }[];
}

export interface RequisitionFormData {
  title: string;
  description: string;
  requirements: string[];
  skills_required: string[];
  duration_months: number;
  number_of_slots: number;
  stipend_amount?: number;
  stipend_currency: string;
  location_type: LocationType;
  location_city?: string;
  start_date?: string;
  department_id?: string;
}
