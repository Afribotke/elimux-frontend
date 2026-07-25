"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";

export default function EmployerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [employer, setEmployer] = useState<any>(null);
  const [stats, setStats] = useState({ active: 0, totalApps: 0, shortlisted: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: emp } = await supabase.from("employers").select("*").eq("user_id", user.id).single();
      if (!emp) { router.push("/employer/register"); return; }
      setEmployer(emp);

      const { data: internships } = await supabase.from("internships").select("id,status").eq("employer_id", emp.id);
      const active = (internships || []).filter((i: any) => i.status === "active").length;

      const internshipIds = (internships || []).map((i: any) => i.id);
      const { data: apps } = await supabase
        .from("applications")
        .select("*, student:student_profiles(full_name, course_name, university_name)")
        .in("internship_id", internshipIds)
        .order("submitted_at", { ascending: false })
        .limit(5);

      setStats({
        active,
        totalApps: apps?.length || 0,
        shortlisted: (apps || []).filter((a: any) => a.status === "shortlisted").length,
      });
      setRecentApps(apps || []);
      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{employer?.company_name}</h1>
            <p className="text-muted-foreground">Employer Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/employer/vacancies")}>My Vacancies</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/employer/vacancies/new")}>
              <Plus className="w-4 h-4 mr-2" />Post New Internship
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><Briefcase className="w-8 h-8 text-emerald-600" /><div><p className="text-2xl font-bold">{stats.active}</p><p className="text-muted-foreground">Active Vacancies</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><Users className="w-8 h-8 text-blue-600" /><div><p className="text-2xl font-bold">{stats.totalApps}</p><p className="text-muted-foreground">Total Applications</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><TrendingUp className="w-8 h-8 text-purple-600" /><div><p className="text-2xl font-bold">{stats.shortlisted}</p><p className="text-muted-foreground">Shortlisted</p></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Applications</CardTitle></CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No applications yet.</p>
            ) : (
              <div className="space-y-4">
                {recentApps.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted">
                    <div>
                      <p className="font-medium">{app.student?.full_name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{app.student?.course_name} at {app.student?.university_name}</p>
                      <Badge className="mt-1">{app.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/employer/vacancies`)}>
                      Review<ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

