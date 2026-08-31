export interface PartnerApplication {
  id: string;
  user_id: string;
  partner_key: string;
  school_id: string | null;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'closed';
  partner_data: Record<string, unknown>;
  loan_amount: number | null;
  interest_amount: number | null;
  total_repayment: number | null;
  repayment_months: number | null;
  monthly_installment: number | null;
  reference_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DtbAcademyApplication {
  school_id: string;
  school_name: string;
  student_name: string;
  admission_number: string;
  education_level: string;
  fee_amount: number;
  has_invoice: boolean;
  has_dtb_account: boolean;
  dtb_account_number: string;
  dtb_phone: string;
  repayment_months: number;
  invoice_url?: string;
}

export interface AppConfig {
  key: string;
  value: string;
  description: string;
}
