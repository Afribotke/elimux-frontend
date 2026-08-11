"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  fetchOutreachTeam,
  fetchOutreachManagers,
  addOutreachTeamMember,
  removeOutreachTeamMember,
  type OutreachTeamMember,
  type OutreachManager,
} from "@/lib/api";
import { useAdminKey } from "@/components/admin/AdminKeyContext";
import { ArrowLeft, Loader2, Trash2, UserPlus } from "lucide-react";

const ROLE_OPTIONS: OutreachTeamMember["role"][] = ["account_manager", "outreach_manager", "supervisor"];

export default function OutreachTeamPage() {
  const router = useRouter();
  const { adminKey } = useAdminKey();
  const [team, setTeam] = useState<OutreachTeamMember[]>([]);
  const [managers, setManagers] = useState<OutreachManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<OutreachTeamMember["role"]>("account_manager");
  const [reportsTo, setReportsTo] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!adminKey) return;
    load();
  }, [adminKey]);

  async function load() {
    setLoading(true);
    try {
      const [teamRes, managersRes] = await Promise.all([fetchOutreachTeam(adminKey), fetchOutreachManagers(adminKey)]);
      setTeam(teamRes.data);
      setManagers(managersRes.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!userId) {
      toast.error("Select an admin user");
      return;
    }
    setAdding(true);
    try {
      await addOutreachTeamMember(adminKey, { user_id: userId, role, reports_to: reportsTo || null });
      toast.success("Team member added");
      setUserId("");
      setReportsTo("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to add team member");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeOutreachTeamMember(adminKey, id);
      toast.success("Removed from team");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    }
  }

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/employers/outreach")} className="rounded-md border border-border p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Team</h1>
          <p className="text-sm text-muted-foreground">Manage which admin users work outreach, and who they report to.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Add Team Member
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Admin User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select user...</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OutreachTeamMember["role"])}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Reports To</label>
            <select
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add
        </button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : team.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Reports To</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{t.user?.email || t.user_id}</td>
                  <td className="px-4 py-3 capitalize">{t.role.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.manager?.email || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRemove(t.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
