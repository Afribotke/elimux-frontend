"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { fetchTradeTestEligibility, fetchCompletionCertificates, type TradeTestEligibility, type CompletionCertificate } from "@/lib/api";
import { toast } from "sonner";
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Download,
  Loader2,
  ArrowRight,
  Shield,
  GraduationCap,
  FileCheck,
} from "lucide-react";

function RequirementItem({
  met,
  label,
  detail,
}: {
  met: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      {met ? (
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      )}
      <div>
        <p className={`font-medium ${met ? "text-green-700" : "text-red-600"}`}>{label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function GradeCard({
  grade,
  eligible,
}: {
  grade: string;
  eligible: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 text-center transition-all ${
        eligible
          ? "border-green-200 bg-green-50/50 shadow-sm"
          : "border-border bg-card opacity-60"
      }`}
    >
      <GraduationCap className={`mx-auto h-8 w-8 ${eligible ? "text-green-600" : "text-muted-foreground"}`} />
      <p className={`mt-2 text-lg font-bold ${eligible ? "text-green-900" : "text-muted-foreground"}`}>
        {grade}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {eligible ? "You are eligible" : "Not yet eligible"}
      </p>
    </div>
  );
}

export default function TradeTestPage() {
  const router = useRouter();
  const [eligibility, setEligibility] = useState<TradeTestEligibility | null>(null);
  const [certificates, setCertificates] = useState<CompletionCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const user = await getUserWithTimeout();
      if (!user) {
        router.push("/login");
        return;
      }

      const session = await createClient().auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        router.push("/login");
        return;
      }

      const [eligData, certsData] = await Promise.all([
        fetchTradeTestEligibility(token),
        fetchCompletionCertificates(token),
      ]);

      setEligibility(eligData);
      setCertificates(certsData);
    } catch (err: any) {
      console.error("Trade test load error:", err);
      toast.error(err.message || "Failed to load trade test data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eligibility) return null;

  const requirements = [
    {
      met: eligibility.completed_attachments > 0,
      label: "Complete at least one attachment",
      detail: `You have completed ${eligibility.completed_attachments} attachment(s).`,
    },
    {
      met: eligibility.total_weeks >= 12,
      label: "Minimum 12 weeks total attachment",
      detail: `You have ${eligibility.total_weeks} weeks logged.`,
    },
    {
      met: eligibility.completed_attachments > 0 && eligibility.total_weeks >= 12,
      label: "Institution verification",
      detail: "Your institution has verified your placement.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trade Test Eligibility</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your eligibility for NITA Government Trade Tests and download certificates.
        </p>
      </div>

      {eligibility.is_eligible ? (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">You are eligible for trade testing</p>
              <p className="text-sm text-green-700">
                Next available grade: <span className="font-bold">{eligibility.next_grade}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="text-lg font-semibold text-yellow-900">Not yet eligible</p>
              <p className="text-sm text-yellow-700">
                Complete more attachment weeks to qualify. You need 12+ weeks for Grade III.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Grades</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <GradeCard grade="Grade III" eligible={eligibility.total_weeks >= 12} />
          <GradeCard grade="Grade II" eligible={eligibility.total_weeks >= 24} />
          <GradeCard grade="Grade I" eligible={eligibility.total_weeks >= 36} />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Requirements</h2>
        <div className="space-y-3">
          {requirements.map((r, i) => (
            <RequirementItem key={i} met={r.met} label={r.label} detail={r.detail} />
          ))}
        </div>
      </div>

      {eligibility.attachments.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Attachment History</h2>
          <div className="space-y-3">
            {eligibility.attachments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{a.employer?.company_name || a.university?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.start_date && a.end_date
                        ? `${new Date(a.start_date).toLocaleDateString()} – ${new Date(a.end_date).toLocaleDateString()}`
                        : "Dates not set"}
                      {" · "}
                      <span className={`capitalize ${a.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                        {a.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Certificates</h2>
          {certificates.length === 0 && (
            <Link href="/student/dashboard" className="text-sm font-medium text-primary hover:underline">
              Go to Dashboard <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {certificates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <FileCheck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No certificates yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Complete an attachment to earn a certificate.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{cert.employer?.company_name || "Attachment Certificate"}</p>
                    <p className="text-xs text-muted-foreground">
                      Completed {cert.end_date ? new Date(cert.end_date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
                {cert.certificate_url ? (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">Processing</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
