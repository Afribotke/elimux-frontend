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
          <p className="text-xs text-tertiary">Pay {schoolName}&apos;s fees now. Repay in up to 10 months.</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* DEMO notice */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-xs text-amber-400/90 leading-relaxed">
            <strong>Demo mode:</strong> This is a pilot integration. No real loan applications are being processed yet.
          </span>
        </div>

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
          Try demo eligibility check
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
