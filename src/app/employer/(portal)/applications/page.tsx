"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, User, Mail, Phone, Calendar, CheckCircle, XCircle, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Application {
  id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  internship_title: string;
  status: string;
  cover_letter?: string;
  submitted_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
  shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  interview_scheduled: "bg-purple-50 text-purple-700 border-purple-200",
  offered: "bg-green-50 text-green-700 border-green-200",
  accepted: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function EmployerApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teamMember } = await supabase
        .from("employer_team_members")
        .select("employer_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!teamMember) {
        setError("Employer profile not found");
        setLoading(false);
        return;
      }

      const { data: internships } = await supabase
        .from("internships")
        .select("id, title")
        .eq("employer_id", teamMember.employer_id);

      const internshipIds = (internships || []).map((i) => i.id);
      const titleById = new Map((internships || []).map((i) => [i.id, i.title]));

      if (internshipIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from("applications")
        .select("id, status, cover_letter, submitted_at, internship_id, student:student_profiles(full_name, email, phone)")
        .in("internship_id", internshipIds)
        .order("submitted_at", { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        const rows = (data || []).map((a: any) => ({
          id: a.id,
          student_name: a.student?.full_name || "Unknown",
          student_email: a.student?.email || "",
          student_phone: a.student?.phone,
          internship_title: titleById.get(a.internship_id) || "Unknown",
          status: a.status,
          cover_letter: a.cover_letter,
          submitted_at: a.submitted_at,
        }));
        setApplications(rows);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update application");
      return;
    }
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  const counts = {
    total: applications.length,
    review: applications.filter((a) => a.status === "submitted" || a.status === "under_review").length,
    shortlisted: applications.filter((a) => a.status === "shortlisted" || a.status === "interview_scheduled" || a.status === "offered" || a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="mt-1 text-sm text-gray-500">Review and manage student applications</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={counts.total} color="bg-blue-50 text-blue-700" />
        <StatCard label="Needs Review" value={counts.review} color="bg-yellow-50 text-yellow-700" />
        <StatCard label="Shortlisted+" value={counts.shortlisted} color="bg-green-50 text-green-700" />
        <StatCard label="Rejected" value={counts.rejected} color="bg-red-50 text-red-700" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">All Applications</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {applications.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              No applications yet
            </div>
          )}
          {applications.map((app) => (
            <div key={app.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{app.student_name}</p>
                      <p className="text-sm text-gray-500">{app.internship_title}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {app.student_email}
                    </span>
                    {app.student_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {app.student_phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  {app.cover_letter && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{app.cover_letter}</p>
                  )}
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <StatusBadge status={app.status} />
                  <div className="flex gap-2">
                    {(app.status === "submitted" || app.status === "under_review") && (
                      <>
                        <button
                          onClick={() => updateStatus(app.id, "shortlisted")}
                          className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                          title="Shortlist"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, "rejected")}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <Link
                      href={`/employer/applications/${app.id}`}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-5 ${color.split(" ")[0]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
