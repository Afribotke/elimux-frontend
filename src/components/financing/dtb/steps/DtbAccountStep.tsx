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
