"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchOutreachDashboard, type OutreachDashboardStats } from "@/lib/api";
import { useAdminKey } from "@/components/admin/AdminKeyContext";
import { ArrowLeft, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  not_contacted: "Not Contacted",
  researched: "Researched",
  invited: "Invited",
  contacted: "Contacted",
  responded: "Responded",
  signed_up: "Signed Up",
  declined: "Declined",
  inactive: "Inactive",
};

export default function OutreachDashboardPage() {
  const router = useRouter();
  const { adminKey } = useAdminKey();
  const [stats, setStats] = useState<OutreachDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminKey) return;
    fetchOutreachDashboard(adminKey)
      .then((res) => setStats(res.data))
      .catch((err) => toast.error(err.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>;
  }
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!stats) return null;

  const managerEntries = Object.entries(stats.by_manager);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/employers/outreach")} className="rounded-md border border-border p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Performance</h1>
          <p className="text-sm text-muted-foreground">{stats.total_employers.toLocaleString()} employers tracked</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Status Breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats.status_breakdown).map(([status, count]) => (
            <div key={status} className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">{STATUS_LABELS[status] || status}</p>
              <p className="mt-1 text-2xl font-bold">{count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">By Account Manager</h2>
        {managerEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employers assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {managerEntries.map(([id, m]) => (
              <div key={id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.email}</p>
                  <p className="text-sm text-muted-foreground">{m.total} assigned</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {Object.entries(m.by_status).map(([status, count]) => (
                    <span key={status} className="rounded-full bg-muted px-2 py-0.5">
                      {STATUS_LABELS[status] || status}: {count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
