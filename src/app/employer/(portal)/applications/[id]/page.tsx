"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, CheckCircle, XCircle, FileText, Link as LinkIcon, Video } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface ApplicationDetail {
  id: string;
  status: string;
  cover_letter?: string;
  portfolio_links?: string[];
  video_intro_url?: string;
  answers?: Record<string, string>;
  submitted_at: string;
  student: {
    full_name: string;
    email: string;
    phone?: string;
    university_name?: string;
    course_name?: string;
    year_of_study?: number;
    registration_number?: string;
  };
  internship: {
    title: string;
    location_county: string;
    profession_category: string;
  };
}

const STATUS_OPTIONS = ["submitted", "under_review", "shortlisted", "interview_scheduled", "offered", "accepted", "rejected", "withdrawn"];

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          cover_letter,
          portfolio_links,
          video_intro_url,
          answers,
          submitted_at,
          student:student_profiles(full_name, email, phone, university_name, course_name, year_of_study, registration_number),
          internship:internships(title, location_county, profession_category)
        `)
        .eq("id", id)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setApp({
          id: data.id,
          status: data.status,
          cover_letter: data.cover_letter,
          portfolio_links: data.portfolio_links,
          video_intro_url: data.video_intro_url,
          answers: data.answers,
          submitted_at: data.submitted_at,
          student: (data.student as any) || {},
          internship: (data.internship as any) || {},
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function updateStatus(status: string) {
    const supabase = createClient();
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update application");
      return;
    }
    setApp((prev) => (prev ? { ...prev, status } : null));
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-1">{error || "Application not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/employer/applications" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Application from {app.student.full_name}</h1>
          <p className="mt-1 text-sm text-gray-500">For: {app.internship.title}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Student Profile</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                {app.student.email}
              </div>
              {app.student.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  {app.student.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                Applied {new Date(app.submitted_at).toLocaleDateString()}
              </div>
              {app.student.university_name && (
                <p className="text-gray-600"><span className="font-medium">University:</span> {app.student.university_name}</p>
              )}
              {app.student.course_name && (
                <p className="text-gray-600"><span className="font-medium">Course:</span> {app.student.course_name}</p>
              )}
              {app.student.year_of_study && (
                <p className="text-gray-600"><span className="font-medium">Year:</span> {app.student.year_of_study}</p>
              )}
            </div>
          </div>

          {app.cover_letter && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5" />
                Cover Letter
              </h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-600">{app.cover_letter}</p>
            </div>
          )}

          {app.answers && Object.keys(app.answers).length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Screening Answers</h2>
              <div className="mt-4 space-y-3">
                {Object.entries(app.answers).map(([q, a]) => (
                  <div key={q}>
                    <p className="text-sm font-medium text-gray-700">{q}</p>
                    <p className="text-sm text-gray-600">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
            <div className="mt-4 space-y-3">
              {app.status !== "shortlisted" && app.status !== "rejected" && (
                <button
                  onClick={() => updateStatus("shortlisted")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Shortlist
                </button>
              )}
              {app.status !== "rejected" && (
                <button
                  onClick={() => updateStatus("rejected")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              )}
              <select
                value={app.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                aria-label="Application status"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {(app.portfolio_links?.length || app.video_intro_url) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Links</h2>
              <div className="mt-4 space-y-2">
                {app.portfolio_links?.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {link}
                  </a>
                ))}
                {app.video_intro_url && (
                  <a
                    href={app.video_intro_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Video className="h-4 w-4" />
                    Video Introduction
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Internship</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Title:</span> {app.internship.title}</p>
              <p><span className="font-medium">Location:</span> {app.internship.location_county}</p>
              <p><span className="font-medium">Category:</span> {app.internship.profession_category}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted: "bg-blue-50 text-blue-700 border-blue-200",
    under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
    shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-200",
    interview_scheduled: "bg-purple-50 text-purple-700 border-purple-200",
    offered: "bg-green-50 text-green-700 border-green-200",
    accepted: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-50 text-red-700 border-red-200",
    withdrawn: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${colors[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
