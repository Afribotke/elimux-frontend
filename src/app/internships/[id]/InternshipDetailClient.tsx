"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Users, Star, Building2,
  Briefcase, Clock, CheckCircle, AlertTriangle
} from "lucide-react";

export default function InternshipDetailClient({ internship }: { internship: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const checkApplication = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;
      const { data: app } = await supabase
        .from("applications")
        .select("id")
        .eq("student_id", profile.id)
        .eq("internship_id", internship.id)
        .maybeSingle();
      setHasApplied(!!app);
    };
    checkApplication();
  }, [internship.id, supabase]);

  const employer = internship.employer;

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.push("/internships")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Internships
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {employer?.logo_url ? (
                  <img src={employer.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-emerald-600" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{internship.title}</CardTitle>
                  <p className="text-muted-foreground">{employer?.company_name}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {internship.is_featured && <Badge className="bg-amber-500 text-white">Featured</Badge>}
                <Badge className={internship.is_paid ? "bg-green-500 text-white" : "bg-gray-400 text-white"}>
                  {internship.is_paid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>{internship.profession_category}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{internship.location_county}{internship.is_remote && " (Remote)"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{internship.duration_weeks} weeks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{internship.remaining_slots} slots left</span>
              </div>
            </div>

            {internship.is_paid && (
              <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Stipend: KES {internship.stipend_amount_min?.toLocaleString()} - {internship.stipend_amount_max?.toLocaleString()} / month
                </span>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-foreground mb-2">About this Role</h3>
              <p className="text-muted-foreground whitespace-pre-line">{internship.description}</p>
            </div>

            {internship.requirements && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Requirements</h3>
                <p className="text-muted-foreground whitespace-pre-line">{internship.requirements}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Application Deadline: {new Date(internship.application_deadline).toLocaleDateString()}</span>
            </div>

            {employer?.average_rating > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="font-medium">{employer.average_rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({employer.review_count} reviews)</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                {internship.nita_registered ? (
                  <><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-emerald-700">NITA Registered</span></>
                ) : (
                  <><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-amber-600">Not NITA Registered</span></>
                )}
              </div>
              {hasApplied ? (
                <Button disabled className="bg-gray-400">Already Applied</Button>
              ) : (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => router.push(`/internships/${internship.id}/apply`)}>
                  Apply Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

