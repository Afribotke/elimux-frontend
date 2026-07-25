'use client';

import { useState } from 'react';

interface ReferralBannerProps {
  referralCode?: string;
}

export default function ReferralBanner({ referralCode }: ReferralBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !referralCode) return null;

  const link = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elimux.ke'}?ref=${referralCode}`;

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-background/20 rounded-full p-1.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">Earn rewards by referring friends!</p>
            <p className="text-xs text-green-100">Share your link and earn commission on every application.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(link)}
            className="px-3 py-1.5 bg-background text-green-600 text-xs font-medium rounded-lg hover:bg-green-50 transition-colors"
          >
            Copy Link
          </button>
          <button onClick={() => setDismissed(true)} className="text-green-200 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

