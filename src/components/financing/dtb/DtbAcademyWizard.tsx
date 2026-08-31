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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
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
    setSubmitting(true);
    setSubmitError('');
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
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
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
          <>
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
            {submitting && <p className="text-xs text-tertiary text-center mt-3">Submitting application…</p>}
            {submitError && <p className="text-xs text-red-600 text-center mt-3">{submitError}</p>}
          </>
        )}
        {step === 5 && <SuccessStep referenceCode={referenceCode} />}
      </div>
    </div>
  );
}
