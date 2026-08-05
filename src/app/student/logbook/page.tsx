"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserWithTimeout } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, Plus, CheckCircle, Clock } from "lucide-react";

export default function LogbookPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    week_number: 1,
    tasks_completed: "",
    skills_learned: "",
    challenges_faced: "",
    supervisor_name: "",
    hours_worked: 8,
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data: { user } } = await getUserWithTimeout();
    if (!user) return;
    const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single();
    if (!profile) return;

    const { data } = await supabase
      .from("logbook_entries")
      .select("*")
      .eq("student_id", profile.id)
      .order("entry_date", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    const { data: { user } } = await getUserWithTimeout();
    if (!user) return;
    const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single();
    if (!profile) return;

    const { error } = await supabase.from("logbook_entries").insert({
      student_id: profile.id,
      ...form,
    });

    if (error) toast.error("Failed to add entry");
    else {
      toast.success("Logbook entry added");
      setShowForm(false);
      fetchEntries();
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + (e.hours_worked || 0), 0);

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attachment Logbook</h1>
            <p className="text-muted-foreground">Record your daily industrial attachment activities.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">{totalHours.toFixed(1)}h</p>
            <p className="text-sm text-muted-foreground">Total Hours Logged</p>
          </div>
        </div>

        <Button className="mb-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />{showForm ? "Cancel" : "Add Entry"}
        </Button>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>New Logbook Entry</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Date</Label><Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></div>
                <div><Label>Week #</Label><Input type="number" value={form.week_number} onChange={(e) => setForm({ ...form, week_number: parseInt(e.target.value) || 1 })} /></div>
                <div><Label>Hours Worked</Label><Input type="number" step="0.5" value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div><Label>Tasks Completed</Label><Textarea value={form.tasks_completed} onChange={(e) => setForm({ ...form, tasks_completed: e.target.value })} /></div>
              <div><Label>Skills Learned</Label><Textarea value={form.skills_learned} onChange={(e) => setForm({ ...form, skills_learned: e.target.value })} /></div>
              <div><Label>Challenges Faced</Label><Textarea value={form.challenges_faced} onChange={(e) => setForm({ ...form, challenges_faced: e.target.value })} /></div>
              <div><Label>Supervisor Name</Label><Input value={form.supervisor_name} onChange={(e) => setForm({ ...form, supervisor_name: e.target.value })} /></div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>Save Entry</Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">Week {entry.week_number}</span>
                    <span className="text-muted-foreground">{new Date(entry.entry_date).toLocaleDateString()}</span>
                  </div>
                  {entry.is_approved ? (
                    <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                  ) : (
                    <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                  )}
                </div>
                <p className="text-foreground mb-2"><strong>Tasks:</strong> {entry.tasks_completed}</p>
                {entry.skills_learned && <p className="text-muted-foreground text-sm mb-1"><strong>Skills:</strong> {entry.skills_learned}</p>}
                {entry.challenges_faced && <p className="text-muted-foreground text-sm mb-1"><strong>Challenges:</strong> {entry.challenges_faced}</p>}
                <p className="text-sm text-muted-foreground mt-2">Hours: {entry.hours_worked} | Supervisor: {entry.supervisor_name || "N/A"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

