"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Briefcase, Clock, MapPin, ArrowRight, FileText, Calendar } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  interview_scheduled: "bg-purple-100 text-purple-700",
  offered: "bg-green-100 text-green-700",
  accepted: "bg-emerald-500 text-white",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-muted text-muted-foreground",
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const { data: { user } } = await getUserWithTimeout();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) { router.push("/student/profile"); return; }

      const { data, error } = await supabase
        .from("applications")
        .select("*, internship:internships(title, profession_category, location_county, employer:employers(company_name))")
        .eq("student_id", profile.id)
        .order("submitted_at", { ascending: false });

      if (error) toast.error("Failed to load applications");
      else setApplications(data || []);
      setLoading(false);
    };
    fetchApplications();
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
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Applications</h1>
        <p className="text-muted-foreground mb-8">Track all your internship applications in one place.</p>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6">Start applying to internships to see them here.</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push("/internships")}>
                Browse Internships<ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{app.internship?.title}</h3>
                        <Badge className={STATUS_COLORS[app.status] || "bg-muted"}>
                          {app.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{app.internship?.employer?.company_name}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{app.internship?.profession_category}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{app.internship?.location_county}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Applied {new Date(app.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {app.interview_date && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700 font-medium">Interview Scheduled</p>
                          <p className="text-sm text-purple-600">
                            {new Date(app.interview_date).toLocaleString()}
                            {app.interview_location && ` at ${app.interview_location}`}
                          </p>
                        </div>
                      )}
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

