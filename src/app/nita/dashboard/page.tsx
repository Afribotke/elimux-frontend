"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Building2, CheckCircle, AlertTriangle, Search } from "lucide-react";

export default function NitaDashboardPage() {
  const supabase = createClient();
  const [employers, setEmployers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    const { data } = await supabase
      .from("employers")
      .select("*, inspections:nita_inspections(*)")
      .eq("nita_registered", true)
      .order("created_at", { ascending: false });
    setEmployers(data || []);
    setLoading(false);
  };

  const filtered = employers.filter((e) =>
    e.company_name.toLowerCase().includes(search.toLowerCase()) ||
    e.nita_registration_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-muted py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">NITA Oversight Dashboard</h1>
            <p className="text-muted-foreground">Monitor registered employers and compliance.</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700"><Shield className="w-3 h-3 mr-1" />NITA Official</Badge>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search by company or NITA number..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><Building2 className="w-8 h-8 text-blue-600" /><div><p className="text-2xl font-bold">{employers.length}</p><p className="text-muted-foreground">NITA Registered Employers</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><CheckCircle className="w-8 h-8 text-emerald-600" /><div><p className="text-2xl font-bold">{employers.filter((e) => e.verification_status === "approved").length}</p><p className="text-muted-foreground">Verified Employers</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><AlertTriangle className="w-8 h-8 text-amber-600" /><div><p className="text-2xl font-bold">{employers.filter((e) => e.verification_status === "pending").length}</p><p className="text-muted-foreground">Pending Review</p></div></div></CardContent></Card>
        </div>

        <div className="space-y-4">
          {filtered.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold">{emp.company_name}</h3>
                      <Badge className={emp.verification_status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}>
                        {emp.verification_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">NITA No: {emp.nita_registration_number || "N/A"} | {emp.industry} | {emp.location_county}</p>
                    <p className="text-sm text-muted-foreground mt-1">{emp.description}</p>
                  </div>
                </div>
                {emp.inspections?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Inspection History</p>
                    <div className="space-y-2">
                      {emp.inspections.map((insp: any) => (
                        <div key={insp.id} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{new Date(insp.inspection_date).toLocaleDateString()}</span>
                          <Badge className={insp.compliance_status === "compliant" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {insp.compliance_status}
                          </Badge>
                          <span className="text-muted-foreground">{insp.inspector_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

