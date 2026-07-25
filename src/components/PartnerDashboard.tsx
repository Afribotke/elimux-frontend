'use client';

import { useState } from 'react';
import { Partner } from '@/types';

interface PartnerDashboardProps {
  partner: Partner;
}

export default function PartnerDashboard({ partner }: PartnerDashboardProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elimux.ke'}?ref=${partner.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Discover your dream education with ElimuX! Use my referral link: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            KES {partner.total_earnings.toLocaleString()}
          </p>
        </div>
        <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium">Referrals</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{partner.referrals_count}</p>
        </div>
        <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-medium">Commission Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{partner.commission_rate}%</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="font-bold text-lg mb-2">Your Referral Link</h3>
        <p className="text-blue-100 text-sm mb-4">Share this link and earn {partner.commission_rate}% commission on every successful application.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-2.5 bg-background/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2.5 bg-background text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={shareOnWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.13 1.521 5.889L0 24l6.335-1.652c1.746.953 3.71 1.456 5.71 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

