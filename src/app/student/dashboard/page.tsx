"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { toast } from "sonner";
import {
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { Application, StudentProfile } from "@/types/internship";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
  shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  interview_scheduled: "bg-purple-50 text-purple-700 border-purple-200",
  offered: "bg-green-50 text-green-700 border-green-200",
  accepted: "bg-emerald-600 text-white border-emerald-600",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

const OPEN_STATUSES = ["submitted", "under_review", "shortlisted", "interview_scheduled", "offered"];

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className={`inline-flex rounded-lg p-2.5 ${color}`}>{icon}</div>
      <div className="mt-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
    >
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activePlacement, setActivePlacement] = useState<Application | null>(null);
  const [stats, setStats] = useState({ total: 0, open: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await getUserWithTimeout();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        router.push("/student/profile");
        return;
      }
      setProfile(profileData);

      const { data: apps, error } = await supabase
        .from("applications")
        .select("*, internship:internships(title, profession_category, location_county, is_remote, duration_weeks, employer:employers(company_name))")
        .eq("student_id", profileData.id)
        .order("submitted_at", { ascending: false });

      if (error) {
        toast.error("Failed to load applications");
      }

      const appList = apps || [];
      setApplications(appList);
      setActivePlacement(appList.find((a) => a.status === "accepted") || null);
      setStats({
        total: appList.length,
        open: appList.filter((a) => OPEN_STATUSES.includes(a.status)).length,
        accepted: appList.filter((a) => a.status === "accepted").length,
        rejected: appList.filter((a) => a.status === "rejected").length,
      });
      setLoading(false);
    };

    loadDashboard();
  }, [router, supabase]);

  const statusBadge = (status: string) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] || STATUS_COLORS.submitted}`}>
      {status.replace(/_/g, " ")}
    </span>
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.course_name && profile?.university_name
            ? `${profile.course_name} · ${profile.university_name}`
            : "Manage your attachments and internships"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Applications" value={stats.total} icon={<FileText className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
        <StatCard title="In Progress" value={stats.open} icon={<Clock className="h-5 w-5 text-yellow-600" />} color="bg-yellow-50" />
        <StatCard title="Accepted" value={stats.accepted} icon={<CheckCircle className="h-5 w-5 text-green-600" />} color="bg-green-50" />
        <StatCard title="Rejected" value={stats.rejected} icon={<XCircle className="h-5 w-5 text-red-600" />} color="bg-red-50" />
      </div>

      {activePlacement && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">Active Placement</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-green-700/70">Position</p>
              <p className="mt-0.5 font-semibold text-green-900">{activePlacement.internship?.title || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-700/70">Employer</p>
              <p className="mt-0.5 font-semibold text-green-900">{activePlacement.internship?.employer?.company_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-700/70">Location</p>
              <p className="mt-0.5 font-semibold text-green-900">{activePlacement.internship?.is_remote ? "Remote" : activePlacement.internship?.location_county || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-700/70">Duration</p>
              <p className="mt-0.5 font-semibold text-green-900">{activePlacement.internship?.duration_weeks ? `${activePlacement.internship.duration_weeks} weeks` : "—"}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <QuickAction href="/opportunities" icon={<Briefcase className="h-5 w-5" />} label="Browse Opportunities" desc="Find attachments and internships" />
          <QuickAction href="/student/logbook" icon={<BookOpen className="h-5 w-5" />} label="My Logbook" desc="Track daily activities" />
          <QuickAction href="/student/profile" icon={<User className="h-5 w-5" />} label="Update Profile" desc="Edit your details and CV" />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Applications</h2>
          <Link href="/internships/my-applications" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {applications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No applications yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Browse opportunities to get started.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Position</th>
                  <th className="px-4 py-3 text-left font-medium">Employer</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{app.internship?.title || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{app.internship?.employer?.company_name || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(app.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(app.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
