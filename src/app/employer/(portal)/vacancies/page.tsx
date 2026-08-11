"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pause, Play, Eye } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-foreground",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  closed: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function EmployerVacanciesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      const { data: { user } } = await getUserWithTimeout();
      if (!user) { setLoading(false); return; }

      // Team-member-aware lookup, matching dashboard/applications/requisitions -
      // the previous employers.user_id-only lookup only ever matched the
      // original registering owner, so any invited team member hit this early
      // return with setLoading(false) never called, spinning forever.
      const { data: teamMember } = await supabase
        .from("employer_team_members")
        .select("employer_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();
      if (!teamMember) { setLoading(false); return; }

      const { data } = await supabase
        .from("internships")
        .select("*, applications:applications(count)")
        .eq("employer_id", teamMember.employer_id)
        .order("created_at", { ascending: false });
      setVacancies(data || []);
      setLoading(false);
    };
    fetchVacancies();
  }, [supabase]);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    const { error } = await supabase.from("internships").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Failed to update");
    else {
      toast.success(`Vacancy ${newStatus}`);
      setVacancies(vacancies.map((v) => v.id === id ? { ...v, status: newStatus } : v));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Vacancies</h1>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/employer/vacancies/new")}>
            <Plus className="w-4 h-4 mr-2" />Post New
          </Button>
        </div>

        {vacancies.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No vacancies posted yet.</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/employer/vacancies/new")}>
                Create Your First Internship
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {vacancies.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{v.title}</h3>
                        <Badge className={STATUS_COLORS[v.status] || ""}>{v.status}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{v.profession_category} | {v.location_county} | {v.duration_weeks} weeks</p>
                      <p className="text-sm text-muted-foreground">{v.remaining_slots} of {v.total_slots} slots remaining</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(v.id, v.status)}>
                        {v.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/internships/${v.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

