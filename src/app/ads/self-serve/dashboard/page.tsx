"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserWithTimeout } from "@/lib/client-auth";
import { advertiserFetch } from "@/lib/advertiserAuth";
import { toast } from "sonner";

type CampaignStatus = "pending_review" | "active" | "rejected" | "completed" | "paused";

interface AdCampaign {
  id: string;
  title: string;
  status: CampaignStatus;
  total_budget: number;
  total_spend: number;
  actual_impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const STATUS_INFO: Record<CampaignStatus, { color: string; label: string }> = {
  pending_review: { color: "bg-amber-100 text-amber-700", label: "Pending Review" },
  active: { color: "bg-emerald-100 text-emerald-700", label: "Active" },
  rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
  completed: { color: "bg-blue-100 text-blue-700", label: "Completed" },
  paused: { color: "bg-orange-100 text-orange-700", label: "Paused" },
};

export default function AdDashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: { user } } = await getUserWithTimeout();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const response = await advertiserFetch('/api/campaigns');
      if (!response.ok) throw new Error("Failed to fetch campaigns");

      const result = await response.json();
      setCampaigns(result.data || []);
    } catch (error) {
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => STATUS_INFO[status as CampaignStatus] || { color: "bg-muted text-foreground", label: status };

  const totalSpent = campaigns.reduce((sum, c) => sum + (c.status === "active" || c.status === "completed" ? c.total_spend : 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.actual_impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ad Dashboard</h1>
            <p className="text-muted-foreground">Manage your campaigns</p>
          </div>
          <Button onClick={() => router.push("/ads/self-serve/create")}>
            + New Campaign
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">KES {totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Active Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.filter((c) => c.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Impressions</p>
              <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg. CTR</p>
              <p className="text-2xl font-bold">{avgCtr}%</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <Button onClick={() => router.push("/ads/self-serve/create")}>
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const statusInfo = getStatusInfo(campaign.status);
                  return (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{campaign.title}</p>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          KES {campaign.total_budget.toLocaleString()} budget
                          {campaign.start_date && campaign.end_date ? ` | ${campaign.start_date} - ${campaign.end_date}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{campaign.actual_impressions.toLocaleString()} impressions</p>
                        <p className="text-sm">{campaign.clicks.toLocaleString()} clicks</p>
                        <p className="text-sm font-medium">
                          {campaign.actual_impressions > 0 ? ((campaign.clicks / campaign.actual_impressions) * 100).toFixed(2) : "0"}% CTR
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
