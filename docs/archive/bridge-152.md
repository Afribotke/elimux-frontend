Cycle XXX — DTB Academy Financing Module (Demo)
Status: Demo / pilot module. Designed for easy deletion.
Goal: Add a DTB Academy school-fees loan application flow inside ElimuX.
Logo: Use /public/dtb-logo.png (the uploaded red DTB logo). Also available at https://dtbk.dtbafrica.com/storage/uploads/a7c2dbbc-a2fe-4a88-aa0a-ba6833abe2a1/logo.png.
________________________________________
0. Deletion Strategy — Read This First
This entire module is designed to be removed in one command if the demo ends.
Layer	Deletion Method
Database	Single migration file supabase/migrations/999_dtb_academy_demo.sql — run DROP TABLE IF EXISTS partner_applications; DELETE FROM app_config WHERE key = 'dtb_academy_enabled';
Frontend code	Delete folder components/financing/dtb/ and app/financing/dtb-academy/
API code	Delete lib/dtb-api.ts
School page import	Remove one line: import { DtbAcademyPanel } from '@/components/financing/dtb/DtbAcademyPanel' and its usage
Public asset	Delete public/dtb-logo.png
Feature flag: The module is gated by app_config.dtb_academy_enabled. Set to false and the UI disappears without deleting code.
________________________________________
1. Database Schema (Supabase)
1.1 Migration SQL
Run this in Supabase Dashboard → SQL Editor as a single query:
-- ============================================================
-- DTB Academy Demo Module — Migration 999
-- To rollback: see Deletion Strategy above
-- ============================================================

-- 1. Feature flag
INSERT INTO app_config (key, value, description)
VALUES ('dtb_academy_enabled', 'true', 'Show DTB Academy financing panel on school pages')
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- 2. Partner applications table (generic — reusable for other banks)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_key TEXT NOT NULL DEFAULT 'dtb_academy',
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','rejected','disbursed','closed')),

  -- Application data (JSONB = no schema changes for other partners)
  partner_data JSONB NOT NULL DEFAULT '{}',

  -- Loan terms (denormalized for quick display)
  loan_amount NUMERIC(12,2),
  interest_amount NUMERIC(12,2),
  total_repayment NUMERIC(12,2),
  repayment_months INTEGER,
  monthly_installment NUMERIC(12,2),

  -- Tracking
  reference_code TEXT UNIQUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_partner_apps_user ON partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_apps_partner ON partner_applications(partner_key);
CREATE INDEX IF NOT EXISTS idx_partner_apps_ref ON partner_applications(reference_code);

-- 4. RLS
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications"
  ON partner_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON partner_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON partner_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_apps_updated_at ON partner_applications;
CREATE TRIGGER trg_partner_apps_updated_at
  BEFORE UPDATE ON partner_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
1.2 Types (add to existing types file)
Add to types/database.ts (or create types/dtb.types.ts if preferred):
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
________________________________________
2. Public Asset
Save the uploaded DTB logo (image.png) to:
/public/dtb-logo.png
If the file is not available locally, download it from: https://dtbk.dtbafrica.com/storage/uploads/a7c2dbbc-a2fe-4a88-aa0a-ba6833abe2a1/logo.png
________________________________________
3. API Client (Isolated)
Create lib/dtb-api.ts:
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
  const fee = app.fee_amount;
  const interest = Math.round(fee * 0.10);
  const total = fee + interest;
  const monthly = Math.round(total / app.repayment_months);
  const referenceCode = `DTB-ELM-${Math.floor(1000000 + Math.random() * 9000000)}`;

  const { data, error } = await supabase
    .from('partner_applications')
    .insert({
      partner_key: 'dtb_academy',
      school_id: app.school_id,
      status: 'submitted',
      partner_data: app as Record<string, unknown>,
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
________________________________________
4. Components
4.1 Logo Component
Create components/financing/dtb/DtbLogo.tsx:
'use client';

import Image from 'next/image';

interface DtbLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function DtbLogo({ width = 120, height = 40, className = '' }: DtbLogoProps) {
  return (
    <Image
      src="/dtb-logo.png"
      alt="Diamond Trust Bank"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  );
}
4.2 Trust Bar
Create components/financing/dtb/TrustBar.tsx:
'use client';

const items = [
  { icon: 'shield', label: 'Bank-grade secure' },
  { icon: 'check', label: 'No collateral needed' },
  { icon: 'check', label: 'Direct to school' },
];

export function TrustBar() {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-secondary"
        >
          {item.icon === 'shield' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
4.3 Progress Dots
Create components/financing/dtb/ProgressDots.tsx:
'use client';

interface ProgressDotsProps {
  current: number;
  total?: number;
}

export function ProgressDots({ current, total = 6 }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-200 ${
            i < current
              ? 'w-2 bg-green-500'
              : i === current
              ? 'w-6 bg-foreground'
              : 'w-2 bg-border'
          }`}
        />
      ))}
      <span className="ml-auto text-xs text-tertiary">Step {current + 1} of {total}</span>
    </div>
  );
}
4.4 Step 0 — Eligibility
Create components/financing/dtb/steps/EligibilityStep.tsx:
'use client';

import { useState } from 'react';

interface EligibilityStepProps {
  feeAmount: number;
  onNext: (data: { fee: number; hasInvoice: boolean; hasDtb: boolean }) => void;
}

export function EligibilityStep({ feeAmount, onNext }: EligibilityStepProps) {
  const [fee, setFee] = useState(feeAmount);
  const [hasInvoice, setHasInvoice] = useState(true);
  const [hasDtb, setHasDtb] = useState(true);

  const isEligible = fee >= 10000 && fee <= 1000000 && hasInvoice && hasDtb;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">What is the confirmed school fee amount?</label>
        <input
          type="number"
          value={fee}
          onChange={(e) => setFee(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
          placeholder="e.g. 85000"
        />
        <p className="text-xs text-tertiary mt-1">Must be between KES 10,000 and KES 1,000,000</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Do you have a confirmed school invoice?</label>
        <div className="flex flex-col gap-2">
          <label
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
              hasInvoice ? 'border-foreground bg-muted' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="invoice"
              checked={hasInvoice}
              onChange={() => setHasInvoice(true)}
              className="w-[18px] h-[18px] accent-foreground"
            />
            <span className="text-sm">Yes, I have a current-year invoice</span>
          </label>
          <label
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
              !hasInvoice ? 'border-foreground bg-muted' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="invoice"
              checked={!hasInvoice}
              onChange={() => setHasInvoice(false)}
              className="w-[18px] h-[18px] accent-foreground"
            />
            <span className="text-sm">No, not yet</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Do you have an active DTB account?</label>
        <div className="flex flex-col gap-2">
          <label
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
              hasDtb ? 'border-foreground bg-muted' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="dtb"
              checked={hasDtb}
              onChange={() => setHasDtb(true)}
              className="w-[18px] h-[18px] accent-foreground"
            />
            <span className="text-sm">Yes, I bank with DTB</span>
          </label>
          <label
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
              !hasDtb ? 'border-foreground bg-muted' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="dtb"
              checked={!hasDtb}
              onChange={() => setHasDtb(false)}
              className="w-[18px] h-[18px] accent-foreground"
            />
            <span className="text-sm">No, I need to open one</span>
          </label>
        </div>
      </div>

      {fee > 0 && (
        <div
          className={`px-4 py-3 rounded-xl text-center ${
            isEligible
              ? 'bg-green-500/10 text-green-600'
              : 'bg-red-500/10 text-red-600'
          }`}
        >
          <p className="font-medium text-sm">
            {isEligible ? 'You are eligible' : 'Not eligible yet'}
          </p>
          <p className="text-xs mt-0.5">
            {isEligible
              ? `You qualify for a DTB Academy loan of up to KES ${fee.toLocaleString()}.`
              : `${!hasInvoice ? 'Missing school invoice. ' : ''}${!hasDtb ? 'No DTB account. ' : ''}${fee < 10000 || fee > 1000000 ? 'Fee amount out of range.' : ''}`}
          </p>
        </div>
      )}

      <button
        onClick={() => onNext({ fee, hasInvoice, hasDtb })}
        disabled={!isEligible}
        className="w-full py-3 rounded-xl bg-foreground text-background font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        Continue to application
      </button>
    </div>
  );
}
4.5 Step 1 — School & Student
Create components/financing/dtb/steps/SchoolStudentStep.tsx:
'use client';

import { useState } from 'react';

interface SchoolStudentStepProps {
  schoolName: string;
  defaultStudentName: string;
  onNext: (data: { studentName: string; admissionNo: string; eduLevel: string }) => void;
  onBack: () => void;
}

export function SchoolStudentStep({ schoolName, defaultStudentName, onNext, onBack }: SchoolStudentStepProps) {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [admissionNo, setAdmissionNo] = useState('');
  const [eduLevel, setEduLevel] = useState('Secondary School');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">School name</label>
        <input
          type="text"
          value={schoolName}
          readOnly
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-tertiary text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Student full name</label>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Admission / registration number</label>
        <input
          type="text"
          value={admissionNo}
          onChange={(e) => setAdmissionNo(e.target.value)}
          placeholder="e.g. ADM/2026/0042"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Education level</label>
        <select
          value={eduLevel}
          onChange={(e) => setEduLevel(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        >
          <option>Pre-primary</option>
          <option>Primary School</option>
          <option>Secondary School</option>
          <option>University / College</option>
        </select>
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-base hover:bg-muted/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ studentName, admissionNo, eduLevel })}
          className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-base hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
4.6 Step 2 — Invoice Upload
Create components/financing/dtb/steps/InvoiceUploadStep.tsx:
'use client';

import { useState, useRef } from 'react';

interface InvoiceUploadStepProps {
  onNext: (fileName: string) => void;
  onBack: () => void;
}

export function InvoiceUploadStep({ onNext, onBack }: InvoiceUploadStepProps) {
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setUploaded(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary">
        DTB pays the school directly against this invoice. It must be for the current academic year.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          uploaded
            ? 'border-green-500 bg-green-500/5'
            : 'border-border hover:border-foreground hover:bg-muted'
        }`}
      >
        {uploaded ? (
          <>
            <svg className="w-8 h-8 mx-auto mb-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-sm text-secondary">Upload complete</p>
            <p className="text-xs text-tertiary mt-1">{fileName}</p>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto mb-2 text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm text-secondary">Tap to upload invoice</p>
            <p className="text-xs text-tertiary mt-1">PDF, JPG, or PNG — max 5MB</p>
          </>
        )}
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-base hover:bg-muted/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext(fileName)}
          disabled={!uploaded}
          className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
4.7 Step 3 — DTB Account
Create components/financing/dtb/steps/DtbAccountStep.tsx:
'use client';

import { useState } from 'react';

interface DtbAccountStepProps {
  onNext: (data: { accountNo: string; phone: string; months: number }) => void;
  onBack: () => void;
}

export function DtbAccountStep({ onNext, onBack }: DtbAccountStepProps) {
  const [accountNo, setAccountNo] = useState('');
  const [phone, setPhone] = useState('');
  const [months, setMonths] = useState(10);

  const isValid = accountNo.length >= 5 && phone.length >= 9;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">DTB account number</label>
        <input
          type="text"
          value={accountNo}
          onChange={(e) => setAccountNo(e.target.value)}
          placeholder="e.g. 0123456789"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        />
        <p className="text-xs text-tertiary mt-1">The account must be in the parent&apos;s name applying for the loan.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Phone number registered with DTB</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0712 345 678"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Preferred repayment period</label>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        >
          <option value={3}>3 months</option>
          <option value={6}>6 months</option>
          <option value={10}>10 months</option>
        </select>
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-base hover:bg-muted/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ accountNo, phone, months })}
          disabled={!isValid}
          className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
4.8 Step 4 — Review
Create components/financing/dtb/steps/ReviewStep.tsx:
'use client';

import { useState } from 'react';
import { calculateLoanTerms, generateSchedule } from '@/lib/dtb-api';

interface ReviewStepProps {
  data: {
    schoolName: string;
    studentName: string;
    fee: number;
    months: number;
  };
  onSubmit: () => void;
  onBack: () => void;
}

export function ReviewStep({ data, onSubmit, onBack }: ReviewStepProps) {
  const [termsChecked, setTermsChecked] = useState(false);
  const [creditChecked, setCreditChecked] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);

  const { interest, total, monthly } = calculateLoanTerms(data.fee, data.months);
  const { schedule } = generateSchedule(data.fee, data.months);

  const allChecked = termsChecked && creditChecked && dataChecked;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-secondary">School</span>
          <span className="font-medium">{data.schoolName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Student</span>
          <span className="font-medium">{data.studentName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">School fees</span>
          <span className="font-medium">KES {data.fee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Interest (10%)</span>
          <span className="font-medium">KES {interest.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Repayment period</span>
          <span className="font-medium">{data.months} months</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="text-secondary font-medium">Total repayment</span>
          <span className="font-medium text-green-600">KES {total.toLocaleString()}</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-tertiary mb-2">Repayment schedule</p>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-tertiary font-normal">Month</th>
                <th className="text-left px-3 py-2 text-tertiary font-normal">Due date</th>
                <th className="text-right px-3 py-2 text-tertiary font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.month} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-secondary">Month {s.month}</td>
                  <td className="px-3 py-2 text-secondary">{s.dueDate}</td>
                  <td className="px-3 py-2 text-right font-medium">KES {s.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-muted">
                <td className="px-3 py-2 font-medium">Total</td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2 text-right font-medium">KES {total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 text-sm text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            className="w-[18px] h-[18px] mt-0.5 accent-foreground flex-shrink-0"
          />
          <span>I agree to DTB&apos;s terms and conditions for the Academy school fees loan.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={creditChecked}
            onChange={(e) => setCreditChecked(e.target.checked)}
            className="w-[18px] h-[18px] mt-0.5 accent-foreground flex-shrink-0"
          />
          <span>I consent to DTB performing a credit assessment on my account.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={dataChecked}
            onChange={(e) => setDataChecked(e.target.checked)}
            className="w-[18px] h-[18px] mt-0.5 accent-foreground flex-shrink-0"
          />
          <span>I consent to ElimuX sharing this application data with DTB for loan processing only.</span>
        </label>
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-base hover:bg-muted/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!allChecked}
          className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Submit application to DTB
        </button>
      </div>
    </div>
  );
}
4.9 Step 5 — Success
Create components/financing/dtb/steps/SuccessStep.tsx:
'use client';

import Link from 'next/link';

interface SuccessStepProps {
  referenceCode: string;
}

export function SuccessStep({ referenceCode }: SuccessStepProps) {
  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 className="text-xl font-medium mb-1.5">Application submitted!</h3>
      <p className="text-sm text-secondary mb-5">
        DTB has received your school fees loan application. You&apos;ll get an SMS update within 24 hours.
      </p>

      <div className="bg-muted rounded-xl px-4 py-3.5 mb-5">
        <p className="font-mono text-lg font-medium tracking-wider">{referenceCode}</p>
        <p className="text-xs text-tertiary mt-1">Reference number — save this</p>
      </div>

      <div className="flex gap-2.5 justify-center">
        <Link
          href="/profile/applications"
          className="px-5 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-sm hover:bg-muted/80 transition-colors"
        >
          Track status
        </Link>
        <Link
          href="/"
          className="px-5 py-3 rounded-xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Explore more schools
        </Link>
      </div>
    </div>
  );
}
4.10 Main Wizard
Create components/financing/dtb/DtbAcademyWizard.tsx:
'use client';

import { useState } from 'react';
import { DtbLogo } from './DtbLogo';
import { TrustBar } from './TrustBar';
import { ProgressDots } from './ProgressDots';
import { EligibilityStep } from './steps/EligibilityStep';
import { SchoolStudentStep } from './steps/SchoolStudentStep';
import { InvoiceUploadStep } from './steps/InvoiceUploadStep';
import { DtbAccountStep } from './steps/DtbAccountStep';
import { ReviewStep } from './steps/ReviewStep';
import { SuccessStep } from './steps/SuccessStep';
import { submitDtbApplication } from '@/lib/dtb-api';

interface DtbAcademyWizardProps {
  schoolId: string;
  schoolName: string;
  feeAmount: number;
  userName: string;
}

export function DtbAcademyWizard({ schoolId, schoolName, feeAmount, userName }: DtbAcademyWizardProps) {
  const [step, setStep] = useState(0);
  const [referenceCode, setReferenceCode] = useState('');
  const [formData, setFormData] = useState({
    fee: feeAmount,
    studentName: userName,
    admissionNo: '',
    eduLevel: 'Secondary School',
    invoiceFile: '',
    accountNo: '',
    phone: '',
    months: 10,
  });

  const handleEligibility = (data: { fee: number; hasInvoice: boolean; hasDtb: boolean }) => {
    setFormData((prev) => ({ ...prev, fee: data.fee }));
    setStep(1);
  };

  const handleSchoolStudent = (data: { studentName: string; admissionNo: string; eduLevel: string }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleInvoice = (fileName: string) => {
    setFormData((prev) => ({ ...prev, invoiceFile: fileName }));
    setStep(3);
  };

  const handleDtbAccount = (data: { accountNo: string; phone: string; months: number }) => {
    setFormData((prev) => ({ ...prev, accountNo: data.accountNo, phone: data.phone, months: data.months }));
    setStep(4);
  };

  const handleSubmit = async () => {
    try {
      const result = await submitDtbApplication({
        school_id: schoolId,
        school_name: schoolName,
        student_name: formData.studentName,
        admission_number: formData.admissionNo,
        education_level: formData.eduLevel,
        fee_amount: formData.fee,
        has_invoice: true,
        has_dtb_account: true,
        dtb_account_number: formData.accountNo,
        dtb_phone: formData.phone,
        repayment_months: formData.months,
        invoice_url: formData.invoiceFile,
      });
      setReferenceCode(result.reference_code);
      setStep(5);
    } catch (err) {
      alert('Submission failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <DtbLogo width={100} height={34} />
        <div>
          <h2 className="text-base font-medium">DTB Academy — School Fees Loan</h2>
          <p className="text-xs text-tertiary">Apply in minutes. Get a decision fast.</p>
        </div>
      </div>

      <TrustBar />
      <ProgressDots current={step} />

      <div className="border border-border rounded-xl p-5">
        {step === 0 && (
          <EligibilityStep feeAmount={formData.fee} onNext={handleEligibility} />
        )}
        {step === 1 && (
          <SchoolStudentStep
            schoolName={schoolName}
            defaultStudentName={formData.studentName}
            onNext={handleSchoolStudent}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <InvoiceUploadStep onNext={handleInvoice} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <DtbAccountStep onNext={handleDtbAccount} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <ReviewStep
            data={{
              schoolName,
              studentName: formData.studentName,
              fee: formData.fee,
              months: formData.months,
            }}
            onSubmit={handleSubmit}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && <SuccessStep referenceCode={referenceCode} />}
      </div>
    </div>
  );
}
4.11 Panel (Embedded on School Page)
Create components/financing/dtb/DtbAcademyPanel.tsx:
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DtbLogo } from './DtbLogo';

interface DtbAcademyPanelProps {
  schoolId: string;
  schoolName: string;
  feeAmount: number;
}

export function DtbAcademyPanel({ schoolId, schoolName, feeAmount }: DtbAcademyPanelProps) {
  const [sliderValue, setSliderValue] = useState(feeAmount);
  const interest = Math.round(sliderValue * 0.10);
  const total = sliderValue + interest;
  const monthly = Math.round(total / 10);

  return (
    <div className="border border-border rounded-xl overflow-hidden mt-5">
      <div className="flex items-center gap-3 px-4 py-3.5 bg-muted border-b border-border">
        <DtbLogo width={80} height={28} />
        <div>
          <h3 className="text-sm font-medium">DTB Academy — School Fees Loan</h3>
          <p className="text-xs text-tertiary">Pay school fees now. Repay in up to 10 months.</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-600 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Unsecured — no collateral
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-600 text-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Direct to school
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-tertiary mb-1.5">
            <span>KES 10,000</span>
            <span>KES {sliderValue.toLocaleString()}</span>
            <span>KES 1,000,000</span>
          </div>
          <input
            type="range"
            min={10000}
            max={1000000}
            step={5000}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">School fees covered</span>
            <span className="font-medium">KES {sliderValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Interest (10% over 3 mo)</span>
            <span className="font-medium">KES {interest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Total repayment</span>
            <span className="font-medium text-green-600">KES {total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Monthly instalment (10 mo)</span>
            <span className="font-medium text-green-600">KES {monthly.toLocaleString()}</span>
          </div>
        </div>

        <Link
          href={`/financing/dtb-academy?school=${schoolId}&fee=${feeAmount}`}
          className="block w-full py-3 rounded-xl bg-foreground text-background text-center font-medium text-base hover:opacity-90 transition-opacity"
        >
          Check eligibility on ElimuX
        </Link>

        <div className="flex gap-2 items-start text-xs text-secondary bg-amber-500/10 rounded-lg px-3 py-2.5">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>You need a confirmed school invoice and a DTB account. DTB pays the school directly.</span>
        </div>
      </div>
    </div>
  );
}
________________________________________
5. Pages
5.1 Standalone Wizard Page
Create app/financing/dtb-academy/page.tsx:
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { DtbAcademyWizard } from '@/components/financing/dtb/DtbAcademyWizard';

function WizardContent() {
  const params = useSearchParams();
  const schoolId = params.get('school') || '';
  const fee = Number(params.get('fee') || 85000);

  return (
    <DtbAcademyWizard
      schoolId={schoolId}
      schoolName="Moi Girls High School"
      feeAmount={fee}
      userName="Jane Wanjiku"
    />
  );
}

export default function DtbAcademyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-secondary">Loading...</div>}>
      <WizardContent />
    </Suspense>
  );
}
Create app/financing/dtb-academy/layout.tsx:
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
5.2 School Page Integration
In the existing school detail page (e.g., app/schools/[id]/page.tsx), add this one block inside the component:
import { DtbAcademyPanel } from '@/components/financing/dtb/DtbAcademyPanel';
import { isDtbAcademyEnabled } from '@/lib/dtb-api';

// Inside the component, after data fetch:
const [dtbEnabled, setDtbEnabled] = useState(false);

useEffect(() => {
  isDtbAcademyEnabled().then(setDtbEnabled);
}, []);

// In the JSX, after the fee display:
{dtbEnabled && (
  <DtbAcademyPanel
    schoolId={school.id}
    schoolName={school.name}
    feeAmount={school.annual_fees || 85000}
  />
)}
________________________________________
6. Build & Deploy Checklist
Step	Action	Command
1	Save dtb-logo.png to /public/	Manual copy
2	Run Supabase migration	Paste SQL in Dashboard → SQL Editor
3	Create all component files	Claude pastes each file
4	Create page files	Claude pastes each file
5	Add school page integration	Claude edits existing file
6	Build	npm run build
7	Fix any TypeScript errors	Claude fixes
8	Deploy	Vercel auto-deploys on push
________________________________________
7. Post-Deploy Verification
1.	Visit a school page → confirm DTB panel appears only when dtb_academy_enabled = true
2.	Click “Check eligibility” → confirm wizard loads at /financing/dtb-academy
3.	Walk through all 6 steps → confirm submission succeeds and reference code displays
4.	Check Supabase → confirm row in partner_applications with partner_key = 'dtb_academy'
5.	Set dtb_academy_enabled = false → confirm panel disappears from school page
________________________________________
8. Rollback (If Demo Ends)
-- Supabase SQL Editor
DROP TABLE IF EXISTS partner_applications;
DELETE FROM app_config WHERE key = 'dtb_academy_enabled';
# Delete frontend code
rm -rf components/financing/dtb/
rm -rf app/financing/dtb-academy/
rm lib/dtb-api.ts
rm public/dtb-logo.png

# Remove import from school page (manual edit)
________________________________________
End of spec. Do not commit or push until explicitly instructed.
