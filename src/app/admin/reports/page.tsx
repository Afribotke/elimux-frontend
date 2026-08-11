"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchAttachmentReport, downloadExport, type AttachmentReport } from "@/lib/api";
import { useAdminKey } from "@/components/admin/AdminKeyContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const COLORS = ["#EAB308", "#3B82F6", "#10B981", "#F43F5E"];

export default function ReportsPage() {
  const { adminKey } = useAdminKey();
  const [report, setReport] = useState<AttachmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "exports">("overview");

  useEffect(() => {
    if (!adminKey) return;
    loadData();
  }, [adminKey]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchAttachmentReport(adminKey!);
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  async function loadFiltered() {
    if (!adminKey) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      const data = await fetchAttachmentReport(adminKey, params);
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  const handleExport = (table: string) => {
    if (!adminKey) return;
    downloadExport(adminKey, table, dateRange);
    toast.success(`Downloading ${table} export`);
  };

  if (!adminKey) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted-foreground">Admin key required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attachment Reports</h1>
          <p className="text-sm text-muted-foreground">Completion tracking and data exports.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          />
          <button
            onClick={loadFiltered}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Filter className="inline h-3 w-3 mr-1" />
            Filter
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["overview", "details", "exports"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total" value={report.summary.total} icon={<FileText className="h-5 w-5" />} />
                <StatCard title="Completed" value={report.summary.completed} icon={<TrendingUp className="h-5 w-5 text-green-600" />} trend={report.summary.completion_rate} />
                <StatCard title="Active" value={report.summary.active} icon={<ArrowUpRight className="h-5 w-5 text-blue-600" />} />
                <StatCard title="Pending" value={report.summary.pending} icon={<ArrowDownRight className="h-5 w-5 text-yellow-600" />} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-semibold">Status Distribution</h3>
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Completed", value: report.summary.completed },
                            { name: "Active", value: report.summary.active },
                            { name: "Pending", value: report.summary.pending },
                            { name: "Terminated", value: report.summary.terminated },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {COLORS.map((c, i) => (
                            <Cell key={i} fill={c} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-semibold">Monthly Trend</h3>
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={report.data.slice(0, 12).map((a: any, i: number) => ({ month: `M${12 - i}`, count: 1 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#EAB308" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Student</th>
                    <th className="px-4 py-3 text-left font-medium">Employer</th>
                    <th className="px-4 py-3 text-left font-medium">University</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report.data.map((a: any) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{a.student_id?.slice(0, 8) || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.employer?.company_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.university?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          a.status === "completed" ? "bg-green-50 text-green-700" :
                          a.status === "active" ? "bg-blue-50 text-blue-700" :
                          a.status === "terminated" ? "bg-red-50 text-red-700" :
                          "bg-yellow-50 text-yellow-700"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "exports" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { table: "institutions", label: "Institutions" },
                { table: "programs", label: "Programs" },
                { table: "employers", label: "Employers" },
                { table: "internships", label: "Internships" },
                { table: "applications", label: "Applications" },
                { table: "attachments", label: "Attachments" },
                { table: "contact_messages", label: "Contact Messages" },
              ].map((item) => (
                <button
                  key={item.table}
                  onClick={() => handleExport(item.table)}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50 text-left"
                >
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">Download CSV</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 50 ? "text-green-600" : "text-yellow-600"}`}>
            {trend >= 50 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
