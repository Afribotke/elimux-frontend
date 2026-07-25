"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, CheckCircle, XCircle, Mail, Phone } from "lucide-react";

export default function AdminPotentialEmployersPage() {
  const supabase = createClient();
  const [employers, setEmployers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    const { data } = await supabase.from("potential_employers").select("*").order("created_at", { ascending: false });
    setEmployers(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const { error } = await supabase.from("potential_employers").update({ status, admin_notes: notes }).eq("id", id);
    if (error) toast.error("Failed to update");
    else {
      toast.success(`Status updated to ${status}`);
      fetchEmployers();
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    contacted: "bg-blue-100 text-blue-700",
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
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">Potential Employers</h1>
        <p className="text-muted-foreground mb-8">Review and approve employer registrations.</p>

        <div className="space-y-4">
          {employers.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{emp.company_name}</h3>
                      <Badge className={STATUS_COLORS[emp.status] || ""}>{emp.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{emp.company_email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{emp.company_phone}</span>
                      <span>{emp.industry}</span>
                      <span>{emp.source}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Contact: {emp.contact_person_name} ({emp.contact_person_email})</p>
                    {emp.admin_notes && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded">Notes: {emp.admin_notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(emp.id, "approved")}>
                      <CheckCircle className="w-4 h-4 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(emp.id, "contacted")}>Contacted</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(emp.id, "rejected")}>
                      <XCircle className="w-4 h-4 mr-1" />Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

