"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchUnassignedStudents,
  fetchInstitutionOptions,
  assignInstitution,
  type UnassignedStudent,
  type InstitutionOption,
} from "@/lib/api";
import { useAdminKey } from "@/components/admin/AdminKeyContext";
import {
  Building2,
  User,
  BookOpen,
  Calendar,
  Loader2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function StudentAssignmentsPage() {
  const { adminKey } = useAdminKey();
  const [students, setStudents] = useState<UnassignedStudent[]>([]);
  const [count, setCount] = useState(0);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!adminKey) return;
    loadData();
  }, [adminKey]);

  async function loadData() {
    setLoading(true);
    try {
      const [studentsRes, institutionsRes] = await Promise.all([
        fetchUnassignedStudents(adminKey!),
        fetchInstitutionOptions(adminKey!),
      ]);
      setStudents(studentsRes.data);
      setCount(studentsRes.count);
      setInstitutions(institutionsRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(studentId: string) {
    const institutionId = selectedInstitution[studentId];
    if (!institutionId) {
      toast.error("Select an institution first");
      return;
    }

    setAssigningId(studentId);
    try {
      await assignInstitution(adminKey!, studentId, institutionId);
      toast.success("Institution assigned");
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setCount((c) => c - 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign");
    } finally {
      setAssigningId(null);
    }
  }

  if (!adminKey) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted-foreground">Admin key required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Assign uploaded students to their home institutions so they can be matched to attachment opportunities.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unassigned Students</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">All students are assigned.</p>
          <p className="mt-1 text-xs text-muted-foreground">New uploads will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{s.student_name || "—"}</span>
                    <span className="text-xs text-muted-foreground">({s.registration_number || "—"})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{s.course || "—"} {s.year_of_study ? `· Year ${s.year_of_study}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Uploaded {new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:w-72">
                  <select
                    value={selectedInstitution[s.id] || ""}
                    onChange={(e) =>
                      setSelectedInstitution((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select institution...</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} {i.country?.name ? `(${i.country.name})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(s.id)}
                    disabled={assigningId === s.id || !selectedInstitution[s.id]}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {assigningId === s.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Assign <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
