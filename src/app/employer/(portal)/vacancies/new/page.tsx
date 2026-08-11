"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const PROFESSIONS = [
  "Engineering","Information Technology","Healthcare and Medicine","Education",
  "Business and Finance","Agriculture","Hospitality and Tourism","Media and Communications",
  "Law and Legal","Architecture and Design","Science and Research","Social Sciences","Arts and Culture"
];

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos","Kajiado",
  "Nyeri","Meru","Kakamega","Bungoma","Kisii","Nyamira","Kericho","Bomet","Nandi",
  "Elgeyo Marakwet","West Pokot","Turkana","Samburu","Laikipia","Nyandarua","Murang'a",
  "Kirinyaga","Embu","Tharaka Nithi","Kitui","Makueni","Taita Taveta","Kilifi","Kwale",
  "Lamu","Tana River","Garissa","Wajir","Mandera","Marsabit","Isiolo","Busia","Siaya",
  "Homa Bay","Migori"
];

export default function NewVacancyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    department_id: '',
    title: "",
    description: "",
    requirements: "",
    profession_category: "",
    location_county: "",
    is_remote: false,
    is_hybrid: false,
    duration_weeks: 12,
    total_slots: 1,
    is_paid: false,
    stipend_amount_min: 0,
    stipend_amount_max: 0,
    min_year_of_study: 1,
    application_deadline: "",
    start_date: "",
    end_date: "",
    requires_cover_letter: false,
    requires_portfolio: false,
    requires_video_intro: false,
    nita_registered: false,
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    const { data: { user } } = await getUserWithTimeout();
    if (!user) { toast.error("Please log in"); setSubmitting(false); return; }

    // Team-member-aware lookup, matching dashboard/applications/requisitions -
    // the previous employers.user_id-only lookup only matched the original
    // registering owner, so a legitimate invited team member was incorrectly
    // told to register and redirected away. Also: setSubmitting(false) was
    // missing from both early returns, so the button got stuck on
    // "Posting..." forever if either check failed.
    const { data: teamMember } = await supabase
      .from("employer_team_members")
      .select("employer_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();
    if (!teamMember) { toast.error("Not associated with an employer account"); setSubmitting(false); return; }

    const { error } = await supabase.from("internships").insert({
      employer_id: teamMember.employer_id,
      ...form,
      remaining_slots: form.total_slots,
      status: "active",
    });

    if (error) toast.error("Failed to create: " + error.message);
    else {
      toast.success("Internship posted successfully");
      router.push("/employer/vacancies");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="ghost" className="mb-4" onClick={() => router.push("/employer/vacancies")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-8">Post New Internship</h1>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Engineering Intern" /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
            <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Profession Category *</Label>
                <Select value={form.profession_category} onValueChange={(v) => setForm({ ...form, profession_category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>County</Label>
                <Select value={form.location_county} onValueChange={(v) => setForm({ ...form, location_county: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Duration (weeks)</Label><Input type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>Total Slots</Label><Input type="number" value={form.total_slots} onChange={(e) => setForm({ ...form, total_slots: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>Min Year of Study</Label><Input type="number" min={1} max={6} value={form.min_year_of_study} onChange={(e) => setForm({ ...form, min_year_of_study: parseInt(e.target.value) || 1 })} /></div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_paid} onCheckedChange={(v) => setForm({ ...form, is_paid: v })} /><Label>Paid Internship</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_remote} onCheckedChange={(v) => setForm({ ...form, is_remote: v })} /><Label>Remote</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_hybrid} onCheckedChange={(v) => setForm({ ...form, is_hybrid: v })} /><Label>Hybrid</Label></div>
            </div>

            {form.is_paid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Stipend Min (KES)</Label><Input type="number" value={form.stipend_amount_min} onChange={(e) => setForm({ ...form, stipend_amount_min: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Stipend Max (KES)</Label><Input type="number" value={form.stipend_amount_max} onChange={(e) => setForm({ ...form, stipend_amount_max: parseInt(e.target.value) || 0 })} /></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>Application Deadline *</Label><Input type="date" value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} /></div>
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>

            <div className="border-t pt-4">
              <p className="font-medium mb-3">Application Requirements</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.requires_cover_letter} onCheckedChange={(v) => setForm({ ...form, requires_cover_letter: v })} /><Label>Cover Letter</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.requires_portfolio} onCheckedChange={(v) => setForm({ ...form, requires_portfolio: v })} /><Label>Portfolio</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.requires_video_intro} onCheckedChange={(v) => setForm({ ...form, requires_video_intro: v })} /><Label>Video Intro</Label></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.nita_registered} onCheckedChange={(v) => setForm({ ...form, nita_registered: v })} />
              <Label>NITA Registered</Label>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={submitting}>
              <Save className="w-4 h-4 mr-2" />{submitting ? "Posting..." : "Post Internship"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


