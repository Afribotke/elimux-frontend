"use client";

import { Card, CardContent } from "@/components/ui/card";

interface PartnerStatsProps {
  totalEarnings: number;
  totalReferrals: number;
  pendingPayout: number;
}

export function PartnerStats({ totalEarnings, totalReferrals, pendingPayout }: PartnerStatsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Total Earnings</p>
          <p className="text-3xl font-bold text-emerald-600">KES {totalEarnings.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Total Referrals</p>
          <p className="text-3xl font-bold text-blue-600">{totalReferrals}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">Pending Payout</p>
          <p className="text-3xl font-bold text-yellow-600">KES {pendingPayout.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
