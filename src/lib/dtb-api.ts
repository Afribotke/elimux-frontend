import { createClient } from '@/lib/supabase/client';
import type { PartnerApplication, DtbAcademyApplication } from '@/types/dtb.types';

const supabase = createClient();

export async function isDtbAcademyEnabled(): Promise<boolean> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'dtb_academy_enabled')
    .single();
  if (error) return false;
  return data?.value === 'true';
}

export async function submitDtbApplication(
  app: DtbAcademyApplication
): Promise<{ reference_code: string; id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to submit an application.');

  const fee = app.fee_amount;
  const interest = Math.round(fee * 0.10);
  const total = fee + interest;
  const monthly = Math.round(total / app.repayment_months);
  const referenceCode = `DEMO-ELM-${Math.floor(1000000 + Math.random() * 9000000)}`;

  const { data, error } = await supabase
    .from('partner_applications')
    .insert({
      user_id: user.id,
      partner_key: 'dtb_academy',
      school_id: app.school_id,
      status: 'submitted',
      partner_data: app as unknown as Record<string, unknown>,
      loan_amount: fee,
      interest_amount: interest,
      total_repayment: total,
      repayment_months: app.repayment_months,
      monthly_installment: monthly,
      reference_code: referenceCode,
    })
    .select('id, reference_code')
    .single();

  if (error) throw new Error(error.message);
  return { reference_code: data.reference_code!, id: data.id };
}

export async function getUserApplications(): Promise<PartnerApplication[]> {
  const { data, error } = await supabase
    .from('partner_applications')
    .select('*')
    .eq('partner_key', 'dtb_academy')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export function calculateLoanTerms(fee: number, months: number) {
  const interest = Math.round(fee * 0.10);
  const total = fee + interest;
  const monthly = Math.round(total / months);
  return { interest, total, monthly };
}

export function generateSchedule(fee: number, months: number) {
  const { total, monthly } = calculateLoanTerms(fee, months);
  const start = new Date();
  const schedule = [];
  for (let i = 1; i <= months; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    schedule.push({
      month: i,
      dueDate: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: monthly,
    });
  }
  return { schedule, total };
}
