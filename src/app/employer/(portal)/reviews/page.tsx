"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import {
  fetchPendingEvaluations,
  fetchSubmittedEvaluations,
  submitEvaluation,
  type PendingEvaluation,
  type SubmittedEvaluation,
} from "@/lib/api";
import { toast } from "sonner";
import {
  User,
  Calendar,
  Send,
  Loader2,
  CheckCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Award,
} from "lucide-react";

const SCORE_DIMENSIONS = [
  { key: "punctuality_score", label: "Punctuality" },
  { key: "teamwork_score", label: "Teamwork" },
  { key: "communication_score", label: "Communication" },
  { key: "technical_skills_score", label: "Technical Skills" },
  { key: "initiative_score", label: "Initiative" },
] as const;

const RECOMMENDATIONS = [
  { value: "highly_recommend", label: "Highly Recommend", icon: <ThumbsUp className="h-4 w-4" /> },
  { value: "recommend", label: "Recommend", icon: <ThumbsUp className="h-4 w-4" /> },
  { value: "neutral", label: "Neutral", icon: <Minus className="h-4 w-4" /> },
  { value: "not_recommend", label: "Not Recommend", icon: <ThumbsDown className="h-4 w-4" /> },
];

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function RecommendationButton({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-accent"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function SubmittedCard({ ev }: { ev: SubmittedEvaluation }) {
  const avg = Math.round(
    (ev.punctuality_score + ev.teamwork_score + ev.communication_score + ev.technical_skills_score + ev.initiative_score) / 5
  );
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{ev.student_name || "Student"}</p>
            <p className="text-xs text-muted-foreground">
              {ev.attachment?.start_date ? new Date(ev.attachment.start_date).toLocaleDateString() : "—"} –{" "}
              {ev.attachment?.end_date ? new Date(ev.attachment.end_date).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {avg}
            <span className="text-sm text-muted-foreground">/10</span>
          </p>
          <p className="text-xs text-muted-foreground">Average</p>
        </div>
      </div>
      {ev.strengths && (
        <div className="mt-3 rounded-lg bg-green-50 p-3">
          <p className="text-xs font-medium text-green-700">Strengths</p>
          <p className="text-sm text-green-800">{ev.strengths}</p>
        </div>
      )}
      {ev.areas_for_improvement && (
        <div className="mt-2 rounded-lg bg-yellow-50 p-3">
          <p className="text-xs font-medium text-yellow-700">Areas for Improvement</p>
          <p className="text-sm text-yellow-800">{ev.areas_for_improvement}</p>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Recommendation:</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            ev.recommendation === "highly_recommend"
              ? "bg-green-100 text-green-700"
              : ev.recommendation === "recommend"
                ? "bg-blue-100 text-blue-700"
                : ev.recommendation === "neutral"
                  ? "bg-gray-100 text-gray-700"
                  : "bg-red-100 text-red-700"
          }`}
        >
          {ev.recommendation?.replace(/_/g, " ") || "—"}
        </span>
      </div>
    </div>
  );
}

export default function EmployerReviewsPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingEvaluation[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "submitted">("pending");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [overallScore, setOverallScore] = useState<Record<string, number>>({});
  const [strengths, setStrengths] = useState<Record<string, string>>({});
  const [improvements, setImprovements] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<Record<string, string>>({});

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

      const [pendingData, submittedData] = await Promise.all([
        fetchPendingEvaluations(token),
        fetchSubmittedEvaluations(token),
      ]);

      setPending(pendingData);
      setSubmitted(submittedData);
    } catch (err: any) {
      console.error("Reviews load error:", err);
      toast.error(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  function scoreFor(attachmentId: string, key: string): number {
    return scores[attachmentId]?.[key] ?? 5;
  }

  function setScoreFor(attachmentId: string, key: string, value: number) {
    setScores((prev) => ({ ...prev, [attachmentId]: { ...prev[attachmentId], [key]: value } }));
  }

  async function handleSubmit(attachment: PendingEvaluation) {
    setSubmittingId(attachment.id);
    try {
      const session = await createClient().auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Session expired");

      await submitEvaluation(token, attachment.id, {
        punctuality_score: scoreFor(attachment.id, "punctuality_score"),
        teamwork_score: scoreFor(attachment.id, "teamwork_score"),
        communication_score: scoreFor(attachment.id, "communication_score"),
        technical_skills_score: scoreFor(attachment.id, "technical_skills_score"),
        initiative_score: scoreFor(attachment.id, "initiative_score"),
        overall_score: overallScore[attachment.id] ?? 50,
        strengths: strengths[attachment.id] || undefined,
        areas_for_improvement: improvements[attachment.id] || undefined,
        recommendation: recommendation[attachment.id] || "recommend",
      });

      toast.success("Evaluation submitted");
      setPending((prev) => prev.filter((p) => p.id !== attachment.id));
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit evaluation");
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Score students who have completed attachments at your organization.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "submitted"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Submitted ({submitted.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No pending evaluations.</p>
              <p className="mt-1 text-xs text-muted-foreground">Completed attachments awaiting review will appear here.</p>
            </div>
          ) : (
            pending.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{p.student_name || "Student"}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"} –{" "}
                    {p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {SCORE_DIMENSIONS.map((dim) => (
                    <ScoreSlider
                      key={dim.key}
                      label={dim.label}
                      value={scoreFor(p.id, dim.key)}
                      onChange={(v) => setScoreFor(p.id, dim.key, v)}
                    />
                  ))}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium">Overall Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={overallScore[p.id] ?? 50}
                    onChange={(e) =>
                      setOverallScore((prev) => ({ ...prev, [p.id]: parseInt(e.target.value) || 0 }))
                    }
                    className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Strengths</label>
                    <textarea
                      value={strengths[p.id] || ""}
                      onChange={(e) => setStrengths((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Areas for Improvement</label>
                    <textarea
                      value={improvements[p.id] || ""}
                      onChange={(e) => setImprovements((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Recommendation</p>
                  <div className="grid grid-cols-4 gap-2">
                    {RECOMMENDATIONS.map((r) => (
                      <RecommendationButton
                        key={r.value}
                        selected={(recommendation[p.id] || "recommend") === r.value}
                        onClick={() => setRecommendation((prev) => ({ ...prev, [p.id]: r.value }))}
                        icon={r.icon}
                        label={r.label}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSubmit(p)}
                  disabled={submittingId === p.id}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submittingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Evaluation
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "submitted" && (
        <div className="space-y-4">
          {submitted.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Award className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No evaluations submitted yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Evaluations you submit will appear here.</p>
            </div>
          ) : (
            submitted.map((ev) => <SubmittedCard key={ev.id} ev={ev} />)
          )}
        </div>
      )}
    </div>
  );
}
