"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  fetchOutreachEmployers,
  bulkInvite,
  type OutreachEmployer,
} from "@/lib/api";
import { useAdminKey } from "@/components/admin/AdminKeyContext";
import {
  Search,
  Mail,
  Globe,
  Phone,
  Linkedin,
  Send,
  ChevronRight,
  Loader2,
  Users,
  Star,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  not_contacted: "bg-gray-50 text-gray-600",
  researched: "bg-blue-50 text-blue-600",
  invited: "bg-yellow-50 text-yellow-600",
  contacted: "bg-purple-50 text-purple-600",
  responded: "bg-green-50 text-green-600",
  signed_up: "bg-green-100 text-green-700",
  declined: "bg-red-50 text-red-600",
  inactive: "bg-gray-100 text-gray-500",
};

const PRIORITY_STARS = [1, 2, 3, 4, 5];

export default function EmployerOutreachPage() {
  const { adminKey } = useAdminKey();
  const [employers, setEmployers] = useState<OutreachEmployer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminKey) return;
    loadData();
  }, [adminKey, statusFilter, appliedSearch]);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string> = {};
      if (appliedSearch) params.search = appliedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await fetchOutreachEmployers(adminKey, params);
      setEmployers(res.data);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load data");
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleBulkInvite() {
    if (selectedIds.size === 0) {
      toast.error("No employers selected");
      return;
    }
    try {
      const res = await bulkInvite(adminKey, Array.from(selectedIds));
      toast.success(`Sent ${res.data.sent}, skipped ${res.data.noEmail} (no research email), failed ${res.data.failed}`);
      setSelectedIds(new Set());
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Bulk invite failed");
    }
  }

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employer Outreach CRM</h1>
          <p className="text-sm text-muted-foreground">Research, assign, and invite uploaded employers.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/employers/outreach/team"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Users className="inline h-4 w-4 mr-1" />
            Team
          </Link>
          <Link
            href="/admin/employers/outreach/dashboard"
            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAppliedSearch(search)}
            className="rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="not_contacted">Not Contacted</option>
          <option value="researched">Researched</option>
          <option value="invited">Invited</option>
          <option value="contacted">Contacted</option>
          <option value="responded">Responded</option>
          <option value="signed_up">Signed Up</option>
          <option value="declined">Declined</option>
        </select>
        <button
          onClick={() => setAppliedSearch(search)}
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button
            onClick={handleBulkInvite}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Send className="inline h-3 w-3 mr-1" />
            Bulk Invite
          </button>
          <span className="text-xs text-muted-foreground">Only sends to employers with a saved research email</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-500">
          <p>Failed to load: {loadError}</p>
          <button onClick={loadData} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
            Retry
          </button>
        </div>
      ) : employers.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No employers found</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    onChange={() => {
                      if (selectedIds.size === employers.length) setSelectedIds(new Set());
                      else setSelectedIds(new Set(employers.map((e) => e.id)));
                    }}
                    checked={selectedIds.size === employers.length && employers.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Employer</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Account Manager</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Research</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employers.map((emp) => {
                const out = emp.outreach;
                return (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(emp.id)} onChange={() => toggleSelect(emp.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.name}</p>
                      {out?.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{out.notes}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_COLORS[out?.status || "not_contacted"]
                        }`}
                      >
                        {(out?.status || "not_contacted").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{out?.assigned?.email || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {PRIORITY_STARS.map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${s <= (out?.priority || 3) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {out?.research_data?.website && (
                          <a href={out.research_data.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                        {out?.research_data?.email && <Mail className="h-4 w-4 text-green-500" />}
                        {out?.research_data?.phone && <Phone className="h-4 w-4 text-purple-500" />}
                        {out?.research_data?.linkedin && <Linkedin className="h-4 w-4 text-blue-600" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/employers/outreach/${emp.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Manage <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
