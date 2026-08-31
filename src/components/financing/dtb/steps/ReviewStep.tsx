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
