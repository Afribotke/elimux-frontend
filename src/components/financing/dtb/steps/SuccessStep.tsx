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
        This was a demo walkthrough. In the live version, DTB would receive this application and send you an SMS update within 24 hours.
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
