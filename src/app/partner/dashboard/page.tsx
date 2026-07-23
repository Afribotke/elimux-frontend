"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReferralLink } from "@/components/partner/ReferralLink";
import { CommissionTracker } from "@/components/partner/CommissionTracker";
import { PartnerStats } from "@/components/partner/PartnerStats";
import { usePartner } from "@/hooks/usePartner";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PartnerData {
  id: string;
  full_name: string;
  email: string;
  referral_code: string;
  status: "pending" | "approved" | "suspended";
  total_earnings: number;
  total_referrals: number;
  pending_payout: number;
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { referrals, commissions, refresh } = usePartner();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/partner/login");
      return;
    }

    try {
      const response = await fetch(`/api/partners/me?user_id=${user.id}`);
      if (!response.ok) throw new Error("Not a partner");
      const data = await response.json();
      setPartner(data);
    } catch {
      toast.error("Partner account not found. Please apply first.");
      router.push("/partner");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!partner) return null;

  if (partner.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>
              Your partner application is being reviewed. You will receive an email once approved.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (partner.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-4 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Account Suspended</CardTitle>
            <CardDescription>
              Your partner account has been suspended. Please contact support for more information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Partner Dashboard</h1>
          <p className="text-slate-600">Welcome back, {partner.full_name}</p>
        </div>

        <PartnerStats
          totalEarnings={partner.total_earnings}
          totalReferrals={partner.total_referrals}
          pendingPayout={partner.pending_payout}
        />

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <ReferralLink referralCode={partner.referral_code} />
          <CommissionTracker commissions={commissions} />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>Students who used your referral link</CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No referrals yet. Share your link to get started!</p>
            ) : (
              <div className="space-y-4">
                {referrals.map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">{ref.student_name || "Anonymous"}</p>
                      <p className="text-sm text-slate-500">{new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-600">{ref.status}</p>
                      {ref.commission_amount && (
                        <p className="text-sm text-slate-600">KES {ref.commission_amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
