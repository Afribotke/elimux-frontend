"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  fetchOutreachDetail,
  fetchOutreachManagers,
  assignEmployer,
  updateOutreachStatus,
  saveResearch,
  sendInvitation,
  type OutreachManager,
} from "@/lib/api";
import { useAdminKey } from "@/components/admin/AdminKeyContext";
import {
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  Linkedin,
  Send,
  Clock,
  Save,
  Loader2,
  User,
  MessageSquare,
  UserCog,
} from "lucide-react";

const STATUS_OPTIONS = [
  "not_contacted",
  "researched",
  "invited",
  "contacted",
  "responded",
  "signed_up",
  "declined",
  "inactive",
];

export default function EmployerOutreachDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { adminKey } = useAdminKey();
  const [data, setData] = useState<any>(null);
  const [managers, setManagers] = useState<OutreachManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [research, setResearch] = useState({ website: "", email: "", phone: "", linkedin: "" });
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("not_contacted");
  const [inviteEmail, setInviteEmail] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [supervisedBy, setSupervisedBy] = useState("");

  const employerNameId = params.id as string;

  useEffect(() => {
    if (!adminKey || !employerNameId) return;
    loadDetail();
    fetchOutreachManagers(adminKey)
      .then((res) => setManagers(res.data))
      .catch(() => {});
  }, [adminKey, employerNameId]);

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await fetchOutreachDetail(adminKey, employerNameId);
      setData(res.data);
      if (res.data.outreach?.research_data) setResearch({ website: "", email: "", phone: "", linkedin: "", ...res.data.outreach.research_data });
      if (res.data.outreach?.notes) setNotes(res.data.outreach.notes);
      if (res.data.outreach?.status) setStatus(res.data.outreach.status);
      setAssignedTo(res.data.outreach?.assigned_to || "");
      setSupervisedBy(res.data.outreach?.supervised_by || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveResearch() {
    setSaving(true);
    try {
      await saveResearch(adminKey, employerNameId, research, notes);
      toast.success("Research saved");
      loadDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await updateOutreachStatus(adminKey, employerNameId, newStatus, notes);
      toast.success("Status updated");
      loadDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  }

  async function handleAssign() {
    setAssigning(true);
    try {
      await assignEmployer(adminKey, employerNameId, {
        assigned_to: assignedTo || null,
        supervised_by: supervisedBy || null,
        notes,
      });
      toast.success("Assignment saved");
      loadDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }

  async function handleSendInvite() {
    if (!inviteEmail) {
      toast.error("Enter an email address");
      return;
    }
    try {
      await sendInvitation(adminKey, employerNameId, inviteEmail);
      toast.success("Invitation sent");
      loadDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    }
  }

  if (!adminKey) return null;
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!data) return null;

  const { employer, outreach, activities } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/admin/employers/outreach")} className="rounded-md border border-border p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{employer.name}</h1>
          <p className="text-sm text-muted-foreground">Outreach Management</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            handleStatusChange(e.target.value);
          }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        {outreach?.assigned?.email && (
          <span className="text-sm text-muted-foreground">
            <User className="inline h-3.5 w-3.5 mr-1" />
            Assigned to: {outreach.assigned.email}
          </span>
        )}
      </div>

      {/* Assignment */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserCog className="h-5 w-5" /> Assign Team
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Account Manager</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Supervisor</label>
            <select
              value={supervisedBy}
              onChange={(e) => setSupervisedBy(e.target.value)}
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
          onClick={handleAssign}
          disabled={assigning}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Assignment
        </button>
      </div>

      {/* Research Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Research Data</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Website
            </label>
            <input
              type="url"
              value={research.website}
              onChange={(e) => setResearch((r) => ({ ...r, website: e.target.value }))}
              placeholder="https://company.com"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" /> Email
            </label>
            <input
              type="email"
              value={research.email}
              onChange={(e) => setResearch((r) => ({ ...r, email: e.target.value }))}
              placeholder="contact@company.com"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Phone
            </label>
            <input
              type="tel"
              value={research.phone}
              onChange={(e) => setResearch((r) => ({ ...r, phone: e.target.value }))}
              placeholder="+254 700 000 000"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
            </label>
            <input
              type="url"
              value={research.linkedin}
              onChange={(e) => setResearch((r) => ({ ...r, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/company/..."
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Research notes, conversation history..."
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleSaveResearch}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Research
        </button>
      </div>

      {/* Invitation */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Send Invitation</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="employer@company.com"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleSendInvite}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            Send Invite
          </button>
        </div>
        {outreach?.invitation_sent_at && (
          <p className="text-xs text-muted-foreground">Last invited: {new Date(outreach.invitation_sent_at).toLocaleDateString()}</p>
        )}
      </div>

      {/* Activity Log */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Activity History</h2>
        {activities?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activities.map((act: any) => (
              <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium capitalize">{act.action?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {act.performer?.email || "System"} · {new Date(act.created_at).toLocaleString()}
                  </p>
                  {act.details && <p className="text-xs text-muted-foreground mt-1">{JSON.stringify(act.details)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
