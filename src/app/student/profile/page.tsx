"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, GraduationCap, MapPin, Globe, Save } from "lucide-react";

export default function StudentProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    course_name: "",
    course_category: "",
    year_of_study: 1,
    preferred_locations: "",
    preferred_industries: "",
    skills: "",
    portfolio_url: "",
    linkedin_url: "",
    github_url: "",
    is_open_to_remote: false,
    is_open_to_relocation: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/student/profile");
        return;
      }

      const { data } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          course_name: data.course_name || "",
          course_category: data.course_category || "",
          year_of_study: data.year_of_study || 1,
          preferred_locations: (data.preferred_locations || []).join(", "),
          preferred_industries: (data.preferred_industries || []).join(", "),
          skills: (data.skills || []).join(", "),
          portfolio_url: data.portfolio_url || "",
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          is_open_to_remote: data.is_open_to_remote || false,
          is_open_to_relocation: data.is_open_to_relocation || false,
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase, router]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const updates = {
      full_name: form.full_name,
      phone: form.phone,
      course_name: form.course_name,
      course_category: form.course_category,
      year_of_study: form.year_of_study,
      preferred_locations: form.preferred_locations.split(",").map((s: string) => s.trim()).filter(Boolean),
      preferred_industries: form.preferred_industries.split(",").map((s: string) => s.trim()).filter(Boolean),
      skills: form.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
      portfolio_url: form.portfolio_url,
      linkedin_url: form.linkedin_url,
      github_url: form.github_url,
      is_open_to_remote: form.is_open_to_remote,
      is_open_to_relocation: form.is_open_to_relocation,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("student_profiles")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

    if (error) toast.error("Failed to save profile");
    else toast.success("Profile saved successfully");
    setSaving(false);
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
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Student Profile</h1>
        <p className="text-muted-foreground mb-8">Complete your profile to get better internship matches.</p>

        {profile?.is_university_verified && (
          <Badge className="bg-emerald-100 text-emerald-700 mb-6">
            <GraduationCap className="w-3 h-3 mr-1" />University Verified
          </Badge>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5" />Academic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Course Name</Label><Input value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} /></div>
              <div><Label>Course Category</Label><Input value={form.course_category} onChange={(e) => setForm({ ...form, course_category: e.target.value })} /></div>
              <div><Label>Year of Study</Label><Input type="number" min={1} max={6} value={form.year_of_study} onChange={(e) => setForm({ ...form, year_of_study: parseInt(e.target.value) || 1 })} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Preferred Locations (comma separated)</Label><Input value={form.preferred_locations} onChange={(e) => setForm({ ...form, preferred_locations: e.target.value })} /></div>
            <div><Label>Preferred Industries (comma separated)</Label><Input value={form.preferred_industries} onChange={(e) => setForm({ ...form, preferred_industries: e.target.value })} /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.is_open_to_remote} onCheckedChange={(v) => setForm({ ...form, is_open_to_remote: v })} /><Label>Open to Remote</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_open_to_relocation} onCheckedChange={(v) => setForm({ ...form, is_open_to_relocation: v })} /><Label>Open to Relocation</Label></div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Online Presence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Portfolio URL</Label><Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} /></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
            <div><Label>GitHub URL</Label><Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} /></div>
            <div><Label>Skills (comma separated)</Label><Textarea value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}

