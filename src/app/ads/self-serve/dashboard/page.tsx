"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  status: "draft" | "pending_payment" | "active" | "paused" | "completed" | "rejected";
  total_cost: number;
  duration_days: number;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  created_at: string;
}

export default function AdDashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`/api/self-serve-ads/campaigns?advertiser_id=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch campaigns");

      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      pending_payment: "bg-yellow-100 text-yellow-700",
      paused: "bg-slate-100 text-slate-700",
      completed: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
      draft: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const totalSpent = campaigns.reduce((sum, c) => sum + (c.status === "active" || c.status === "completed" ? c.total_cost : 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ad Dashboard</h1>
            <p className="text-slate-600">Manage your campaigns</p>
          </div>
          <Button onClick={() => router.push("/ads/self-serve/create")}>
            + New Campaign
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Total Spent</p>
              <p className="text-2xl font-bold">KES {totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Active Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.filter((c) => c.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Total Impressions</p>
              <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Avg. CTR</p>
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
                <p className="text-slate-500 mb-4">No campaigns yet</p>
                <Button onClick={() => router.push("/ads/self-serve/create")}>
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{campaign.name}</p>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {campaign.duration_days} days | KES {campaign.total_cost.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{campaign.impressions.toLocaleString()} impressions</p>
                      <p className="text-sm">{campaign.clicks.toLocaleString()} clicks</p>
                      <p className="text-sm font-medium">{campaign.ctr}% CTR</p>
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
