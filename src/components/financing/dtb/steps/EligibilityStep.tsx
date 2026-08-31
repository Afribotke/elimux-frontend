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
